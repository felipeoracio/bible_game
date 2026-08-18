import type { HouseholdRole } from "@/content/types";
import type { Pace } from "../types";

/**
 * The household on three separate axes, per §5.4 of the design doc.
 *
 * The reason these are three tracks and not one health bar: a family can be
 * physically fine and still stop believing in you, and that is the failure the game
 * is actually about. None of these ever kills anyone. They change what your family
 * says, what they will do, and which ending you reach.
 */

export interface MemberState {
  /** Matches a `CastMember` id in the content. */
  id: string;
  role: HouseholdRole;
  /** 0 to 100. Exhaustion, hunger, thirst, injury. */
  condition: number;
  /** 0 to 100. Willingness to keep walking. */
  morale: number;
  /** 0 to 100. Whether they believe you are leading them well. */
  trust: number;
}

export const AXIS_MAX = 100;

/** Condition spent per kilometre at each pace. */
const CONDITION_PER_KM: Record<Pace, number> = {
  steady: 0.5,
  quick: 0.95,
  driving: 1.7,
};

/** Morale spent per kilometre at each pace. A steady walk barely costs any. */
const MORALE_PER_KM: Record<Pace, number> = {
  steady: 0.1,
  quick: 0.45,
  driving: 1.05,
};

/**
 * How hard the march falls on each member. The children and the grandmother tire
 * faster than the two adults, which is what makes pace a real decision rather than
 * a free speed setting.
 */
const FRAILTY: Record<HouseholdRole, number> = {
  head: 1,
  spouse: 1,
  child: 1.35,
  elder: 1.6,
};

/** Below this, exhaustion starts eating into morale as well. */
export const SUFFERING_THRESHOLD = 45;

/** Below this, being driven on anyway costs you their trust. */
export const HARDSHIP_THRESHOLD = 35;

const clamp = (value: number): number => Math.min(AXIS_MAX, Math.max(0, value));

/** A member at the start of the journey: rested, hopeful, and willing to follow. */
export function freshMember(id: string, role: HouseholdRole): MemberState {
  return { id, role, condition: AXIS_MAX, morale: AXIS_MAX, trust: 80 };
}

/**
 * Apply a stretch of walking to one member.
 *
 * Trust is the interesting axis. It does not move for walking as such — it moves
 * when you drive a household that is already suffering, which is a leadership
 * choice the player is making. F6 adds the text-anchored drivers, where trust
 * responds to whether your choices matched the instruction that was given.
 */
export function walk(member: MemberState, km: number, pace: Pace): MemberState {
  if (km <= 0) return member;

  const frailty = FRAILTY[member.role];
  const condition = clamp(member.condition - km * CONDITION_PER_KM[pace] * frailty);

  let moraleLoss = km * MORALE_PER_KM[pace] * frailty;
  // Being worn down is demoralising on its own, and compounds the further it goes.
  if (condition < SUFFERING_THRESHOLD) {
    moraleLoss += km * 0.35 * ((SUFFERING_THRESHOLD - condition) / SUFFERING_THRESHOLD);
  }
  const morale = clamp(member.morale - moraleLoss);

  let trust = member.trust;
  if (pace === "driving" && member.condition < HARDSHIP_THRESHOLD) {
    trust = clamp(trust - km * 0.5);
  }

  if (condition === member.condition && morale === member.morale && trust === member.trust) {
    return member;
  }
  return { ...member, condition, morale, trust };
}

/** A night in camp. Rest restores the body first, and the spirit more slowly. */
export function rest(member: MemberState): MemberState {
  return {
    ...member,
    condition: clamp(member.condition + 34),
    morale: clamp(member.morale + 14),
  };
}

export function walkAll(household: MemberState[], km: number, pace: Pace): MemberState[] {
  if (km <= 0) return household;
  const next = household.map((member) => walk(member, km, pace));
  return next.some((member, i) => member !== household[i]) ? next : household;
}

export function restAll(household: MemberState[]): MemberState[] {
  return household.map(rest);
}

/** Average morale across the household, for the HUD and for endings. */
export function averageMorale(household: MemberState[]): number {
  if (household.length === 0) return AXIS_MAX;
  return household.reduce((sum, member) => sum + member.morale, 0) / household.length;
}

/** The member in the worst physical shape — who the player should be worrying about. */
export function weakest(household: MemberState[]): MemberState | undefined {
  return household.reduce<MemberState | undefined>(
    (worst, member) => (worst === undefined || member.condition < worst.condition ? member : worst),
    undefined,
  );
}
