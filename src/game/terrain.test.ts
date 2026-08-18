import { describe, expect, it } from "vitest";
import { LAYER, THEMES, ridgeHeights } from "./terrain";
import {
  clampVariant,
  gapForCohesion,
  lookAsset,
  PARTY,
  VARIANTS_PER_KIND,
} from "./party";
import { TERRAIN_COST } from "@/sim/systems/travel";
import { episode1 } from "@/content/episode1";

/**
 * These run in Node because `terrain.ts` and `party.ts` import Phaser as a *type*
 * only — the drawing calls take a scene rather than reaching for a global. Keeping
 * that boundary is what makes the scenery maths testable at all.
 */

describe("terrain themes", () => {
  it("covers every terrain the content model allows", () => {
    expect(Object.keys(THEMES).sort()).toEqual(Object.keys(TERRAIN_COST).sort());
  });

  it("gives each terrain its own middle-layer style, so they are not recolours", () => {
    const styles = Object.values(THEMES).map((theme) => theme.midStyle);
    expect(new Set(styles).size).toBe(styles.length);
  });

  it("raises the horizon as the route leaves the delta for the mountain", () => {
    const order = [
      "delta-marsh",
      "coastal-sand",
      "open-desert",
      "rocky-wadi",
      "mountain-approach",
    ] as const;
    for (let i = 1; i < order.length; i++) {
      expect(THEMES[order[i]!].farRelief).toBeGreaterThan(THEMES[order[i - 1]!].farRelief);
    }
  });

  it("keeps relief within 0 and 1", () => {
    for (const theme of Object.values(THEMES)) {
      expect(theme.farRelief).toBeGreaterThan(0);
      expect(theme.farRelief).toBeLessThanOrEqual(1);
    }
  });
});

describe("ridgeHeights", () => {
  const width = LAYER.farTile;

  it("stays inside the requested height band", () => {
    const heights = ridgeHeights(width, 42, 10, 60, 1);
    for (const height of heights) {
      expect(height).toBeGreaterThanOrEqual(10 - 1e-9);
      expect(height).toBeLessThanOrEqual(60 + 1e-9);
    }
  });

  it("is deterministic for a seed", () => {
    expect(ridgeHeights(width, 7, 10, 60, 1)).toEqual(ridgeHeights(width, 7, 10, 60, 1));
  });

  /**
   * The whole reason for building the ridge out of whole-number frequencies: the
   * tile has to meet itself without a step, or the scrolling horizon shows a
   * repeating notch. One pixel of wrap-around change is a continuous line.
   */
  it("meets itself at the tile seam", () => {
    for (const seed of [1, 99, 1234, 55555]) {
      const heights = ridgeHeights(width, seed, 10, 60, 1);
      const first = heights[0]!;
      const last = heights[width - 1]!;
      const stepAtSeam = Math.abs(first - last);
      const largestStepInside = Math.max(
        ...heights.slice(1).map((height, i) => Math.abs(height - heights[i]!)),
      );
      // The wrap is no worse than the roughest step anywhere else in the tile.
      expect(stepAtSeam).toBeLessThanOrEqual(largestStepInside + 1e-9);
    }
  });

  it("gives flat country a smoother edge than broken country", () => {
    const roughestStep = (roughness: number) => {
      const heights = ridgeHeights(width, 2024, 10, 60, roughness);
      return Math.max(...heights.slice(1).map((h, i) => Math.abs(h - heights[i]!)));
    };
    expect(roughestStep(THEMES["delta-marsh"].farRelief)).toBeLessThan(
      roughestStep(THEMES["mountain-approach"].farRelief),
    );
  });
});

describe("the household party", () => {
  it("is five people", () => {
    expect(PARTY).toHaveLength(5);
    expect(new Set(PARTY.map((figure) => figure.id)).size).toBe(5);
  });

  /**
   * The art and the roster are separate files by design, which means they can drift.
   * A member with no sprite would simply not be drawn, silently — so this is checked.
   */
  it("has art for every member of the household, in marching order", () => {
    expect(PARTY.map((figure) => figure.id)).toEqual(
      episode1.household.map((member) => member.id),
    );
  });

  it("offers three looks for every member, each with its own asset", () => {
    for (const figure of PARTY) {
      const assets = Array.from({ length: VARIANTS_PER_KIND }, (_, v) =>
        lookAsset(figure.kind, v),
      );
      expect(new Set(assets).size).toBe(VARIANTS_PER_KIND);
      for (const asset of assets) {
        expect(asset).toMatch(/^\/art\/party\/[a-z]+-\d\.webp$/);
      }
    }
  });

  /** A saved look that no longer exists must not leave a member invisible. */
  it("falls back to the first look rather than rendering nothing", () => {
    expect(clampVariant(-1)).toBe(0);
    expect(clampVariant(99)).toBe(0);
    expect(clampVariant(1.5)).toBe(0);
    expect(clampVariant(2)).toBe(2);
  });
});

describe("gapForCohesion", () => {
  it("closes up when the household is together and spreads when it is not", () => {
    expect(gapForCohesion(1)).toBeLessThan(gapForCohesion(0));
  });

  it("clamps outside 0 to 1 rather than producing a nonsense gap", () => {
    expect(gapForCohesion(5)).toBe(gapForCohesion(1));
    expect(gapForCohesion(-5)).toBe(gapForCohesion(0));
  });
});
