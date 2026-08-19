import type { Terrain } from "@/content/types";
import { AXIS_MAX, type MemberState } from "./household";
import type { Pace } from "../types";

/**
 * Water — the genuine pressure system (§5.3).
 *
 * The shape of this system is the argument the game is making. The player decides
 * how fast to walk and therefore how fast the skins empty; the player does **not**
 * decide when more water appears. Refills come only from scripted content — the
 * spring, the bitter pool made sweet, the rock at Rephidim — which is why
 * `refill` is the only way litres ever go up and nothing in the UI can call it.
 *
 * Three days without water before Marah is in the text. So is bitter water on
 * arrival, and nothing at all at Rephidim. This system exists so those beats land
 * as relief rather than as cutscene.
 */

/** Litres one person drinks per kilometre, before heat, pace and frailty. */
const BASE_LITRES_PER_KM = 0.06;

/**
 * How hard the sun works on each terrain. The delta is wet and shaded by reeds;
 * the open desert and the wadi beds are the killers. Ordering matters more than
 * the figures, which want a pass from someone who has walked this ground.
 */
export const TERRAIN_HEAT: Record<Terrain, number> = {
  "delta-marsh": 0.8,
  "coastal-sand": 1,
  "open-desert": 1.5,
  "rocky-wadi": 1.4,
  "mountain-approach": 1.1,
};

/** Pushing the pace makes everyone drink harder. */
export const PACE_THIRST: Record<Pace, number> = {
  steady: 1,
  quick: 1.25,
  driving: 1.6,
};

/**
 * Children dehydrate faster than adults — more surface area for their mass — and
 * the very old hold water badly. Same ordering as marching frailty, and the same
 * reason: the household is a family, not a squad.
 */
const THIRST_FRAILTY: Record<MemberState["role"], number> = {
  head: 1,
  spouse: 1,
  child: 1.3,
  elder: 1.45,
};

/** Below this a member is visibly suffering for want of water. */
export const PARCHED_THRESHOLD = 45;

/** What the household got out of Egypt with: a few skins and a jar. */
export const STARTING_CAPACITY_L = 24;

export interface WaterStore {
  /** Litres carried. Only `refill` ever raises this. */
  litres: number;
  /** Most the household can carry at once. */
  capacity: number;
}

export const freshWater = (): WaterStore => ({
  litres: STARTING_CAPACITY_L,
  capacity: STARTING_CAPACITY_L,
});

const clamp = (value: number): number => Math.min(AXIS_MAX, Math.max(0, value));

/** Litres this member wants over a stretch of walking. */
export function thirstOf(
  member: MemberState,
  km: number,
  pace: Pace,
  terrain: Terrain,
): number {
  if (km <= 0) return 0;
  return (
    km * BASE_LITRES_PER_KM * PACE_THIRST[pace] * TERRAIN_HEAT[terrain] * THIRST_FRAILTY[member.role]
  );
}

/** What the whole household wants over that stretch. */
export function householdThirst(
  household: readonly MemberState[],
  km: number,
  pace: Pace,
  terrain: Terrain,
): number {
  return household.reduce((sum, member) => sum + thirstOf(member, km, pace, terrain), 0);
}

export interface DrinkResult {
  water: WaterStore;
  household: MemberState[];
  /** 0 to 1 — how much of what they needed they actually got. */
  satisfaction: number;
}

/**
 * Walk a stretch and drink from the skins.
 *
 * Water is shared out evenly rather than rationed by the player. That is a
 * deliberate limit: the drama the text is interested in is whether there is any
 * water at all, not who in the family gets it.
 */
export function drink(
  water: WaterStore,
  household: readonly MemberState[],
  km: number,
  pace: Pace,
  terrain: Terrain,
): DrinkResult {
  const need = householdThirst(household, km, pace, terrain);
  if (need <= 0) return { water, household: [...household], satisfaction: 1 };

  const drawn = Math.min(water.litres, need);
  const satisfaction = drawn / need;
  const shortfall = 1 - satisfaction;

  const next = household.map((member) => {
    // Drinking your fill recovers slowly; going without falls away fast, because
    // thirst is the crisis the text keeps returning to.
    const change =
      shortfall > 0
        ? -km * 3.2 * shortfall * THIRST_FRAILTY[member.role]
        : km * 0.6;
    const hydration = clamp(member.water + change);
    return hydration === member.water ? member : { ...member, water: hydration };
  });

  return {
    water: { ...water, litres: Math.max(0, water.litres - drawn) },
    household: next,
    satisfaction,
  };
}

/**
 * Extra condition lost per kilometre for being short of water.
 *
 * Deliberately steeper than plain tiredness. A worn-out household still walks;
 * a parched one is in real trouble, and the player should feel the difference.
 */
export function thirstPenalty(member: MemberState, km: number): number {
  if (member.water >= PARCHED_THRESHOLD) return 0;
  const severity = (PARCHED_THRESHOLD - member.water) / PARCHED_THRESHOLD;
  return km * 1.6 * severity;
}

/**
 * Found water. The only way litres go up.
 *
 * Called from scripted content alone — never from a button the player can press.
 * Anything beyond what the household can carry is left behind, which is why Elim's
 * twelve springs are a rest rather than a stockpile.
 */
export function refill(water: WaterStore, litres: number): WaterStore {
  if (litres <= 0) return water;
  const filled = Math.min(water.capacity, water.litres + litres);
  return filled === water.litres ? water : { ...water, litres: filled };
}

/** Extra carrying capacity — skins taken instead of something else. */
export function widenCapacity(water: WaterStore, litres: number): WaterStore {
  if (litres <= 0) return water;
  return { ...water, capacity: water.capacity + litres };
}

/** Whoever is closest to real trouble, for the HUD to name. */
export function thirstiest(household: readonly MemberState[]): MemberState | undefined {
  return household.reduce<MemberState | undefined>(
    (worst, member) => (worst === undefined || member.water < worst.water ? member : worst),
    undefined,
  );
}

/** Days of walking left in the skins at the current rate, for the HUD. */
export function daysOfWaterLeft(
  water: WaterStore,
  household: readonly MemberState[],
  pace: Pace,
  terrain: Terrain,
  kmPerDay = 20,
): number {
  const perDay = householdThirst(household, kmPerDay, pace, terrain);
  if (perDay <= 0) return Infinity;
  return water.litres / perDay;
}
