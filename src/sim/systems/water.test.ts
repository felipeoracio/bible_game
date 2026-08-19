import { describe, expect, it } from "vitest";
import {
  daysOfWaterLeft,
  drink,
  freshWater,
  householdThirst,
  PARCHED_THRESHOLD,
  refill,
  STARTING_CAPACITY_L,
  thirstiest,
  thirstOf,
  thirstPenalty,
  widenCapacity,
} from "./water";
import { AXIS_MAX, freshMember, type MemberState } from "./household";

const family = (): MemberState[] => [
  freshMember("eliab", "head"),
  freshMember("tirzah", "spouse"),
  freshMember("elon", "child"),
  freshMember("milcah", "child"),
  freshMember("naamah", "elder"),
];

describe("thirst", () => {
  it("rises with distance", () => {
    const member = freshMember("eliab", "head");
    expect(thirstOf(member, 20, "steady", "open-desert")).toBeGreaterThan(
      thirstOf(member, 10, "steady", "open-desert"),
    );
  });

  it("rises with the pace being pushed", () => {
    const member = freshMember("eliab", "head");
    const steady = thirstOf(member, 10, "steady", "open-desert");
    const quick = thirstOf(member, 10, "quick", "open-desert");
    const driving = thirstOf(member, 10, "driving", "open-desert");
    expect(quick).toBeGreaterThan(steady);
    expect(driving).toBeGreaterThan(quick);
  });

  it("rises with the heat of the ground being crossed", () => {
    const member = freshMember("eliab", "head");
    const marsh = thirstOf(member, 10, "steady", "delta-marsh");
    const desert = thirstOf(member, 10, "steady", "open-desert");
    expect(desert).toBeGreaterThan(marsh);
  });

  it("falls harder on children and the old than on the two adults", () => {
    const adult = thirstOf(freshMember("eliab", "head"), 10, "steady", "open-desert");
    const child = thirstOf(freshMember("milcah", "child"), 10, "steady", "open-desert");
    const elder = thirstOf(freshMember("naamah", "elder"), 10, "steady", "open-desert");
    expect(child).toBeGreaterThan(adult);
    expect(elder).toBeGreaterThan(adult);
  });

  it("is nothing at all when nobody has moved", () => {
    expect(householdThirst(family(), 0, "driving", "open-desert")).toBe(0);
  });
});

describe("drinking", () => {
  it("draws from the skins and holds everyone steady while there is enough", () => {
    const before = freshWater();
    const result = drink(before, family(), 10, "steady", "delta-marsh");
    expect(result.water.litres).toBeLessThan(before.litres);
    expect(result.satisfaction).toBe(1);
    for (const member of result.household) expect(member.water).toBe(AXIS_MAX);
  });

  it("empties the skins rather than going negative", () => {
    const nearlyDry = { litres: 0.2, capacity: STARTING_CAPACITY_L };
    const result = drink(nearlyDry, family(), 30, "driving", "open-desert");
    expect(result.water.litres).toBe(0);
    expect(result.satisfaction).toBeGreaterThan(0);
    expect(result.satisfaction).toBeLessThan(1);
  });

  /** The crisis the text keeps returning to: no water at all, and everyone falling. */
  it("dries the household out when there is nothing left", () => {
    const dry = { litres: 0, capacity: STARTING_CAPACITY_L };
    const result = drink(dry, family(), 10, "steady", "open-desert");
    expect(result.satisfaction).toBe(0);
    for (const member of result.household) expect(member.water).toBeLessThan(AXIS_MAX);
  });

  it("dries the children and the elder out fastest", () => {
    const dry = { litres: 0, capacity: STARTING_CAPACITY_L };
    const { household } = drink(dry, family(), 10, "steady", "open-desert");
    const byId = Object.fromEntries(household.map((m) => [m.id, m]));
    expect(byId.milcah!.water).toBeLessThan(byId.eliab!.water);
    expect(byId.naamah!.water).toBeLessThan(byId.eliab!.water);
  });

  it("never drops hydration below zero, however long the drought", () => {
    let household = family();
    let water = { litres: 0, capacity: STARTING_CAPACITY_L };
    for (let i = 0; i < 40; i++) {
      const result = drink(water, household, 20, "driving", "open-desert");
      water = result.water;
      household = result.household;
    }
    for (const member of household) expect(member.water).toBe(0);
  });

  it("brings a parched household back up once water is found again", () => {
    const parched = family().map((m) => ({ ...m, water: 20 }));
    const { household } = drink(freshWater(), parched, 10, "steady", "delta-marsh");
    for (const member of household) expect(member.water).toBeGreaterThan(20);
  });
});

describe("the thirst penalty", () => {
  it("costs nothing while a member is watered", () => {
    const watered = { ...freshMember("eliab", "head"), water: AXIS_MAX };
    expect(thirstPenalty(watered, 10)).toBe(0);
  });

  it("only begins once they are genuinely short", () => {
    const fine = { ...freshMember("eliab", "head"), water: PARCHED_THRESHOLD };
    const short = { ...freshMember("eliab", "head"), water: PARCHED_THRESHOLD - 1 };
    expect(thirstPenalty(fine, 10)).toBe(0);
    expect(thirstPenalty(short, 10)).toBeGreaterThan(0);
  });

  it("bites harder the drier they get", () => {
    const dry = { ...freshMember("eliab", "head"), water: 5 };
    const damp = { ...freshMember("eliab", "head"), water: 35 };
    expect(thirstPenalty(dry, 10)).toBeGreaterThan(thirstPenalty(damp, 10));
  });
});

describe("finding water", () => {
  it("is the only way the skins ever fill", () => {
    const half = { litres: 5, capacity: STARTING_CAPACITY_L };
    expect(refill(half, 10).litres).toBe(15);
  });

  /** Elim's twelve springs are a rest, not a stockpile. */
  it("leaves behind whatever cannot be carried", () => {
    const half = { litres: 20, capacity: STARTING_CAPACITY_L };
    expect(refill(half, 999).litres).toBe(STARTING_CAPACITY_L);
  });

  it("ignores a refill of nothing", () => {
    const store = freshWater();
    expect(refill(store, 0)).toBe(store);
    expect(refill(store, -5)).toBe(store);
  });

  it("can widen what the household is able to carry", () => {
    const wider = widenCapacity(freshWater(), 8);
    expect(wider.capacity).toBe(STARTING_CAPACITY_L + 8);
    // Widening does not itself hand over any water.
    expect(wider.litres).toBe(STARTING_CAPACITY_L);
  });
});

describe("reading the situation", () => {
  it("names whoever is closest to trouble", () => {
    const household = family().map((m) =>
      m.id === "naamah" ? { ...m, water: 12 } : m,
    );
    expect(thirstiest(household)?.id).toBe("naamah");
  });

  it("estimates how many days of walking are left in the skins", () => {
    const full = daysOfWaterLeft(freshWater(), family(), "steady", "delta-marsh");
    const driven = daysOfWaterLeft(freshWater(), family(), "driving", "open-desert");
    expect(full).toBeGreaterThan(driven);
    expect(driven).toBeGreaterThan(0);
  });
});
