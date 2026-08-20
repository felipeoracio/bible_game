import { createRng } from "../rng";

/**
 * Jethro's reorganisation — the set piece where the verb is *being placed* (§5.7).
 *
 * Exodus 18:21 and 18:25: Moses is told to provide able men out of all the people
 * and set them over the congregation as rulers of thousands, hundreds, fifties and
 * tens, and he does it. From that day the ordinary Israelite household does not go
 * to Moses with a dispute. It goes to its ruler of ten.
 *
 * That is a genuinely different beat from the other three, and a quieter one. The
 * player is not enduring anything or crossing anything. They are being slotted into
 * a structure — and the structure is the recorded part. Which of the many rulers of
 * ten they end up under is not recorded about anybody, so the judge is invented and
 * labelled invented, while the office they hold is recorded and cited.
 *
 * The assignment is deterministic from the run's seed rather than chosen, because
 * "assigned" is what the text describes. It persists: later content can ask who
 * your judge is, and this is the mechanism by which a named person follows the
 * household through the rest of the episode.
 */

/** The ranks Exodus 18:21 lists, largest first. */
export const RANKS = ["thousand", "hundred", "fifty", "ten"] as const;

export type Rank = (typeof RANKS)[number];

/**
 * An ordinary household answers to a ruler of ten.
 *
 * The larger ranks exist in the text and in the fiction, but they are not who a
 * family speaks to, so this is the one that gets a name and follows them around.
 */
export const HOUSEHOLD_RANK: Rank = "ten";

export interface Assignment {
  /** A `judges` id in the content. Invented people, labelled as such. */
  judgeId: string;
  rank: Rank;
  seed: number;
}

/**
 * Place the household under one of the available judges.
 *
 * Seeded, so a run replays identically — the same principle as every other roll in
 * the simulation. Returns the advanced seed alongside the assignment.
 */
export function assign(judgeIds: readonly string[], seed: number): Assignment | undefined {
  if (judgeIds.length === 0) return undefined;
  const judgeId = createRng(seed).pick(judgeIds);
  if (judgeId === undefined) return undefined;
  return {
    judgeId,
    rank: HOUSEHOLD_RANK,
    // Same advance the event scheduler uses, so every roll in the run stays on one
    // reproducible chain.
    seed: (seed * 1664525 + 1013904223) >>> 0,
  };
}

/** How the assignment is said out loud. */
export function describe(judgeName: string, rank: Rank = HOUSEHOLD_RANK): string {
  return `You are set under ${judgeName}, a ruler of ${rank}. Small matters go to him now, and only the hard ones go to Moses.`;
}
