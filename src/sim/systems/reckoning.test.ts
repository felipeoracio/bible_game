import { describe, expect, it } from "vitest";
import { reckon } from "./reckoning";
import { STRAGGLER_KM } from "./column";
import { freshMember, type MemberState } from "./household";

const family = (): MemberState[] => [
  freshMember("eliab", "head"),
  freshMember("tirzah", "spouse"),
  freshMember("elon", "child"),
  freshMember("milcah", "child"),
  freshMember("naamah", "elder"),
];

const withAll = (patch: Partial<MemberState>): MemberState[] =>
  family().map((m) => ({ ...m, ...patch }));

describe("reckoning the journey", () => {
  it("counts a household that arrived together and still listening as whole", () => {
    const r = reckon(family(), 0);
    expect(r.standing).toBe("whole");
    expect(r.following).toBe(5);
    expect(r.total).toBe(5);
  });

  it("calls it worn when they followed the whole way with nothing left", () => {
    const r = reckon(withAll({ morale: 20 }), 0);
    expect(r.standing).toBe("worn");
  });

  it("counts low trust across a whole household as worn too", () => {
    expect(reckon(withAll({ trust: 20 }), 0).standing).toBe("worn");
  });

  /** Exhaustion alone is not the failure this game is about. */
  it("does not call a merely tired household a failure", () => {
    expect(reckon(withAll({ condition: 12 }), 0).standing).toBe("whole");
  });

  it("calls it divided when someone stopped walking with you", () => {
    const one = family().map((m) => (m.id === "elon" ? { ...m, following: false } : m));
    const r = reckon(one, 0);
    expect(r.standing).toBe("divided");
    expect(r.following).toBe(4);
  });

  it("calls it scattered when half the household has gone", () => {
    const most = family().map((m, i) => (i < 3 ? { ...m, following: false } : m));
    expect(reckon(most, 0).standing).toBe("scattered");
  });

  /** Losing one person while at the very back is the worst of both. */
  it("calls it scattered when the household is broken and straggling", () => {
    const one = family().map((m) => (m.id === "elon" ? { ...m, following: false } : m));
    expect(reckon(one, STRAGGLER_KM).standing).toBe("scattered");
  });

  /** Israel arrives regardless. Being at the back is not a lost game. */
  it("does not fail a whole household for finishing at the back", () => {
    expect(reckon(family(), STRAGGLER_KM + 20).standing).toBe("whole");
  });

  it("reports where in the column the household finished", () => {
    expect(reckon(family(), 0).position).toBe("with-the-column");
    expect(reckon(family(), STRAGGLER_KM).position).toBe("stragglers");
  });

  it("says it in a line a child could read out", () => {
    for (const r of [
      reckon(family(), 0),
      reckon(withAll({ morale: 10 }), 0),
      reckon(withAll({ following: false }), 0),
    ]) {
      expect(r.summary.length).toBeGreaterThan(40);
      expect(r.summary).toMatch(/\.$/);
    }
  });
});

describe("what the summary actually claims", () => {
  const family5 = family;

  /** The bug this test exists for: one person leaving is not "most of them". */
  it("does not say most of the household left when one person did", () => {
    const one = family5().map((m) => (m.id === "elon" ? { ...m, following: false } : m));
    const r = reckon(one, STRAGGLER_KM);
    expect(r.standing).toBe("scattered");
    expect(r.summary).not.toMatch(/most/i);
    expect(r.summary).toMatch(/One of your household/);
  });

  it("does say so when most of them actually did", () => {
    const most = family5().map((m, i) => (i < 3 ? { ...m, following: false } : m));
    const r = reckon(most, 0);
    expect(r.summary).toMatch(/came apart/i);
    expect(r.summary).toMatch(/3 of your household/);
  });

  it("counts one person correctly when the household is merely divided", () => {
    const one = family5().map((m) => (m.id === "elon" ? { ...m, following: false } : m));
    expect(reckon(one, 0).summary).toMatch(/^One of your household stopped walking/);
  });

  /** Nobody is ever described as lost, dead, or gone from Israel. */
  it("never says anyone died or left Israel", () => {
    const cases = [
      reckon(family5(), 0),
      reckon(family5().map((m) => ({ ...m, morale: 5 })), 0),
      reckon(family5().map((m) => ({ ...m, following: false })), STRAGGLER_KM),
    ];
    for (const r of cases) {
      expect(r.summary).not.toMatch(/\b(died|dead|lost them|left Israel|perished)\b/i);
    }
  });
});
