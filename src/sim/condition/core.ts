import { TUNING } from "./tuning";
import type {
  ConditionEvent,
  ConditionState,
  EnvDelta,
  Member,
  MeterName,
  PersistentConditionKind,
} from "./types";

/**
 * Meter arithmetic, scarring, and state transitions.
 *
 * The two things this file exists to guarantee:
 *
 *   1. **No write ever exceeds a meter's current max.** Every path goes through
 *      `writeMeter`, which clamps. There is no full-heal anywhere.
 *   2. **The environment cannot touch trust.** `applyEnv` takes an `EnvDelta`,
 *      whose key type excludes `trust`, so no environmental caller can even
 *      express the mutation. `applyTrust` is separate and is called only from
 *      decision resolution.
 */

const round = (n: number): number => Math.round(n * 100) / 100;

/** The ceiling for a meter right now, including any untreated condition cap. */
export function effectiveMax(member: Member, meter: MeterName): number {
  const base = member.maxes[meter];
  if (meter !== "body") return base;
  const capped = member.conditions
    .filter((c) => c.nightsTreated < c.nightsToTreat)
    .map((c) => c.capsBodyMaxAt);
  return capped.length > 0 ? Math.min(base, ...capped) : base;
}

/**
 * Write one meter, clamped to [0, effectiveMax].
 *
 * Returns whether this write brought the meter *down to* zero, which is what
 * earns a scar — sitting at zero across many ticks scars once, not once a tick.
 */
function writeMeter(
  member: Member,
  meter: MeterName,
  next: number,
): { member: Member; reachedZero: boolean } {
  const was = member.meters[meter];
  const value = round(Math.min(effectiveMax(member, meter), Math.max(0, next)));
  if (value === was) return { member, reachedZero: false };
  return {
    member: { ...member, meters: { ...member.meters, [meter]: value } },
    reachedZero: was > 0 && value === 0,
  };
}

/**
 * A meter reached zero: drop its ceiling permanently and record why.
 *
 * The floor stops a household from being ground into uselessness by a long
 * journey — it is a scar, not a death spiral.
 */
export function scar(
  member: Member,
  meter: MeterName,
  leg: number,
  cause: string,
): { member: Member; events: ConditionEvent[] } {
  const newMax = Math.max(TUNING.scarFloor, member.maxes[meter] - TUNING.scarPenalty);
  const scarred: Member = {
    ...member,
    maxes: { ...member.maxes, [meter]: newMax },
    scars: [...member.scars, { meter, leg, cause }],
    // The existing value may now sit above the new ceiling.
    meters: { ...member.meters, [meter]: Math.min(member.meters[meter], newMax) },
  };
  return {
    member: scarred,
    events: [
      { kind: "MeterZero", memberId: member.id, meter, leg },
      { kind: "Scarred", memberId: member.id, meter, newMax },
    ],
  };
}

/**
 * Apply an environmental change.
 *
 * The signature is the enforcement: `EnvDelta` has no `trust` key, so weather,
 * terrain, pace, heat and time have no way to reach it.
 */
export function applyEnv(
  member: Member,
  delta: EnvDelta,
  leg: number,
  cause: string,
): { member: Member; events: ConditionEvent[] } {
  let next = member;
  const events: ConditionEvent[] = [];
  for (const [meter, amount] of Object.entries(delta) as [MeterName, number][]) {
    if (amount === 0) continue;
    const written = writeMeter(next, meter, next.meters[meter] + amount);
    next = written.member;
    if (written.reachedZero) {
      const scarred = scar(next, meter, leg, cause);
      next = scarred.member;
      events.push(...scarred.events);
    }
  }
  return { member: next, events };
}

/**
 * Apply a trust change. The only route by which trust ever moves.
 *
 * Deliberately its own function with its own name so that a search for callers
 * is a complete audit of everything that can affect it.
 */
export function applyTrust(
  member: Member,
  amount: number,
  leg: number,
  cause: string,
): { member: Member; events: ConditionEvent[] } {
  if (amount === 0) return { member, events: [] };
  const written = writeMeter(member, "trust", member.meters.trust + amount);
  if (!written.reachedZero) return { member: written.member, events: [] };
  return scar(written.member, "trust", leg, cause);
}

// --- States ------------------------------------------------------------------

export function enterState(
  member: Member,
  state: ConditionState,
): { member: Member; events: ConditionEvent[] } {
  if (member.states.has(state)) return { member, events: [] };
  const states = new Set(member.states);
  states.add(state);
  states.delete("ok");
  return {
    member: { ...member, states },
    events: [{ kind: "StateEnter", memberId: member.id, state }],
  };
}

export function exitState(
  member: Member,
  state: ConditionState,
): { member: Member; events: ConditionEvent[] } {
  if (!member.states.has(state)) return { member, events: [] };
  const states = new Set(member.states);
  states.delete(state);
  if (states.size === 0) states.add("ok");
  return {
    member: { ...member, states },
    events: [{ kind: "StateExit", memberId: member.id, state }],
  };
}

export const isIn = (member: Member, state: ConditionState): boolean =>
  member.states.has(state);

/** Only adults carry, and never while collapsed, straggling or weakened. */
export function canCarry(member: Member): boolean {
  if (member.age !== "adult") return false;
  if (member.dead || member.attachedTo !== "player") return false;
  return !(
    isIn(member, "collapsed") ||
    isIn(member, "straggling") ||
    isIn(member, "weakened")
  );
}

/** How fast this member moves, as a multiplier. Weakened members hold everyone up. */
export function speedMultiplier(member: Member): number {
  return isIn(member, "weakened") ? TUNING.weakenedSpeedMultiplier : 1;
}

export function addCondition(
  member: Member,
  kind: PersistentConditionKind,
): { member: Member; events: ConditionEvent[] } {
  if (member.conditions.some((c) => c.kind === kind && c.nightsTreated < c.nightsToTreat)) {
    return { member, events: [] };
  }
  const condition = {
    kind,
    capsBodyMaxAt: TUNING.persistentConditionBodyCap,
    nightsToTreat: TUNING.persistentConditionNights[kind],
    nightsTreated: 0,
  };
  return {
    member: { ...member, conditions: [...member.conditions, condition] },
    events: [{ kind: "ConditionApplied", memberId: member.id, condition: kind }],
  };
}
