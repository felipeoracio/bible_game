import { describe, expect, it } from "vitest";
import { distanceOver, speedKmh, PACE_COHESION, TERRAIN_COST } from "./travel";
import { PACES, PACE_SPEED_KMH } from "../types";

describe("terrain cost", () => {
  it("treats open desert as the baseline", () => {
    expect(TERRAIN_COST["open-desert"]).toBe(1);
    expect(speedKmh("steady", "open-desert")).toBe(PACE_SPEED_KMH.steady);
  });

  it("slows the household on every terrain harder than open desert", () => {
    const baseline = speedKmh("steady", "open-desert");
    for (const terrain of ["delta-marsh", "coastal-sand", "rocky-wadi", "mountain-approach"] as const) {
      expect(speedKmh("steady", terrain)).toBeLessThan(baseline);
    }
  });

  it("costs more the closer the route gets to the mountain", () => {
    expect(speedKmh("steady", "mountain-approach")).toBeLessThan(speedKmh("steady", "rocky-wadi"));
    expect(speedKmh("steady", "rocky-wadi")).toBeLessThan(speedKmh("steady", "delta-marsh"));
  });

  it("keeps pace ordering intact on every terrain", () => {
    for (const terrain of Object.keys(TERRAIN_COST) as (keyof typeof TERRAIN_COST)[]) {
      expect(speedKmh("steady", terrain)).toBeLessThan(speedKmh("quick", terrain));
      expect(speedKmh("quick", terrain)).toBeLessThan(speedKmh("driving", terrain));
    }
  });
});

describe("distanceOver", () => {
  it("covers speed times hours", () => {
    expect(distanceOver("steady", "open-desert", 2)).toBeCloseTo(6);
  });

  it("never moves backwards on a zero or negative span", () => {
    expect(distanceOver("driving", "open-desert", 0)).toBe(0);
    expect(distanceOver("driving", "open-desert", -3)).toBe(0);
  });

  it("walks Leg 1 in a sensible number of in-game hours", () => {
    // 30 km of delta marsh: a long day and a half at steady pace, faster if driven.
    const steadyHours = 30 / speedKmh("steady", "delta-marsh");
    const drivingHours = 30 / speedKmh("driving", "delta-marsh");
    expect(steadyHours).toBeGreaterThan(10);
    expect(steadyHours).toBeLessThan(14);
    expect(drivingHours).toBeLessThan(steadyHours / 1.9);
  });
});

describe("party cohesion", () => {
  it("falls as the pace is pushed", () => {
    const cohesions = PACES.map((pace) => PACE_COHESION[pace]);
    for (let i = 1; i < cohesions.length; i++) {
      expect(cohesions[i]!).toBeLessThan(cohesions[i - 1]!);
    }
  });

  it("stays within 0 and 1, and is tight at a steady walk", () => {
    expect(PACE_COHESION.steady).toBe(1);
    for (const pace of PACES) {
      expect(PACE_COHESION[pace]).toBeGreaterThan(0);
      expect(PACE_COHESION[pace]).toBeLessThanOrEqual(1);
    }
  });
});
