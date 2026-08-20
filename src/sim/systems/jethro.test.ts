import { describe, expect, it } from "vitest";
import { assign, describe as describeAssignment, HOUSEHOLD_RANK, RANKS } from "./jethro";

const JUDGES = ["shelumiel", "ahira", "nahshon", "pagiel"];

describe("the ranks", () => {
  /** Exodus 18:21, in the order the verse lists them. */
  it("are the four the text names, largest first", () => {
    expect([...RANKS]).toEqual(["thousand", "hundred", "fifty", "ten"]);
  });

  /** A family speaks to its ruler of ten, not to a ruler of thousands. */
  it("place an ordinary household under a ruler of ten", () => {
    expect(HOUSEHOLD_RANK).toBe("ten");
  });
});

describe("being placed under a judge", () => {
  it("assigns one of the judges the content actually has", () => {
    const result = assign(JUDGES, 1234);
    expect(result).toBeDefined();
    expect(JUDGES).toContain(result!.judgeId);
    expect(result!.rank).toBe("ten");
  });

  /** Assigned, not chosen — so the same run must place you the same way. */
  it("is reproducible from the run's seed", () => {
    expect(assign(JUDGES, 99)!.judgeId).toBe(assign(JUDGES, 99)!.judgeId);
  });

  it("advances the seed so later rolls are not the same draw", () => {
    const result = assign(JUDGES, 99)!;
    expect(result.seed).not.toBe(99);
    expect(Number.isInteger(result.seed)).toBe(true);
  });

  it("does not always give the same judge to every run", () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 60; seed++) seen.add(assign(JUDGES, seed)!.judgeId);
    expect(seen.size).toBeGreaterThan(1);
  });

  it("copes with the content having only one judge", () => {
    expect(assign(["only"], 7)!.judgeId).toBe("only");
  });

  it("returns nothing rather than inventing somebody when there are no judges", () => {
    expect(assign([], 7)).toBeUndefined();
  });
});

describe("how the assignment is said", () => {
  it("names the judge and the rank, and says what changes", () => {
    const line = describeAssignment("Shelumiel");
    expect(line).toMatch(/Shelumiel/);
    expect(line).toMatch(/ruler of ten/);
    // Exodus 18:22 — small matters to him, hard ones to Moses.
    expect(line).toMatch(/Moses/);
  });
});
