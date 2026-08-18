import { describe, expect, it } from "vitest";
import { applyEffect, applyEffectAll, moodOf, WEARY_AT, LOW_SPIRIT_AT, DISTRUSTFUL_AT } from "./camp";
import { AXIS_MAX, freshMember, type MemberState } from "./household";

const member = (over: Partial<MemberState> = {}): MemberState => ({
  ...freshMember("eliab", "head"),
  ...over,
});

describe("moodOf", () => {
  it("says nothing is wrong when nothing is wrong", () => {
    expect(moodOf(member({ condition: 90, morale: 90, trust: 90 }))).toBe("content");
  });

  it("puts a failing body ahead of everything else", () => {
    // All three are in a bad way; exhaustion is what they talk about.
    const spent = member({ condition: WEARY_AT - 1, morale: 5, trust: 5 });
    expect(moodOf(spent)).toBe("weary");
  });

  it("puts a failing spirit ahead of an argument about leadership", () => {
    const bleak = member({ condition: 90, morale: LOW_SPIRIT_AT - 1, trust: 5 });
    expect(moodOf(bleak)).toBe("low-spirit");
  });

  it("raises distrust only once body and spirit are holding", () => {
    const doubtful = member({ condition: 90, morale: 90, trust: DISTRUSTFUL_AT - 1 });
    expect(moodOf(doubtful)).toBe("distrustful");
  });

  it("treats each threshold as inclusive", () => {
    expect(moodOf(member({ condition: WEARY_AT }))).toBe("weary");
    expect(moodOf(member({ condition: 90, morale: LOW_SPIRIT_AT }))).toBe("low-spirit");
    expect(moodOf(member({ condition: 90, morale: 90, trust: DISTRUSTFUL_AT }))).toBe(
      "distrustful",
    );
  });

  it("gives a fresh household something ordinary to say", () => {
    expect(moodOf(freshMember("milcah", "child"))).toBe("content");
  });
});

describe("applyEffect", () => {
  it("moves the axes it names and leaves the rest alone", () => {
    const before = member({ condition: 50, morale: 50, trust: 50 });
    const after = applyEffect(before, { morale: 5 });
    expect(after.morale).toBe(55);
    expect(after.condition).toBe(50);
    expect(after.trust).toBe(50);
  });

  it("takes as well as gives", () => {
    expect(applyEffect(member({ condition: 50 }), { condition: -6 }).condition).toBe(44);
  });

  it("clamps at both ends", () => {
    expect(applyEffect(member({ morale: 3 }), { morale: -50 }).morale).toBe(0);
    expect(applyEffect(member({ morale: 98 }), { morale: 50 }).morale).toBe(AXIS_MAX);
  });

  it("returns the same object when the effect changes nothing", () => {
    const m = member();
    expect(applyEffect(m, {})).toBe(m);
    // Already full: a positive effect cannot move it.
    expect(applyEffect(member({ morale: AXIS_MAX }), { morale: 5 }).morale).toBe(AXIS_MAX);
  });

  it("applies to the whole household at once", () => {
    const family = [member(), member({ id: "milcah", condition: 40 })];
    const after = applyEffectAll(family, { condition: -10 });
    expect(after[0]!.condition).toBe(90);
    expect(after[1]!.condition).toBe(30);
    expect(applyEffectAll(family, {})).toBe(family);
  });
});
