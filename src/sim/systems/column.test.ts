import { describe, expect, it } from "vitest";
import {
  advanceLag,
  campCloses,
  COLUMN_SPEED_KMH,
  drag,
  effectiveSpeed,
  isStraggling,
  lagOver,
  positionAt,
  restShare,
  STRAGGLER_KM,
} from "./column";
import { freshMember, type MemberState } from "./household";

const family = (): MemberState[] => [
  freshMember("eliab", "head"),
  freshMember("tirzah", "spouse"),
  freshMember("elon", "child"),
  freshMember("milcah", "child"),
  freshMember("naamah", "elder"),
];

/** The same household, with its worst member run down to `condition`. */
const worn = (condition: number): MemberState[] =>
  family().map((m) => (m.id === "naamah" ? { ...m, condition } : m));

describe("how fast the household really moves", () => {
  it("makes its stated pace while everyone is in good order", () => {
    expect(drag(family())).toBe(1);
    expect(effectiveSpeed(family(), "steady")).toBeCloseTo(3);
  });

  /** A family moves at the speed of whoever is struggling most. */
  it("is held back by its worst member, not its average", () => {
    const oneSpent = worn(10);
    expect(drag(oneSpent)).toBeLessThan(drag(family()));
    // The other four are untouched, so an average would barely move.
    expect(drag(oneSpent)).toBeLessThan(0.5);
  });

  it("slows further the worse that member gets", () => {
    expect(drag(worn(20))).toBeLessThan(drag(worn(60)));
  });
});

describe("keeping up", () => {
  /**
   * The balance decision the whole system turns on: a household in good order is
   * never punished for walking sustainably.
   */
  it("holds its place at a steady walk while everyone is in good order", () => {
    expect(lagOver(family(), 10, "steady")).toBeCloseTo(0);
  });

  it("falls behind at that same steady walk once the household is worn down", () => {
    expect(lagOver(worn(25), 10, "steady")).toBeGreaterThan(0);
  });

  it("makes ground back up at a quick pace", () => {
    expect(lagOver(family(), 10, "quick")).toBeLessThan(0);
  });

  it("costs nothing when nobody has moved", () => {
    expect(lagOver(family(), 0, "driving")).toBe(0);
  });

  /**
   * The trap this system exists to set. Driving a household that is already spent
   * is not merely cruel — it is slower than walking a healthy one, and the column
   * pulls away regardless of what the pace control says.
   */
  it("loses ground even at a driving pace once the household is spent", () => {
    expect(effectiveSpeed(worn(15), "driving")).toBeLessThan(COLUMN_SPEED_KMH);
    expect(lagOver(worn(15), 10, "driving")).toBeGreaterThan(0);
  });

  it("still holds the column at a driving pace while there is anything left", () => {
    expect(lagOver(worn(60), 10, "driving")).toBeLessThan(0);
  });
});

describe("position in the column", () => {
  it("never lets the household overtake Israel", () => {
    // A long quick march with no ground to make up cannot push lag below zero.
    expect(advanceLag(0, family(), 40, "driving")).toBe(0);
  });

  it("closes the gap when the household is making ground", () => {
    const behind = 5;
    expect(advanceLag(behind, family(), 20, "driving")).toBeLessThan(behind);
  });

  it("opens the gap when it is not", () => {
    const behind = 5;
    expect(advanceLag(behind, worn(20), 20, "driving")).toBeGreaterThan(behind);
  });

  it("names where in the line the household is walking", () => {
    expect(positionAt(0)).toBe("with-the-column");
    expect(positionAt(2)).toBe("toward-the-back");
    expect(positionAt(5)).toBe("strung-out");
    expect(positionAt(STRAGGLER_KM)).toBe("stragglers");
  });

  /** The band Deuteronomy 25:18 is describing, which Rephidim collects on. */
  it("marks the stragglers only at the very back", () => {
    expect(isStraggling(STRAGGLER_KM - 0.1)).toBe(false);
    expect(isStraggling(STRAGGLER_KM + 10)).toBe(true);
  });
});

/**
 * Numbers 33 is a list of camps: the column stops at the same place every night.
 * Without this, lag compounded without limit and a worn household could finish one
 * long leg forty kilometres adrift of a nation that had been standing still since
 * dusk. Found by walking the whole itinerary, not by reading the code.
 */
describe("a night in camp", () => {
  it("closes most of the gap, because the column is not going anywhere", () => {
    expect(campCloses(40)).toBeLessThan(12);
    expect(campCloses(8)).toBeLessThan(3);
  });

  it("leaves a persistently slow household still nearer the back", () => {
    expect(campCloses(40)).toBeGreaterThan(0);
  });

  it("does nothing for a household that was never behind", () => {
    expect(campCloses(0)).toBe(0);
  });

  it("stops lag running away over leg after leg", () => {
    // Twelve legs, each adding a punishing amount, with a camp at the end of each.
    let lag = 0;
    for (let leg = 0; leg < 12; leg++) lag = campCloses(lag + 40);
    expect(lag).toBeLessThan(STRAGGLER_KM * 2);
  });
});

describe("what arriving late costs", () => {
  it("costs nothing at all when the household walked in with everyone else", () => {
    expect(restShare(0)).toBe(1);
  });

  it("costs a share of the night the further behind they were", () => {
    expect(restShare(4)).toBeLessThan(1);
    expect(restShare(8)).toBeLessThan(restShare(4));
  });

  /** The loop has to be escapable: a bad night is never a lost night. */
  it("never takes the whole night away, however far behind they were", () => {
    expect(restShare(100)).toBeGreaterThan(0.4);
  });
});
