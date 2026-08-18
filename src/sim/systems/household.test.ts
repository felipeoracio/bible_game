import { describe, expect, it } from "vitest";
import {
  AXIS_MAX,
  averageMorale,
  freshMember,
  HARDSHIP_THRESHOLD,
  restAll,
  walk,
  walkAll,
  weakest,
  type MemberState,
} from "./household";

const head = () => freshMember("eliab", "head");
const child = () => freshMember("milcah", "child");
const elder = () => freshMember("naamah", "elder");

describe("a member at the start", () => {
  it("is rested and hopeful, but does not yet trust you completely", () => {
    const member = head();
    expect(member.condition).toBe(AXIS_MAX);
    expect(member.morale).toBe(AXIS_MAX);
    expect(member.trust).toBeLessThan(AXIS_MAX);
    expect(member.trust).toBeGreaterThan(50);
  });
});

describe("walking", () => {
  it("costs condition, and costs more the harder the pace", () => {
    const steady = walk(head(), 10, "steady");
    const driving = walk(head(), 10, "driving");
    expect(steady.condition).toBeLessThan(AXIS_MAX);
    expect(driving.condition).toBeLessThan(steady.condition);
  });

  it("barely touches morale at a steady walk", () => {
    const after = walk(head(), 10, "steady");
    expect(AXIS_MAX - after.morale).toBeLessThan(2);
  });

  it("wears the children and the grandmother down faster than the adults", () => {
    const km = 20;
    const adultLoss = AXIS_MAX - walk(head(), km, "quick").condition;
    const childLoss = AXIS_MAX - walk(child(), km, "quick").condition;
    const elderLoss = AXIS_MAX - walk(elder(), km, "quick").condition;
    expect(childLoss).toBeGreaterThan(adultLoss);
    expect(elderLoss).toBeGreaterThan(childLoss);
  });

  it("never drops an axis below zero, however far the march goes", () => {
    let member = elder();
    for (let i = 0; i < 50; i++) member = walk(member, 30, "driving");
    expect(member.condition).toBe(0);
    expect(member.morale).toBe(0);
    expect(member.trust).toBeGreaterThanOrEqual(0);
  });

  it("returns the same object when nothing moved, so React can skip a render", () => {
    const member = head();
    expect(walk(member, 0, "driving")).toBe(member);
    expect(walk(member, -5, "driving")).toBe(member);
  });

  it("lets exhaustion eat into morale once a member is suffering", () => {
    // Two members walk the same distance at the same pace; the one who starts worn
    // down loses more morale, because being worn down is demoralising in itself.
    const rested: MemberState = { ...head(), condition: AXIS_MAX };
    const worn: MemberState = { ...head(), condition: 20 };
    const restedLoss = rested.morale - walk(rested, 5, "steady").morale;
    const wornLoss = worn.morale - walk(worn, 5, "steady").morale;
    expect(wornLoss).toBeGreaterThan(restedLoss);
  });
});

describe("trust", () => {
  it("does not move for walking as such", () => {
    const after = walk(head(), 25, "steady");
    expect(after.trust).toBe(head().trust);
  });

  it("falls when you drive a household that is already suffering", () => {
    const worn: MemberState = { ...head(), condition: HARDSHIP_THRESHOLD - 10 };
    const driven = walk(worn, 10, "driving");
    expect(driven.trust).toBeLessThan(worn.trust);
  });

  it("holds if you ease the pace instead", () => {
    const worn: MemberState = { ...head(), condition: HARDSHIP_THRESHOLD - 10 };
    expect(walk(worn, 10, "steady").trust).toBe(worn.trust);
  });
});

describe("resting in camp", () => {
  it("restores the body faster than the spirit", () => {
    const worn = [{ ...head(), condition: 30, morale: 30 }];
    const [rested] = restAll(worn);
    const conditionGain = rested!.condition - 30;
    const moraleGain = rested!.morale - 30;
    expect(conditionGain).toBeGreaterThan(moraleGain);
    expect(moraleGain).toBeGreaterThan(0);
  });

  it("cannot push an axis past full", () => {
    const [rested] = restAll([head()]);
    expect(rested!.condition).toBe(AXIS_MAX);
    expect(rested!.morale).toBe(AXIS_MAX);
  });

  it("leaves trust alone — a night's sleep does not earn it back", () => {
    const distrustful = [{ ...head(), trust: 40 }];
    expect(restAll(distrustful)[0]!.trust).toBe(40);
  });
});

describe("household summaries", () => {
  const family = () => [head(), child(), elder()];

  it("averages morale across everyone", () => {
    const mixed = [
      { ...head(), morale: 100 },
      { ...child(), morale: 50 },
    ];
    expect(averageMorale(mixed)).toBe(75);
    expect(averageMorale([])).toBe(AXIS_MAX);
  });

  it("finds whoever is in the worst shape, which is who the player should watch", () => {
    const walked = walkAll(family(), 25, "driving");
    expect(weakest(walked)?.id).toBe("naamah");
  });

  it("walks everyone at once, and returns the same array if nobody moved", () => {
    const family1 = family();
    expect(walkAll(family1, 0, "steady")).toBe(family1);
    expect(walkAll(family1, 5, "steady")).not.toBe(family1);
  });
});
