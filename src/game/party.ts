import type * as PhaserNS from "phaser";

/**
 * The household's sprites, and the looks the player can choose between.
 *
 * Cut from the supplied character sheets and scaled by role rather than uniformly —
 * every figure on those sheets is drawn to fill its cell, so scaling them all by the
 * same factor would stand a six-year-old as tall as her father.
 *
 * Ids match the roster in `content/episode1/cast.ts`, which stays the single source
 * of truth for who these people are. This file only says how they are drawn.
 */

/** Which sheet a member is drawn from, chosen by their role. */
export type LookKind = "man" | "woman" | "child" | "elder";

export const VARIANTS_PER_KIND = 3;

export interface PartyFigure {
  /** Matches a `CastMember` id in the content. */
  id: string;
  kind: LookKind;
  /** The sprite's own height in canvas pixels, for laying out a row before load. */
  height: number;
}

export const PARTY: PartyFigure[] = [
  { id: "eliab", kind: "man", height: 58 },
  { id: "tirzah", kind: "woman", height: 56 },
  { id: "elon", kind: "child", height: 40 },
  { id: "milcah", kind: "child", height: 33 },
  { id: "naamah", kind: "elder", height: 52 },
];

/** Every look, so a change of appearance never waits on a download. */
export const ALL_LOOKS: { kind: LookKind; variant: number }[] = (
  ["man", "woman", "child", "elder"] as LookKind[]
).flatMap((kind) =>
  Array.from({ length: VARIANTS_PER_KIND }, (_, variant) => ({ kind, variant })),
);

export const lookAsset = (kind: LookKind, variant: number): string =>
  `/art/party/${kind}-${clampVariant(variant)}.webp`;

export const lookKey = (kind: LookKind, variant: number): string =>
  `party:${kind}-${clampVariant(variant)}`;

/** Out-of-range looks fall back to the first rather than rendering nothing. */
export function clampVariant(variant: number): number {
  if (!Number.isInteger(variant) || variant < 0 || variant >= VARIANTS_PER_KIND) return 0;
  return variant;
}

export function figureFor(id: string): PartyFigure | undefined {
  return PARTY.find((figure) => figure.id === id);
}

export function preloadParty(scene: PhaserNS.Scene): void {
  for (const { kind, variant } of ALL_LOOKS) {
    scene.load.image(lookKey(kind, variant), lookAsset(kind, variant));
  }
}

/** Tightest and loosest the column gets, in view pixels between figures. */
const GAP_TIGHT = 22;
const GAP_STRUNG_OUT = 62;

/**
 * Turn the simulation's abstract cohesion into a pixel gap. Cohesion 1 walks the
 * household shoulder to shoulder; 0 spreads them down the road behind the leader.
 */
export function gapForCohesion(cohesion: number): number {
  const clamped = Math.min(Math.max(cohesion, 0), 1);
  return GAP_STRUNG_OUT - (GAP_STRUNG_OUT - GAP_TIGHT) * clamped;
}
