import type { CampMood, HouseholdEffect } from "@/content/types";
import { AXIS_MAX, type MemberState } from "./household";

/**
 * The evening beat's rules.
 *
 * `moodOf` decides which of a member's four lines the camp screen shows. The order
 * is a claim about what matters most when you sit down with someone: a body that
 * cannot go on comes before a spirit that does not want to, and both come before
 * an argument about your leadership. Only when none of those is pressing does a
 * member have room to say something ordinary.
 */

export const WEARY_AT = 40;
export const LOW_SPIRIT_AT = 45;
export const DISTRUSTFUL_AT = 60;

export function moodOf(member: MemberState): CampMood {
  if (member.condition <= WEARY_AT) return "weary";
  if (member.morale <= LOW_SPIRIT_AT) return "low-spirit";
  if (member.trust <= DISTRUSTFUL_AT) return "distrustful";
  return "content";
}

const clamp = (value: number): number => Math.min(AXIS_MAX, Math.max(0, value));

/** Apply a choice's consequences to one member. */
export function applyEffect(member: MemberState, effect: HouseholdEffect): MemberState {
  const condition = clamp(member.condition + (effect.condition ?? 0));
  const morale = clamp(member.morale + (effect.morale ?? 0));
  const trust = clamp(member.trust + (effect.trust ?? 0));
  if (condition === member.condition && morale === member.morale && trust === member.trust) {
    return member;
  }
  return { ...member, condition, morale, trust };
}

export function applyEffectAll(
  household: MemberState[],
  effect: HouseholdEffect,
): MemberState[] {
  const next = household.map((member) => applyEffect(member, effect));
  return next.some((member, i) => member !== household[i]) ? next : household;
}
