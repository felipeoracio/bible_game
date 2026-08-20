import { AXIS_MAX, type MemberState } from "./household";
import { positionAt, STRAGGLER_KM } from "./column";
import type { HouseholdEffect } from "@/content/types";

/**
 * Amalek at Rephidim — the set piece where the battle turns on something the
 * player can see and cannot touch (§5.7).
 *
 * Exodus 17:11 is the whole design: "When Moses held up his hand, Israel prevailed.
 * When he let down his hand, Amalek prevailed." The tide of the fight is decided on
 * a hill the player is looking at from the valley floor. They can watch it. They
 * cannot reach it. And 17:13 settles the ending before the player does anything —
 * Joshua defeats Amalek, every time, in every run.
 *
 * So what is actually at stake here is not the battle. It is **where your household
 * was standing when it started**, and that was decided over the preceding legs
 * rather than in this moment. Deuteronomy 25:18 is unusually specific about who got
 * hurt: Amalek "struck the rearmost of you, all who were feeble behind you, when
 * you were faint and weary". Both halves of that sentence are modelled here — how
 * far back you are, and what condition you are in.
 *
 * This is what F11's lag was built for. A household that kept up is barely touched.
 * One that has been straggling for three legs pays for it here.
 */

/** Below this there is nobody at the rear to strike. */
const SAFE_KM = 1;

/**
 * How exposed the household is, 0 to 1.
 *
 * Two independent halves of Deuteronomy 25:18, averaged rather than multiplied: a
 * household at the very back is in danger even in good condition, and a spent
 * household is in danger even reasonably far forward. Multiplying would let either
 * one cancel the other out, which is not what the verse describes.
 */
export function exposure(lagKm: number, household: readonly MemberState[]): number {
  const back = Math.min(Math.max(lagKm - SAFE_KM, 0) / (STRAGGLER_KM - SAFE_KM), 1);

  const worst = household.reduce(
    (lowest, member) => Math.min(lowest, member.condition),
    AXIS_MAX,
  );
  const feeble = 1 - worst / AXIS_MAX;

  return (back + feeble) / 2;
}

/**
 * What the fight costs this household.
 *
 * Nobody dies — that rule holds here as everywhere else (§5.5), and the text does
 * not record Israelite deaths at Rephidim in any case. The cost is bodies and
 * nerve. Trust *rises* regardless of exposure, because 17:13 is a deliverance the
 * household watched happen: even a family that was caught at the back saw Amalek
 * beaten by nightfall.
 */
export function harm(exposureLevel: number): HouseholdEffect {
  const level = Math.min(Math.max(exposureLevel, 0), 1);
  return {
    condition: -Math.round(level * 22),
    morale: -Math.round(level * 16),
    trust: 4,
  };
}

/** Whether the household was in the band the text says was struck. */
export function wasStruck(lagKm: number): boolean {
  return positionAt(lagKm) === "stragglers";
}

/**
 * What the player is told they can see from where they are standing.
 *
 * Deliberately describes the hill rather than the battle line. The player spends
 * this set piece watching two men hold somebody else's arms up, which is the point
 * of it — the thing deciding their afternoon is not in their hands.
 */
export function viewOfTheHill(exposureLevel: number): string {
  if (exposureLevel < 0.2) {
    return "You are far enough forward to see the hill clearly. Three figures on it, and the middle one has his hands in the air.";
  }
  if (exposureLevel < 0.55) {
    return "The hill is a long way off through the dust. You can make out that the middle figure's arms are up, and that the two beside him are doing the holding.";
  }
  return "You can barely see the hill from back here. Every time the line near you gives way, somebody says his arms have come down again.";
}
