import { describe, expect, it } from "vitest";
import {
  firstPooledAtKm,
  nextEvent,
  POOL_GAP_MAX_KM,
  POOL_GAP_MIN_KM,
  type LegSchedule,
  type TriggerInput,
} from "./events";

const schedule: LegSchedule = {
  scripted: [
    { eventId: "departure", atProgress: 0 },
    { eventId: "dough", atProgress: 0.35 },
    { eventId: "asking", atProgress: 0.7 },
  ],
  pool: ["hotep", "strap"],
  unlocks: [],
  eventUnlocks: {},
};

const at = (over: Partial<TriggerInput> = {}): TriggerInput => ({
  schedule,
  progress: 0,
  distanceKm: 0,
  fired: [],
  nextPooledAtKm: 999,
  seed: 1234,
  ...over,
});

describe("scripted events", () => {
  it("fires the opening event at the very start of the leg", () => {
    expect(nextEvent(at())?.eventId).toBe("departure");
  });

  it("does not fire again once it has fired", () => {
    expect(nextEvent(at({ fired: ["departure"] }))).toBeUndefined();
  });

  it("waits until its point in the leg", () => {
    expect(nextEvent(at({ progress: 0.2, fired: ["departure"] }))).toBeUndefined();
    expect(nextEvent(at({ progress: 0.35, fired: ["departure"] }))?.eventId).toBe("dough");
  });

  /**
   * A player who covers a lot of ground between frames must not skip the story.
   * Both remaining slots are due here; the earlier one still goes first.
   */
  it("fires the earlier slot first when several are due at once", () => {
    const jumped = at({ progress: 1, fired: ["departure"] });
    expect(nextEvent(jumped)?.eventId).toBe("dough");
    expect(nextEvent({ ...jumped, fired: ["departure", "dough"] })?.eventId).toBe("asking");
  });

  it("takes priority over a pooled event that is also due", () => {
    const both = at({ progress: 0.35, fired: ["departure"], distanceKm: 20, nextPooledAtKm: 5 });
    expect(nextEvent(both)?.eventId).toBe("dough");
  });
});

describe("pooled events", () => {
  const allScriptedDone = ["departure", "dough", "asking"];

  it("stays quiet until the household has covered some ground", () => {
    const early = at({ progress: 1, fired: allScriptedDone, distanceKm: 3, nextPooledAtKm: 8 });
    expect(nextEvent(early)).toBeUndefined();
  });

  it("fires once the gap is covered", () => {
    const due = at({ progress: 1, fired: allScriptedDone, distanceKm: 8, nextPooledAtKm: 8 });
    expect(schedule.pool).toContain(nextEvent(due)?.eventId);
  });

  it("never repeats within a run, and falls silent once the pool is spent", () => {
    const spent = at({
      progress: 1,
      fired: [...allScriptedDone, "hotep", "strap"],
      distanceKm: 25,
      nextPooledAtKm: 8,
    });
    expect(nextEvent(spent)).toBeUndefined();
  });

  it("pushes the next one a sensible distance down the road", () => {
    const due = at({ progress: 1, fired: allScriptedDone, distanceKm: 8, nextPooledAtKm: 8 });
    const result = nextEvent(due)!;
    expect(result.nextPooledAtKm).toBeGreaterThanOrEqual(8 + POOL_GAP_MIN_KM);
    expect(result.nextPooledAtKm).toBeLessThanOrEqual(8 + POOL_GAP_MAX_KM);
  });

  it("advances the seed so the following draw is a different roll", () => {
    const due = at({ progress: 1, fired: allScriptedDone, distanceKm: 8, nextPooledAtKm: 8 });
    expect(nextEvent(due)!.seed).not.toBe(due.seed);
  });

  it("leaves the seed alone for scripted events, which involve no chance", () => {
    const result = nextEvent(at({ seed: 42 }))!;
    expect(result.seed).toBe(42);
  });
});

describe("reproducibility", () => {
  it("gives the same run for the same seed", () => {
    const draw = (seed: number) => {
      const input = at({ progress: 1, fired: ["departure", "dough", "asking"], distanceKm: 9, nextPooledAtKm: 9, seed });
      return nextEvent(input);
    };
    expect(draw(777)).toEqual(draw(777));
  });

  it("gives different runs for different seeds", () => {
    const spread = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const input = at({ progress: 1, fired: ["departure", "dough", "asking"], distanceKm: 9, nextPooledAtKm: 9, seed });
      const picked = nextEvent(input)?.eventId;
      if (picked) spread.add(picked);
    }
    // Over many seeds both pooled events should come up.
    expect(spread.size).toBe(2);
  });

  it("staggers the first pooled event within the allowed gap", () => {
    for (const seed of [1, 2, 3, 99]) {
      const km = firstPooledAtKm(seed);
      expect(km).toBeGreaterThanOrEqual(POOL_GAP_MIN_KM);
      expect(km).toBeLessThanOrEqual(POOL_GAP_MAX_KM);
    }
  });
});
