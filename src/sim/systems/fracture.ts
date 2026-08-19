import type { MemberState } from "./household";

/**
 * When a member of your household stops following you (§5.5).
 *
 * The hard constraint on this whole system: **nobody dies and nobody leaves the
 * Exodus.** The design doc is explicit that there is no random death, and inventing
 * a departure from Israel would be putting words in Scripture's mouth. So the
 * failure this models is smaller and, played with a family in the room, worse — a
 * son or a grandmother decides you are not worth following and goes to walk with
 * someone else's fire.
 *
 * It is reversible. Trust is the axis that moves when you drive people who are
 * already suffering, and it is the axis that comes back when you stop.
 */

/** Trust at which someone stops walking with you. */
export const FRACTURE_AT = 8;

/**
 * Trust at which they come back. Deliberately well above the leaving point, so the
 * household does not flicker in and out over a single hard kilometre — coming back
 * has to be earned rather than waited out.
 */
export const RETURN_AT = 30;

/** Whether this member walks with you after the trust they currently hold. */
export function stillFollowing(member: MemberState): boolean {
  if (member.following) return member.trust > FRACTURE_AT;
  return member.trust >= RETURN_AT;
}

export function settle(member: MemberState): MemberState {
  const following = stillFollowing(member);
  return following === member.following ? member : { ...member, following };
}

/** Applied after anything that moves trust. */
export function settleAll(household: MemberState[]): MemberState[] {
  const next = household.map(settle);
  return next.some((member, i) => member !== household[i]) ? next : household;
}

export function estranged(household: readonly MemberState[]): MemberState[] {
  return household.filter((member) => !member.following);
}

/** True while the whole household is still walking with you. */
export function isWhole(household: readonly MemberState[]): boolean {
  return household.every((member) => member.following);
}
