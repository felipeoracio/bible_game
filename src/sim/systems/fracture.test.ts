import { describe, expect, it } from "vitest";
import { estranged, FRACTURE_AT, isWhole, RETURN_AT, settle, settleAll } from "./fracture";
import { freshMember, type MemberState } from "./household";

const member = (trust: number, following = true): MemberState => ({
  ...freshMember("elon", "child"),
  trust,
  following,
});

describe("stopping following", () => {
  it("keeps everyone while trust holds up", () => {
    expect(settle(member(80)).following).toBe(true);
  });

  it("does not lose anyone for merely being unhappy", () => {
    expect(settle(member(FRACTURE_AT + 1)).following).toBe(true);
  });

  it("loses them once trust runs out", () => {
    expect(settle(member(FRACTURE_AT)).following).toBe(false);
  });

  /**
   * Hysteresis on purpose. Without it a member on the edge flickers in and out of
   * the household over a single hard kilometre, which reads as a bug rather than
   * as a person making up their mind.
   */
  it("does not take them back the moment trust ticks up", () => {
    const gone = member(RETURN_AT - 1, false);
    expect(settle(gone).following).toBe(false);
  });

  it("takes them back once you have properly earned it", () => {
    const gone = member(RETURN_AT, false);
    expect(settle(gone).following).toBe(true);
  });

  it("leaves the member untouched when nothing changed", () => {
    const steady = member(80);
    expect(settle(steady)).toBe(steady);
  });
});

describe("the household as a whole", () => {
  const family = (): MemberState[] => [
    { ...freshMember("eliab", "head"), trust: 70 },
    { ...freshMember("naamah", "elder"), trust: 70 },
  ];

  it("is whole while everyone is still walking with you", () => {
    expect(isWhole(settleAll(family()))).toBe(true);
    expect(estranged(family())).toHaveLength(0);
  });

  it("names whoever has gone to another fire", () => {
    const strained = family().map((m) => (m.id === "naamah" ? { ...m, trust: 2 } : m));
    const settled = settleAll(strained);
    expect(isWhole(settled)).toBe(false);
    expect(estranged(settled).map((m) => m.id)).toEqual(["naamah"]);
  });

  it("returns the same array when nobody's mind changed", () => {
    const steady = family();
    expect(settleAll(steady)).toBe(steady);
  });

  /** Nobody dies and nobody leaves Israel. They are still there, just not with you. */
  it("never removes anyone from the household", () => {
    const broken = settleAll(family().map((m) => ({ ...m, trust: 0 })));
    expect(broken).toHaveLength(2);
    for (const m of broken) expect(m.following).toBe(false);
  });
});
