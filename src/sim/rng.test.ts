import { describe, expect, it } from "vitest";
import { createRng, seedFrom } from "./rng";

describe("createRng", () => {
  it("gives the same sequence for the same seed", () => {
    const a = createRng(1234);
    const b = createRng(1234);
    const first = Array.from({ length: 20 }, () => a.next());
    const second = Array.from({ length: 20 }, () => b.next());
    expect(first).toEqual(second);
  });

  it("gives different sequences for different seeds", () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it("stays inside [0, 1)", () => {
    const rng = createRng(99);
    for (let i = 0; i < 500; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("returns integers within an inclusive range, and reaches both ends", () => {
    const rng = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const value = rng.int(1, 4);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(4);
      seen.add(value);
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4]);
  });

  it("picks from an array, and returns undefined for an empty one", () => {
    const rng = createRng(3);
    expect(["a", "b", "c"]).toContain(rng.pick(["a", "b", "c"]));
    expect(rng.pick([])).toBeUndefined();
  });

  it("honours chance at the extremes", () => {
    const rng = createRng(11);
    expect(rng.chance(1)).toBe(true);
    expect(rng.chance(0)).toBe(false);
  });
});

describe("seedFrom", () => {
  it("is stable for the same text", () => {
    expect(seedFrom("leg-01-rameses-succoth")).toBe(seedFrom("leg-01-rameses-succoth"));
  });

  it("separates different content ids", () => {
    expect(seedFrom("leg-01-rameses-succoth")).not.toBe(seedFrom("leg-02-succoth-etham"));
  });

  it("produces a usable unsigned seed", () => {
    const seed = seedFrom("succoth");
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(seed)).toBe(true);
  });
});
