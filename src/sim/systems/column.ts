import { AXIS_MAX, weakest, type MemberState } from "./household";
import { PACE_SPEED_KMH, type Pace } from "../types";

/**
 * Where your household sits in the column — the first of the failure states (§5.5).
 *
 * You are not leading Israel. Israel is moving whether you keep up or not, and the
 * only question the game asks is whether your family is still in among it. That is
 * the whole reason the player is an invented household rather than Moses: falling
 * behind is a real failure that costs nothing in Scripture.
 *
 * It also has a text anchor, and a sharp one. Deuteronomy 25:18 remembers what
 * Amalek did on the way out of Egypt: he "struck the rearmost of you, all who were
 * feeble behind you, when you were faint and weary". Being at the back of the
 * column is where the danger in the text actually lands, so the game models it and
 * Rephidim (F12) collects on it.
 */

/**
 * How fast Israel moves as a whole, in km per hour of walking.
 *
 * Set to exactly a steady walk, and that is the whole balance decision. A household
 * in good order holds its place without ever being pushed, so falling behind is
 * never a tax on choosing the sustainable pace — it is caused by wearing your
 * family down, which is the thing this game is actually about. A spent household
 * cannot hold the column at any pace, including a driving one.
 */
export const COLUMN_SPEED_KMH = 3;

/**
 * How much of its pace a household actually manages, given the state of its worst
 * member. A family moves at the speed of whoever is struggling most, which is the
 * same principle as the marching frailty.
 *
 * The curve matters more than the constants. At full condition a household makes
 * its stated pace; below roughly a third it cannot hold the column even at a
 * driving pace, which is the trap this system exists to set. Pushing a spent
 * household is not merely cruel, it is slower.
 */
export function drag(household: readonly MemberState[]): number {
  const worst = weakest([...household]);
  if (!worst) return 1;
  return 0.35 + 0.65 * (worst.condition / AXIS_MAX);
}

/** Km per hour the household is really covering. */
export function effectiveSpeed(household: readonly MemberState[], pace: Pace): number {
  return PACE_SPEED_KMH[pace] * drag(household);
}

/**
 * Ground lost to the column over a stretch of walking.
 *
 * Worked out in time rather than distance: walking a kilometre slowly takes longer,
 * and the column keeps going for all of it. Negative when the household is making
 * up ground.
 */
export function lagOver(
  household: readonly MemberState[],
  km: number,
  pace: Pace,
): number {
  if (km <= 0) return 0;
  const speed = effectiveSpeed(household, pace);
  if (speed <= 0) return km;
  const hours = km / speed;
  return COLUMN_SPEED_KMH * hours - km;
}

/** Kilometres behind the head of the column. Never negative — Israel is not overtaken. */
export function advanceLag(
  lagKm: number,
  household: readonly MemberState[],
  km: number,
  pace: Pace,
): number {
  return Math.max(0, lagKm + lagOver(household, km, pace));
}

/**
 * Where in the column the household is walking.
 *
 * `stragglers` is the band Deuteronomy 25:18 is describing, and content keys off
 * it — it is a place in the line, not a score.
 */
export type ColumnPosition = "with-the-column" | "toward-the-back" | "strung-out" | "stragglers";

export const STRAGGLER_KM = 8;

export function positionAt(lagKm: number): ColumnPosition {
  if (lagKm <= 0.5) return "with-the-column";
  if (lagKm <= 3) return "toward-the-back";
  if (lagKm < STRAGGLER_KM) return "strung-out";
  return "stragglers";
}

/** Said plainly, because "3.4 km of lag" is not something a player can act on. */
export const POSITION_LABEL: Record<ColumnPosition, string> = {
  "with-the-column": "In among the column",
  "toward-the-back": "Toward the back",
  "strung-out": "Strung out behind",
  stragglers: "Among the stragglers",
};

export const POSITION_NOTE: Record<ColumnPosition, string> = {
  "with-the-column": "There are families on every side of you.",
  "toward-the-back": "The dust of the column is ahead of you now.",
  "strung-out": "You can still see the column. You are not in it.",
  stragglers: "You are at the very back, with the feeble and the worn out.",
};

/**
 * How much of the gap a night in camp closes.
 *
 * Numbers 33 is a list of *camps*: the whole column stops at the same place every
 * night, so a household walking in two hours after everybody else still walks in.
 * Without this, lag compounded without limit — a worn household could finish a
 * single long leg forty kilometres adrift of a nation that had been standing still
 * since dusk, which is not a thing that can happen.
 *
 * A quarter is kept rather than none, so a persistently slow household is still
 * visibly nearer the back week after week. The real cost of arriving late is not
 * distance; it is the rest, below.
 */
export function campCloses(lagKm: number): number {
  return Math.max(0, lagKm * 0.25);
}

/**
 * How much of a night's rest a household actually gets, 0 to 1.
 *
 * Arriving after everyone else means less of the night in your own blankets, and
 * the column leaves at dawn either way. This is what makes falling behind cost
 * something once the distance itself is forgiven — and it is the loop the player
 * has to break: behind means less rest, less rest means slower, slower means
 * further behind. Pushing the pace is the way out, and it has its own price.
 */
export function restShare(lagKm: number): number {
  if (lagKm <= 0.5) return 1;
  return Math.max(0.45, 1 - (lagKm / STRAGGLER_KM) * 0.55);
}

/** True once the household is in the band the text warns about. */
export function isStraggling(lagKm: number): boolean {
  return positionAt(lagKm) === "stragglers";
}
