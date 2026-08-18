import type { Terrain } from "@/content/types";
import { PACE_SPEED_KMH, type Pace } from "../types";

/**
 * Movement cost by terrain.
 *
 * A divisor on pace, so higher means slower. The ordering is the point rather than
 * the exact figures: soft delta ground and rocky wadi beds cost more than open
 * desert, and climbing toward the mountain costs most. These want a pass from
 * someone who has walked the ground, or at least read someone who has.
 */
export const TERRAIN_COST: Record<Terrain, number> = {
  "delta-marsh": 1.25,
  "coastal-sand": 1.15,
  "open-desert": 1,
  "rocky-wadi": 1.3,
  "mountain-approach": 1.4,
};

/** How fast the household actually covers ground, in km/h. */
export function speedKmh(pace: Pace, terrain: Terrain): number {
  return PACE_SPEED_KMH[pace] / TERRAIN_COST[terrain];
}

/** Kilometres covered over a span of in-game hours. */
export function distanceOver(pace: Pace, terrain: Terrain, hours: number): number {
  if (hours <= 0) return 0;
  return speedKmh(pace, terrain) * hours;
}

/**
 * How tightly the household is keeping together: 1 is shoulder to shoulder, 0 is
 * strung out down the road. Pushing the pace pulls the party apart — the doc's
 * "visibly strings out behind the player when pushed too hard".
 *
 * Deliberately abstract rather than a distance. The world scale in the travel scene
 * is symbolic, not metric, so the view decides what a given cohesion looks like in
 * pixels. F11 makes low cohesion cost something.
 */
export const PACE_COHESION: Record<Pace, number> = {
  steady: 1,
  quick: 0.6,
  driving: 0.25,
};
