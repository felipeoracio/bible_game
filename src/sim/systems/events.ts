import { createRng } from "../rng";

/**
 * When events fire.
 *
 * All of this is pure and deterministic: the same seed and the same walk produce
 * the same events in the same order. That is what makes a bug report reproducible,
 * and it is why the roll lives in the reducer rather than in the scene.
 *
 * Two kinds, per the design doc (§4). Scripted events are the text — they fire at a
 * fixed point in the leg and always fire. Pooled events are ordinary life — they are
 * drawn at random, spaced out, and never repeat within a run.
 */

/**
 * The leg's event and unlock configuration, copied into state when the leg begins.
 *
 * Denormalised on purpose: the reducer must be able to decide what fires and what
 * opens without reaching into the content module, which is what keeps `src/sim`
 * free of any dependency on a particular episode.
 */
export interface LegSchedule {
  scripted: { eventId: string; atProgress: number }[];
  /** The set piece this leg reaches, if it has one. */
  setPiece?: { setPieceId: string; atProgress: number };
  /** True for the leg where manna begins. */
  beginsManna?: boolean;
  pool: string[];
  /** Codex entry opened by reaching the end of the leg. */
  waypoint?: string;
  /** Further entries opened on arrival. */
  unlocks: string[];
  /** Entries opened by each event, keyed by event id. */
  eventUnlocks: Record<string, string[]>;
  /** Checkpoint that runs on arrival. */
  quizId?: string;
}

/** Shortest and longest gap between pooled events, in kilometres. */
export const POOL_GAP_MIN_KM = 5;
export const POOL_GAP_MAX_KM = 11;

export const emptySchedule: LegSchedule = {
  scripted: [],
  pool: [],
  unlocks: [],
  eventUnlocks: {},
};

export interface TriggerInput {
  schedule: LegSchedule;
  /** 0 to 1 along the leg. */
  progress: number;
  distanceKm: number;
  fired: readonly string[];
  /** Distance at which the next pooled event becomes eligible. */
  nextPooledAtKm: number;
  seed: number;
}

export interface TriggerResult {
  eventId: string;
  /** Seed to store back, so the next roll differs. */
  seed: number;
  /** Where the following pooled event becomes eligible. */
  nextPooledAtKm: number;
}

/**
 * Decide whether anything fires at this point in the march.
 *
 * Scripted events win over pooled ones: if the household has just reached the point
 * where the sea is behind them, that is what they are dealing with, not a sandal
 * strap. Earlier scripted slots fire before later ones even if both are due, so
 * skipping ground never skips the story.
 */
export function nextEvent(input: TriggerInput): TriggerResult | undefined {
  const { schedule, progress, distanceKm, fired, nextPooledAtKm, seed } = input;
  const alreadyFired = new Set(fired);

  const due = schedule.scripted
    .filter((slot) => !alreadyFired.has(slot.eventId) && progress >= slot.atProgress)
    .sort((a, b) => a.atProgress - b.atProgress);

  const scripted = due[0];
  if (scripted) {
    return { eventId: scripted.eventId, seed, nextPooledAtKm };
  }

  if (distanceKm < nextPooledAtKm) return undefined;

  const available = schedule.pool.filter((id) => !alreadyFired.has(id));
  if (available.length === 0) return undefined;

  const rng = createRng(seed);
  const picked = rng.pick(available);
  if (!picked) return undefined;

  return {
    eventId: picked,
    // Advance the seed so the next draw is a different roll, still reproducibly.
    seed: (seed * 1664525 + 1013904223) >>> 0,
    nextPooledAtKm: distanceKm + rng.range(POOL_GAP_MIN_KM, POOL_GAP_MAX_KM),
  };
}

/** Where the first pooled event of a leg becomes eligible. */
export function firstPooledAtKm(seed: number): number {
  return createRng(seed).range(POOL_GAP_MIN_KM, POOL_GAP_MAX_KM);
}
