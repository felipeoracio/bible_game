/**
 * The household condition model — four meters that fail in four different ways.
 *
 * Pure and framework-free: no Phaser, no React, no content imports, no engine
 * coupling. Every exported function takes state plus input and returns new state
 * plus an event list, deterministically.
 *
 * The design constraint that shapes everything here is that the source narrative is
 * about provision, not scarcity. So:
 *
 *   - **Zero is a destination, not a game over.** The story goes to the bottom of
 *     the water meter on purpose. Reaching zero has to be survivable.
 *   - **The simulation may never kill anyone.** There is exactly one way a member
 *     can die — `authoredDeath`, called from scripted content by a writer. No
 *     arithmetic anywhere reaches it.
 *   - **Nothing fully heals.** Every zero permanently lowers that meter's ceiling,
 *     so the household's state at Sinai is the record of the journey.
 *   - **The four zero-states must stay four different experiences.** If two of them
 *     feel the same, the model has collapsed into one meter wearing four costumes.
 *     Their verbs are: *carried*, *left behind*, *spreads*, *disobeys*.
 */

export type MemberRole = "head" | "spouse" | "child" | "elder";
export type AgeBand = "child" | "adult" | "elder";

export type MeterName = "water" | "body" | "spirit" | "trust";

/**
 * Meters the environment is allowed to touch.
 *
 * `trust` is deliberately absent, and that absence is the enforcement. Travel,
 * weather, terrain and time all move meters through this type, so there is no
 * signature anywhere in the environmental path that can carry a trust delta —
 * it is a compile error rather than a code review note.
 */
export type EnvMeterName = Exclude<MeterName, "trust">;

export type Meters = Record<MeterName, number>;
export type EnvDelta = Partial<Record<EnvMeterName, number>>;

export type ConditionState =
  | "ok"
  /** Transitional, held for the rest of the leg after coming back from collapse. */
  | "weakened"
  /** `water === 0` — cannot move unaided. */
  | "collapsed"
  /** `body === 0`, or collapsed and uncarried at leg end — out of the column. */
  | "straggling"
  /** `spirit === 0` — refuses labour, and it spreads. */
  | "murmuring"
  /** `trust === 0` — acts against the player's instruction. */
  | "defiant";

export type PersistentConditionKind = "limp" | "fever" | "sunstruck";

export interface PersistentCondition {
  kind: PersistentConditionKind;
  /** While untreated, `body.max` cannot exceed this. */
  capsBodyMaxAt: number;
  nightsToTreat: number;
  nightsTreated: number;
}

/** The permanent record of one meter having reached zero. */
export interface Scar {
  meter: MeterName;
  leg: number;
  cause: string;
}

export type CarryPayload =
  | { type: "person"; memberId: string }
  | { type: "load"; loadId: string };

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  age: AgeBand;
  meters: Meters;
  maxes: Meters;
  /** A member may hold several at once — collapsed and murmuring, say. */
  states: Set<ConditionState>;
  conditions: PersistentCondition[];
  scars: Scar[];
  /** Adults only, and exactly one slot: a person or a load, never both. */
  carrying: CarryPayload | null;
  /** Consecutive legs finished at zero trust. Two means departure. */
  legsAtZeroTrust: number;
  /** `player`, or the id of the household they left for. */
  attachedTo: "player" | string;
  /** Progress back from a departure. Reset by a single broken commitment. */
  returnProgress: { legsKept: number; lastLegVisited: number };
  /**
   * The leg `weakened` began on, so it lasts the remainder of *that* leg.
   * Without it, a member watered at camp is granted weakened and stripped of it
   * again by the same camp's leg-end rule, and the state never exists.
   */
  weakenedSinceLeg: number | null;
  /** Set once, and only ever by `authoredDeath`. */
  dead: boolean;
}

export interface Load {
  id: string;
  label: string;
  abandoned: boolean;
}

export interface HouseholdState {
  members: Member[];
  loads: Load[];
  /** The leg being walked. Used to stamp scars and to bound `weakened`. */
  leg: number;
  /** Legs whose end has already been resolved, so counters advance once each. */
  legsResolved: number[];
}

export interface MemberSeed {
  id: string;
  name: string;
  role: MemberRole;
  age: AgeBand;
  /** Optional starting overrides; everything defaults to full. */
  meters?: Partial<Meters>;
}

// --- Events ------------------------------------------------------------------

export type ConditionEvent =
  | { kind: "MeterZero"; memberId: string; meter: MeterName; leg: number }
  | { kind: "StateEnter"; memberId: string; state: ConditionState }
  | { kind: "StateExit"; memberId: string; state: ConditionState }
  | { kind: "Scarred"; memberId: string; meter: MeterName; newMax: number }
  | { kind: "LoadAbandoned"; loadId: string; byMemberId: string | null }
  | { kind: "ColumnLost"; memberId: string }
  | { kind: "ContagionSpread"; murmurers: string[]; perMember: number }
  | { kind: "MemberDeparted"; memberId: string; toHousehold: string }
  | { kind: "MemberReturned"; memberId: string }
  | { kind: "ConditionApplied"; memberId: string; condition: PersistentConditionKind }
  | { kind: "ConditionTreated"; memberId: string; condition: PersistentConditionKind }
  /** A collapsed member nobody is carrying. The consuming layer must prompt. */
  | { kind: "CarrierNeeded"; memberId: string }
  /** An illegal carry. Nothing auto-resolves; the player is told why. */
  | { kind: "CarryRejected"; memberId: string; reason: string }
  | { kind: "AuthoredDeath"; memberId: string; leg: number; reason: string };

export interface Result {
  state: HouseholdState;
  events: ConditionEvent[];
}

// --- Call contexts -----------------------------------------------------------

export type Pace = "steady" | "pressing" | "forced";
export type HeatBand = "dawn" | "morning" | "midday" | "afternoon" | "evening" | "night";

export interface TravelContext {
  /** In-game hours this tick covers. Normally 1. */
  hours: number;
  pace: Pace;
  heat: HeatBand;
  leg: number;
}

export type CampAction =
  /** A full night. Restores body; never spirit. */
  | { kind: "rest" }
  /** Camped where there is water to draw. */
  | { kind: "water"; amount: number }
  /** Treat one member's persistent condition for the night. */
  | { kind: "treat"; memberId: string }
  /**
   * A conversation the player sat through. `completed` is false if they skipped
   * or advanced early — the consuming layer enforces the minimum duration.
   */
  | { kind: "conversation"; memberId: string; completed: boolean }
  /** Elim, the Song of the Sea, a Sabbath. Lifts everyone. */
  | { kind: "communal" }
  /** One member spending the whole camp phase with another. */
  | { kind: "peerSupport"; helperId: string; recipientId: string }
  /** The player visited a departed member at their new fire. */
  | { kind: "visitDeparted"; memberId: string };

export interface CampContext {
  leg: number;
  actions: CampAction[];
  /** Spirit change from the leg's own conditions — uneventful, hard, a loss. */
  legSpiritDelta?: number;
  /** Members of neighbouring households in the same camp group, for contagion. */
  neighbours?: string[];
  /** Whether the household got a night at all. */
  rested?: boolean;
}

export interface DecisionOutcome {
  leg: number;
  /** Trust deltas by member id. The only route by which trust ever moves. */
  trust: Record<string, number>;
  /**
   * True when this decision involved an instruction the player had committed to
   * and did not keep. Resets any departed member's return counter.
   */
  brokeCommitment?: boolean;
}
