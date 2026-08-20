import { describe, expect, it } from "vitest";
import { exposure, harm, viewOfTheHill, wasStruck } from "./rephidim";
import { STRAGGLER_KM } from "./column";
import { freshMember, type MemberState } from "./household";

const family = (): MemberState[] => [
  freshMember("eliab", "head"),
  freshMember("tirzah", "spouse"),
  freshMember("elon", "child"),
  freshMember("naamah", "elder"),
];

const worn = (condition: number): MemberState[] =>
  family().map((m) => (m.id === "naamah" ? { ...m, condition } : m));

describe("how exposed the household is", () => {
  it("is barely anything for a fit household keeping up", () => {
    expect(exposure(0, family())).toBeLessThan(0.05);
  });

  /** "he struck the rearmost of you" — Deuteronomy 25:18. */
  it("rises the further back the household is walking", () => {
    expect(exposure(6, family())).toBeGreaterThan(exposure(2, family()));
  });

  /** "all who were feeble behind you" — the other half of the same verse. */
  it("rises as the household wears down, even keeping up", () => {
    expect(exposure(0, worn(20))).toBeGreaterThan(exposure(0, family()));
  });

  /**
   * Averaged rather than multiplied on purpose. Multiplying would let a fit
   * household at the very back come out at nearly no risk, which is the opposite
   * of what the verse describes.
   */
  it("still counts being at the very back even in good condition", () => {
    expect(exposure(STRAGGLER_KM * 2, family())).toBeGreaterThan(0.4);
  });

  it("still counts being spent even while keeping up", () => {
    expect(exposure(0, worn(5))).toBeGreaterThan(0.4);
  });

  it("is worst for a spent household at the very back", () => {
    expect(exposure(STRAGGLER_KM * 2, worn(0))).toBeCloseTo(1);
  });

  it("never leaves the nought-to-one range", () => {
    for (const lag of [-5, 0, 3, 8, 100]) {
      for (const cond of [0, 40, 100]) {
        const value = exposure(lag, worn(cond));
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it("names the band the text says was struck", () => {
    expect(wasStruck(0)).toBe(false);
    expect(wasStruck(STRAGGLER_KM)).toBe(true);
  });
});

describe("what the fight costs", () => {
  it("costs a household that kept up almost nothing", () => {
    const cost = harm(exposure(0, family()));
    expect(cost.condition).toBeGreaterThan(-3);
  });

  it("costs a household caught at the back a great deal", () => {
    const cost = harm(exposure(STRAGGLER_KM * 2, worn(10)));
    expect(cost.condition).toBeLessThan(-15);
    expect(cost.morale).toBeLessThan(-10);
  });

  /**
   * Exodus 17:13 — Joshua defeats Amalek. Every household watched a deliverance,
   * including the ones that were badly caught, so trust rises either way.
   */
  it("raises trust however badly the household was caught", () => {
    for (const level of [0, 0.5, 1]) {
      expect(harm(level).trust).toBeGreaterThan(0);
    }
  });

  it("never kills anyone, however exposed", () => {
    // Nothing here is a death; the worst case is a survivable amount of condition.
    expect(harm(1).condition).toBeGreaterThan(-100);
  });

  it("clamps an out-of-range exposure rather than trusting the caller", () => {
    expect(harm(5)).toEqual(harm(1));
    expect(harm(-2)).toEqual(harm(0));
  });
});

/** The verb of this set piece: watching the thing that decides it, from too far away. */
describe("the view of the hill", () => {
  it("always describes the hill, never the player winning the battle", () => {
    for (const level of [0, 0.4, 0.9]) {
      const text = viewOfTheHill(level);
      expect(text).toMatch(/hill/i);
      expect(text).not.toMatch(/\byou (win|beat|defeat)\b/i);
    }
  });

  it("gets harder to see the further back the household is", () => {
    expect(viewOfTheHill(0)).not.toBe(viewOfTheHill(0.9));
    expect(viewOfTheHill(0.9)).toMatch(/barely/i);
  });
});
