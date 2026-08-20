import {
  addCondition,
  applyEnv,
  applyTrust,
  canCarry,
  effectiveMax,
  enterState,
  exitState,
  isIn,
} from "./core";
import { TUNING } from "./tuning";
import type {
  CampAction,
  CampContext,
  CarryPayload,
  ConditionEvent,
  DecisionOutcome,
  HouseholdState,
  Member,
  MemberSeed,
  PersistentConditionKind,
  Result,
  TravelContext,
} from "./types";

export * from "./types";
export { TUNING } from "./tuning";
export { effectiveMax, speedMultiplier } from "./core";

/**
 * The household condition model.
 *
 * Every function here is pure: same state and inputs give the same state and the
 * same events, every time. Nothing renders, nothing schedules, nothing reaches
 * for a clock. The travel loop calls into this; this calls into nothing.
 *
 * Resolution order is fixed and documented per function, because the order is
 * load-bearing — scarring after clamping, contagion after spirit deltas, leg
 * counters after departure checks.
 */

const FULL = 100;

export function createHousehold(seeds: MemberSeed[]): HouseholdState {
  return {
    members: seeds.map((seed) => ({
      id: seed.id,
      name: seed.name,
      role: seed.role,
      age: seed.age,
      meters: {
        water: seed.meters?.water ?? FULL,
        body: seed.meters?.body ?? FULL,
        spirit: seed.meters?.spirit ?? FULL,
        trust: seed.meters?.trust ?? FULL,
      },
      maxes: { water: FULL, body: FULL, spirit: FULL, trust: FULL },
      states: new Set(["ok" as const]),
      conditions: [],
      scars: [],
      carrying: null,
      legsAtZeroTrust: 0,
      attachedTo: "player",
      returnProgress: { legsKept: 0, lastLegVisited: -1 },
      weakenedSinceLeg: null,
      dead: false,
    })),
    loads: [],
    leg: 0,
    legsResolved: [],
  };
}

/** Anyone the simulation should still be moving: alive, present, not departed. */
const active = (m: Member): boolean => !m.dead && m.attachedTo === "player";

const replace = (state: HouseholdState, member: Member): HouseholdState => ({
  ...state,
  members: state.members.map((m) => (m.id === member.id ? member : m)),
});

// --- Travel ------------------------------------------------------------------

/**
 * One in-game hour of walking.
 *
 * Order, and it matters: drain water, drain body, clamp and scar (both handled
 * inside `applyEnv`), then evaluate the two travel zero-states, then report any
 * collapsed member nobody is carrying so the consuming layer can prompt.
 *
 * `spirit` and `trust` are untouched here by design — the two social meters move
 * only at camp and at decisions, which is what keeps them legible instead of
 * noisy.
 */
export function travelTick(state: HouseholdState, ctx: TravelContext): Result {
  const events: ConditionEvent[] = [];
  let next: HouseholdState = { ...state, leg: ctx.leg };

  const carriedIds = new Set(
    state.members
      .filter((m) => active(m) && m.carrying?.type === "person")
      .map((m) => (m.carrying as { memberId: string }).memberId),
  );

  for (const original of state.members) {
    if (!active(original)) continue;
    let member = next.members.find((m) => m.id === original.id)!;

    // 1-2. Water. Heat, pace, age, and whether their hands are full.
    const carryingAnything = member.carrying !== null;
    const water =
      TUNING.waterDrainPerHour *
      ctx.hours *
      TUNING.paceMultiplier[ctx.pace] *
      TUNING.heatMultiplier[ctx.heat] *
      TUNING.ageMultiplier[member.age] *
      (carryingAnything ? TUNING.carryingWaterMultiplier : 1);

    // 3. Body. Pressing on, running dry, being carried, and carrying.
    let body = 0;
    if (ctx.pace !== "steady") body += TUNING.bodyDrainPerHour.basePressing * ctx.hours;
    if (member.meters.water <= TUNING.lowWaterThreshold) {
      body += TUNING.bodyDrainPerHour.lowWater * ctx.hours;
    }
    if (isIn(member, "collapsed")) body += TUNING.bodyDrainPerHour.collapsed * ctx.hours;
    if (carryingAnything) body += TUNING.bodyDrainPerHour.carrying * ctx.hours;

    // 4-5, 7. Clamp and scar happen inside; the environment cannot reach trust.
    const applied = applyEnv(member, { water: -water, body: -body }, ctx.leg, "the march");
    member = applied.member;
    events.push(...applied.events);

    // Water zero -> collapsed. They cannot move under their own power.
    if (member.meters.water === 0 && !isIn(member, "collapsed")) {
      const entered = enterState(member, "collapsed");
      member = entered.member;
      events.push(...entered.events);
      // A collapsed carrier drops nothing automatically — the player decides.
    } else if (member.meters.water >= TUNING.collapseExitWater && isIn(member, "collapsed")) {
      const left = exitState(member, "collapsed");
      member = left.member;
      events.push(...left.events);
      const weak = enterState(member, "weakened");
      member = { ...weak.member, weakenedSinceLeg: ctx.leg };
      events.push(...weak.events);
    }

    // Body zero -> straggling. Out of the march entirely.
    if (member.meters.body === 0 && !isIn(member, "straggling")) {
      const entered = enterState(member, "straggling");
      member = entered.member;
      events.push(...entered.events, { kind: "ColumnLost", memberId: member.id });
      const hurt = addCondition(member, conditionFor(ctx));
      member = hurt.member;
      events.push(...hurt.events);
    }

    // 6. A collapsed member nobody has picked up. Reported, never auto-resolved.
    if (isIn(member, "collapsed") && !carriedIds.has(member.id)) {
      events.push({ kind: "CarrierNeeded", memberId: member.id });
    }

    next = replace(next, member);
  }

  return { state: next, events };
}

/** Which persistent condition a collapse in these conditions leaves behind. */
function conditionFor(ctx: TravelContext): PersistentConditionKind {
  if (ctx.heat === "midday" || ctx.heat === "afternoon") return "sunstruck";
  return ctx.pace === "forced" ? "limp" : "fever";
}

// --- Camp --------------------------------------------------------------------

/**
 * The end of a leg, and the night that follows it.
 *
 * Order: spirit from the leg's own conditions, then contagion, then the spirit
 * zero-state, then rest and treatment and water, then the leg-boundary rules —
 * a collapsed member nobody carried is left behind, `weakened` expires, and the
 * zero-trust departure clock advances.
 *
 * Spirit is never restored by rest, water, food, or any item. Only the three
 * routes in §4.3 clear murmuring, and all three cost the player time.
 */
export function resolveCamp(state: HouseholdState, ctx: CampContext): Result {
  const events: ConditionEvent[] = [];
  let next: HouseholdState = { ...state, leg: ctx.leg };
  const alreadyResolved = state.legsResolved.includes(ctx.leg);

  // 1. Spirit from the leg's conditions.
  if (ctx.legSpiritDelta) {
    for (const m of next.members.filter(active)) {
      const applied = applyEnv(m, { spirit: ctx.legSpiritDelta }, ctx.leg, "the leg");
      next = replace(next, applied.member);
      events.push(...applied.events);
    }
  }

  // 2. Contagion. Grumbling in this story is communal, so it spreads to the
  //    household and to the neighbours sharing the camp group.
  const murmurers = next.members.filter((m) => active(m) && isIn(m, "murmuring"));
  if (murmurers.length > 0) {
    const perMember = TUNING.contagionPerMurmurer * murmurers.length;
    for (const m of next.members.filter(active)) {
      if (murmurers.some((x) => x.id === m.id)) continue;
      const applied = applyEnv(m, { spirit: perMember }, ctx.leg, "murmuring in the camp");
      next = replace(next, applied.member);
      events.push(...applied.events);
    }
    events.push({
      kind: "ContagionSpread",
      murmurers: murmurers.map((m) => m.id),
      perMember,
    });
  }

  // 3. Spirit zero -> murmuring.
  for (const m of next.members.filter(active)) {
    if (m.meters.spirit === 0 && !isIn(m, "murmuring")) {
      const entered = enterState(m, "murmuring");
      next = replace(next, entered.member);
      events.push(...entered.events);
    }
  }

  // 4. Rest, treatment, water. None of these touch spirit.
  for (const action of ctx.actions) {
    const applied = applyCampAction(next, action, ctx.leg);
    next = applied.state;
    events.push(...applied.events);
  }

  if (ctx.rested === false) {
    for (const m of next.members.filter(active)) {
      const applied = applyEnv(
        m,
        { body: -TUNING.nightWithoutRestBodyLoss },
        ctx.leg,
        "a night without rest",
      );
      next = replace(next, applied.member);
      events.push(...applied.events);
    }
  }

  /*
   * 4b. Evaluate the two travel zero-states here as well.
   *
   * `travelTick` is the usual way in, but a member can arrive at camp already at
   * zero — set by scripted content, or restored from a save. Deriving the state
   * from the meter rather than trusting a previous tick to have done it keeps the
   * model correct however it is driven.
   */
  for (const m of next.members.filter(active)) {
    let member = m;
    if (member.meters.water === 0 && !isIn(member, "collapsed")) {
      const entered = enterState(member, "collapsed");
      member = entered.member;
      events.push(...entered.events);
    }
    if (member.meters.body === 0 && !isIn(member, "straggling")) {
      const entered = enterState(member, "straggling");
      member = entered.member;
      events.push(...entered.events, { kind: "ColumnLost", memberId: member.id });
      const hurt = addCondition(member, "fever");
      member = hurt.member;
      events.push(...hurt.events);
    }
    next = replace(next, member);
  }

  // 5. Leg-boundary rules. Guarded so a second camp on the same leg is harmless.
  if (!alreadyResolved) {
    const carried = new Set(
      next.members
        .filter((m) => active(m) && m.carrying?.type === "person")
        .map((m) => (m.carrying as { memberId: string }).memberId),
    );

    for (const m of next.members.filter(active)) {
      let member = m;

      // Collapsed and nobody carried them: the column has gone on without them.
      if (isIn(member, "collapsed") && !carried.has(member.id) && !isIn(member, "straggling")) {
        const entered = enterState(member, "straggling");
        member = entered.member;
        events.push(...entered.events, { kind: "ColumnLost", memberId: member.id });
        const hurt = addCondition(member, "fever");
        member = hurt.member;
        events.push(...hurt.events);
      }

      /*
       * Weakened lasts the remainder of the leg it began on, and no longer. The
       * leg check matters: a member watered back onto their feet at this very
       * camp would otherwise be granted the state and stripped of it in the same
       * call, and it would never exist.
       */
      if (isIn(member, "weakened") && (member.weakenedSinceLeg ?? ctx.leg) < ctx.leg) {
        const left = exitState(member, "weakened");
        member = { ...left.member, weakenedSinceLeg: null };
        events.push(...left.events);
      }

      // The departure clock. Two consecutive legs finished at zero trust.
      if (member.meters.trust === 0) {
        member = { ...member, legsAtZeroTrust: member.legsAtZeroTrust + 1 };
        if (member.legsAtZeroTrust >= TUNING.defiantLegsToDeparture) {
          member = { ...member, attachedTo: "another-household", carrying: null };
          events.push({
            kind: "MemberDeparted",
            memberId: member.id,
            toHousehold: "another-household",
          });
        }
      } else {
        member = { ...member, legsAtZeroTrust: 0 };
      }

      next = replace(next, member);
    }

    // A departed member's road back: trust rebuilt across whole legs, each with
    // a visit. One broken commitment resets it (see `resolveDecision`).
    for (const m of next.members.filter((x) => x.attachedTo !== "player" && !x.dead)) {
      const visitedThisLeg = m.returnProgress.lastLegVisited === ctx.leg;
      if (!visitedThisLeg || m.meters.trust < TUNING.returnTrustThreshold) continue;

      const legsKept = m.returnProgress.legsKept + 1;
      let member: Member = { ...m, returnProgress: { ...m.returnProgress, legsKept } };
      if (legsKept >= TUNING.returnMinimumLegs) {
        member = {
          ...member,
          attachedTo: "player",
          legsAtZeroTrust: 0,
          returnProgress: { legsKept: 0, lastLegVisited: -1 },
        };
        events.push({ kind: "MemberReturned", memberId: member.id });
      }
      next = replace(next, member);
    }

    next = { ...next, legsResolved: [...next.legsResolved, ctx.leg] };
  }

  return { state: next, events };
}

function applyCampAction(
  state: HouseholdState,
  action: CampAction,
  leg: number,
): Result {
  const events: ConditionEvent[] = [];
  let next = state;

  switch (action.kind) {
    case "rest": {
      for (const m of next.members.filter(active)) {
        // Body only. Rest has never cleared murmuring and never will.
        const applied = applyEnv(m, { body: TUNING.restBodyGain }, leg, "a night's rest");
        next = replace(next, applied.member);
        events.push(...applied.events);
      }
      return { state: next, events };
    }

    case "water": {
      for (const m of next.members.filter(active)) {
        const applied = applyEnv(m, { water: action.amount }, leg, "water at camp");
        let member = applied.member;
        events.push(...applied.events);
        if (member.meters.water >= TUNING.collapseExitWater && isIn(member, "collapsed")) {
          const left = exitState(member, "collapsed");
          member = left.member;
          events.push(...left.events);
          const weak = enterState(member, "weakened");
          member = { ...weak.member, weakenedSinceLeg: leg };
          events.push(...weak.events);
        }
        next = replace(next, member);
      }
      return { state: next, events };
    }

    case "treat": {
      const m = next.members.find((x) => x.id === action.memberId);
      if (!m) return { state: next, events };
      const conditions = m.conditions.map((c) =>
        c.nightsTreated < c.nightsToTreat ? { ...c, nightsTreated: c.nightsTreated + 1 } : c,
      );
      for (const c of conditions) {
        if (c.nightsTreated === c.nightsToTreat) {
          events.push({ kind: "ConditionTreated", memberId: m.id, condition: c.kind });
        }
      }
      next = replace(next, { ...m, conditions });
      return { state: next, events };
    }

    /** One of exactly three ways out of murmuring, and it costs the player time. */
    case "conversation": {
      const m = next.members.find((x) => x.id === action.memberId);
      if (!m || !action.completed) return { state: next, events };
      const applied = applyEnv(
        m,
        { spirit: TUNING.spiritCampConversation },
        leg,
        "a conversation at camp",
      );
      let member = applied.member;
      events.push(...applied.events);
      if (member.meters.spirit > 0 && isIn(member, "murmuring")) {
        const left = exitState(member, "murmuring");
        member = left.member;
        events.push(...left.events);
      }
      next = replace(next, member);
      return { state: next, events };
    }

    case "communal": {
      for (const m of next.members.filter(active)) {
        const applied = applyEnv(
          m,
          { spirit: TUNING.spiritCommunalEvent },
          leg,
          "a communal event",
        );
        let member = applied.member;
        events.push(...applied.events);
        if (member.meters.spirit > 0 && isIn(member, "murmuring")) {
          const left = exitState(member, "murmuring");
          member = left.member;
          events.push(...left.events);
        }
        next = replace(next, member);
      }
      return { state: next, events };
    }

    case "peerSupport": {
      const helper = next.members.find((x) => x.id === action.helperId);
      const recipient = next.members.find((x) => x.id === action.recipientId);
      if (!helper || !recipient) return { state: next, events };
      // Only somebody with spirit of their own to spare can do this.
      if (helper.meters.spirit < TUNING.peerSupportMinimumSpirit) return { state: next, events };

      const helped = applyEnv(
        recipient,
        { spirit: TUNING.spiritPeerSupport.recipient },
        leg,
        "somebody sat with them",
      );
      let target = helped.member;
      events.push(...helped.events);
      if (target.meters.spirit > 0 && isIn(target, "murmuring")) {
        const left = exitState(target, "murmuring");
        target = left.member;
        events.push(...left.events);
      }
      next = replace(next, target);

      const cost = applyEnv(
        helper,
        { spirit: TUNING.spiritPeerSupport.helper },
        leg,
        "sitting with somebody",
      );
      next = replace(next, cost.member);
      events.push(...cost.events);
      return { state: next, events };
    }

    case "visitDeparted": {
      const m = next.members.find((x) => x.id === action.memberId);
      if (!m) return { state: next, events };
      next = replace(next, {
        ...m,
        returnProgress: { ...m.returnProgress, lastLegVisited: leg },
      });
      return { state: next, events };
    }
  }
}

// --- Decisions ---------------------------------------------------------------

/**
 * The player made a choice, and it moved trust.
 *
 * This is the only function in the module that writes trust, which makes its
 * caller list a complete audit of everything that can affect it.
 */
export function resolveDecision(state: HouseholdState, outcome: DecisionOutcome): Result {
  const events: ConditionEvent[] = [];
  let next: HouseholdState = { ...state, leg: outcome.leg };

  for (const [memberId, amount] of Object.entries(outcome.trust)) {
    const m = next.members.find((x) => x.id === memberId);
    if (!m || m.dead) continue;

    const applied = applyTrust(m, amount, outcome.leg, "a decision you made");
    let member = applied.member;
    events.push(...applied.events);

    if (member.meters.trust === 0 && !isIn(member, "defiant")) {
      const entered = enterState(member, "defiant");
      member = entered.member;
      events.push(...entered.events);
    } else if (member.meters.trust >= TUNING.defiantExitTrust && isIn(member, "defiant")) {
      const left = exitState(member, "defiant");
      member = left.member;
      events.push(...left.events);
    }

    next = replace(next, member);
  }

  // A single broken commitment resets every departed member's road back.
  if (outcome.brokeCommitment) {
    for (const m of next.members.filter((x) => x.attachedTo !== "player")) {
      next = replace(next, {
        ...m,
        returnProgress: { legsKept: 0, lastLegVisited: -1 },
      });
    }
  }

  return { state: next, events };
}

// --- Carrying ----------------------------------------------------------------

/**
 * Put someone or something on an adult's back.
 *
 * One slot, and the whole mechanic lives in that constraint: picking up a
 * collapsed family member means putting down grain or water or tools, and the
 * player has to say which. Nothing is ever dropped automatically — an occupied
 * slot is rejected and the caller is told why.
 */
export function assignCarry(
  state: HouseholdState,
  carrierId: string,
  payload: CarryPayload | null,
): Result {
  const carrier = state.members.find((m) => m.id === carrierId);
  if (!carrier) {
    return {
      state,
      events: [{ kind: "CarryRejected", memberId: carrierId, reason: "no such member" }],
    };
  }

  if (payload === null) {
    return { state: replace(state, { ...carrier, carrying: null }), events: [] };
  }

  if (!canCarry(carrier)) {
    return {
      state,
      events: [
        {
          kind: "CarryRejected",
          memberId: carrierId,
          reason: "only an adult on their feet can carry anything",
        },
      ],
    };
  }

  if (carrier.carrying !== null) {
    return {
      state,
      events: [
        {
          kind: "CarryRejected",
          memberId: carrierId,
          reason:
            carrier.carrying.type === "load"
              ? "already carrying a load — abandon it first, and the choice is yours"
              : "already carrying somebody",
        },
      ],
    };
  }

  if (payload.type === "load") {
    const load = state.loads.find((l) => l.id === payload.loadId);
    if (!load || load.abandoned) {
      return {
        state,
        events: [{ kind: "CarryRejected", memberId: carrierId, reason: "that load is gone" }],
      };
    }
  }

  return { state: replace(state, { ...carrier, carrying: payload }), events: [] };
}

/**
 * Set a load down on the road. It does not come back.
 *
 * Explicit by design: this is the cost of picking up a person, and the player
 * has to make it themselves.
 */
export function abandonLoad(state: HouseholdState, loadId: string): Result {
  const load = state.loads.find((l) => l.id === loadId);
  if (!load || load.abandoned) return { state, events: [] };

  const holder =
    state.members.find(
      (m) => m.carrying?.type === "load" && m.carrying.loadId === loadId,
    ) ?? null;

  let next: HouseholdState = {
    ...state,
    loads: state.loads.map((l) => (l.id === loadId ? { ...l, abandoned: true } : l)),
  };
  if (holder) next = replace(next, { ...holder, carrying: null });

  return {
    state: next,
    events: [{ kind: "LoadAbandoned", loadId, byMemberId: holder?.id ?? null }],
  };
}

// --- Death -------------------------------------------------------------------

/**
 * The only way a member can die.
 *
 * Called from scripted narrative content by a writer, never from arithmetic.
 * There is no meter value, no combination, no duration at zero and no roll
 * anywhere in this module that reaches it — a fuzz test asserts as much.
 */
export function authoredDeath(
  state: HouseholdState,
  memberId: string,
  legId: number,
  reason: string,
): Result {
  const member = state.members.find((m) => m.id === memberId);
  if (!member || member.dead) return { state, events: [] };
  return {
    state: replace(state, { ...member, dead: true, carrying: null }),
    events: [{ kind: "AuthoredDeath", memberId, leg: legId, reason }],
  };
}

// --- Persistence -------------------------------------------------------------

/**
 * Stable JSON. Sets become sorted arrays and keys are written in a fixed order,
 * so the same run serialises byte-identically every time.
 */
export function serialize(state: HouseholdState): string {
  return JSON.stringify({
    leg: state.leg,
    legsResolved: [...state.legsResolved].sort((a, b) => a - b),
    loads: state.loads,
    members: state.members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      age: m.age,
      meters: m.meters,
      maxes: m.maxes,
      states: [...m.states].sort(),
      conditions: m.conditions,
      scars: m.scars,
      carrying: m.carrying,
      legsAtZeroTrust: m.legsAtZeroTrust,
      attachedTo: m.attachedTo,
      returnProgress: m.returnProgress,
      dead: m.dead,
    })),
  });
}

export function deserialize(json: string): HouseholdState {
  const raw = JSON.parse(json) as ReturnType<typeof JSON.parse>;
  return {
    leg: raw.leg,
    legsResolved: raw.legsResolved,
    loads: raw.loads,
    members: raw.members.map((m: Member & { states: string[] }) => ({
      ...m,
      states: new Set(m.states),
    })),
  } as HouseholdState;
}
