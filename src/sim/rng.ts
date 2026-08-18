/**
 * Seeded pseudo-random numbers.
 *
 * Two reasons this exists rather than `Math.random()`. The simulation has to stay
 * reproducible — a run seeded the same way must play out the same way, or a bug
 * report is worthless. And the procedurally generated terrain art has to look the
 * same every time the scene boots, not reshuffle on each reload.
 *
 * mulberry32: small, fast, and good enough for event weighting and scenery.
 */
export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  /** Float in [min, max). */
  range(min: number, max: number): number;
  /** One element, or undefined for an empty array. */
  pick<T>(items: readonly T[]): T | undefined;
  /** True with the given probability. */
  chance(probability: number): boolean;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    range: (min, max) => min + next() * (max - min),
    pick: (items) => (items.length === 0 ? undefined : items[Math.floor(next() * items.length)]),
    chance: (probability) => next() < probability,
  };
}

/** Turn a string into a seed, so content ids can seed their own scenery. */
export function seedFrom(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
