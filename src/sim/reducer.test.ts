import { describe, expect, it } from "vitest";
import { invented, type CastMember } from "@/content/types";
import { isLegComplete, legProgress, reduce } from "./reducer";
import { initialState, type GameState } from "./types";

const CAST: CastMember[] = [
  { id: "eliab", name: "Eliab", role: "head", age: 35, description: "", provenance: invented() },
  { id: "milcah", name: "Milcah", role: "child", age: 6, description: "", provenance: invented() },
];

const start = (): GameState =>
  initialState({ id: "leg-test", distanceKm: 20, terrain: "open-desert" }, CAST);

/** A leg carrying one scripted event a third of the way along. */
const withEvents = (): GameState =>
  initialState(
    {
      id: "leg-test",
      distanceKm: 20,
      terrain: "open-desert",
      scripted: [{ eventId: "the-crossing", atProgress: 0.3 }],
      pool: [],
    },
    CAST,
  );

describe("reduce", () => {
  it("starts on day one at the departure point", () => {
    const s = start();
    expect(s.day).toBe(1);
    expect(s.distanceKm).toBe(0);
    expect(isLegComplete(s)).toBe(false);
  });

  it("does not mutate the state it is given", () => {
    const s = start();
    reduce(s, { type: "TRAVEL", km: 5 });
    expect(s.distanceKm).toBe(0);
  });

  it("accumulates distance as the household travels", () => {
    let s = start();
    s = reduce(s, { type: "TRAVEL", km: 5 });
    s = reduce(s, { type: "TRAVEL", km: 3 });
    expect(s.distanceKm).toBe(8);
    expect(legProgress(s)).toBeCloseTo(0.4);
  });

  it("clamps at the end of the leg — you cannot walk past the camp", () => {
    let s = start();
    s = reduce(s, { type: "TRAVEL", km: 999 });
    expect(s.distanceKm).toBe(20);
    expect(isLegComplete(s)).toBe(true);
    expect(legProgress(s)).toBe(1);
  });

  it("ignores zero and negative travel", () => {
    const s = start();
    expect(reduce(s, { type: "TRAVEL", km: 0 })).toBe(s);
    expect(reduce(s, { type: "TRAVEL", km: -5 })).toBe(s);
  });

  it("returns the same object when nothing changed, so React can skip re-rendering", () => {
    const s = start();
    expect(reduce(s, { type: "SET_PACE", pace: "steady" })).toBe(s);
    expect(reduce(s, { type: "SET_PACE", pace: "driving" })).not.toBe(s);
  });

  it("changes pace", () => {
    const s = reduce(start(), { type: "SET_PACE", pace: "driving" });
    expect(s.pace).toBe("driving");
  });

  it("advances the day when the household makes camp", () => {
    const s = reduce(start(), { type: "MAKE_CAMP" });
    expect(s.day).toBe(2);
  });

  it("wears the household down as it travels", () => {
    const before = start();
    const after = reduce(before, { type: "TRAVEL", km: 10 });
    expect(after.household[0]!.condition).toBeLessThan(before.household[0]!.condition);
    expect(after.kmSinceRest).toBe(10);
  });

  /**
   * Arriving must not charge the household for ground it never covered. Overshooting
   * the camp is clipped to the leg length, and the cost has to be clipped with it.
   */
  it("only charges the household for the ground actually walked", () => {
    const before = reduce(start(), { type: "TRAVEL", km: 19 });
    const arrived = reduce(before, { type: "TRAVEL", km: 500 });
    const lastKm = reduce(before, { type: "TRAVEL", km: 1 });
    expect(arrived.distanceKm).toBe(20);
    expect(arrived.household[0]!.condition).toBeCloseTo(lastKm.household[0]!.condition, 10);
  });

  it("does not charge for travel once the camp is reached", () => {
    const arrived = reduce(start(), { type: "TRAVEL", km: 20 });
    expect(reduce(arrived, { type: "TRAVEL", km: 10 })).toBe(arrived);
  });

  it("rests the household and clears the distance since rest at camp", () => {
    const walked = reduce(start(), { type: "TRAVEL", km: 18 });
    const camped = reduce(walked, { type: "MAKE_CAMP" });
    expect(camped.kmSinceRest).toBe(0);
    expect(camped.household[0]!.condition).toBeGreaterThan(walked.household[0]!.condition);
  });

  it("records a decision so later content can read it", () => {
    const decided = reduce(start(), {
      type: "DECIDE",
      eventId: "camp-first-night",
      choiceId: "share-the-bread",
    });
    expect(decided.decisions["camp-first-night"]).toBe("share-the-bread");
  });

  it("applies a decision's effects to the whole household", () => {
    const worn = reduce(start(), { type: "TRAVEL", km: 15 });
    const shared = reduce(worn, {
      type: "DECIDE",
      eventId: "camp-first-night",
      choiceId: "share-the-bread",
      effects: { condition: -6, trust: 6 },
    });
    expect(shared.household[0]!.condition).toBeCloseTo(worn.household[0]!.condition - 6, 8);
    expect(shared.household[0]!.trust).toBe(worn.household[0]!.trust + 6);
  });

  it("keeps decisions across later actions", () => {
    let s = reduce(start(), { type: "DECIDE", eventId: "camp-first-night", choiceId: "keep-it-for-your-own" });
    s = reduce(s, { type: "MAKE_CAMP" });
    s = reduce(s, { type: "TRAVEL", km: 3 });
    expect(s.decisions["camp-first-night"]).toBe("keep-it-for-your-own");
  });

  it("counts nights in camp separately from days", () => {
    const camped = reduce(reduce(start(), { type: "MAKE_CAMP" }), { type: "MAKE_CAMP" });
    expect(camped.nightsCamped).toBe(2);
    expect(camped.day).toBe(3);
  });

  it("fires a scripted event when the household reaches its point in the leg", () => {
    const early = reduce(withEvents(), { type: "TRAVEL", km: 3 });
    expect(early.activeEventId).toBeUndefined();
    const reached = reduce(early, { type: "TRAVEL", km: 4 });
    expect(reached.activeEventId).toBe("the-crossing");
    expect(reached.fired).toContain("the-crossing");
  });

  /**
   * Holding the march key through an incident must not skip it. The reducer, not
   * the UI, is what stops the column.
   */
  it("halts the march while an event is on screen", () => {
    const stopped = reduce(withEvents(), { type: "TRAVEL", km: 8 });
    expect(stopped.activeEventId).toBe("the-crossing");
    const pushed = reduce(stopped, { type: "TRAVEL", km: 5 });
    expect(pushed).toBe(stopped);
    expect(pushed.distanceKm).toBe(stopped.distanceKm);
  });

  it("resumes the march once the event is dismissed", () => {
    const stopped = reduce(withEvents(), { type: "TRAVEL", km: 8 });
    const clear = reduce(stopped, { type: "DISMISS_EVENT" });
    expect(clear.activeEventId).toBeUndefined();
    expect(reduce(clear, { type: "TRAVEL", km: 2 }).distanceKm).toBeGreaterThan(
      stopped.distanceKm,
    );
  });

  /**
   * Deciding must leave the card up: the player has to be able to read what their
   * choice did. Dismissing is the thing that closes it, and the march stays halted
   * until then.
   */
  it("keeps the event open after a decision, so its outcome can be read", () => {
    const stopped = reduce(withEvents(), { type: "TRAVEL", km: 8 });
    const decided = reduce(stopped, {
      type: "DECIDE",
      eventId: "the-crossing",
      choiceId: "hold-together",
    });
    expect(decided.activeEventId).toBe("the-crossing");
    expect(decided.decisions["the-crossing"]).toBe("hold-together");
    expect(reduce(decided, { type: "TRAVEL", km: 4 })).toBe(decided);

    const walkedOn = reduce(decided, { type: "DISMISS_EVENT" });
    expect(walkedOn.activeEventId).toBeUndefined();
  });

  it("never fires the same event twice in a run", () => {
    let s = reduce(withEvents(), { type: "TRAVEL", km: 8 });
    s = reduce(s, { type: "DISMISS_EVENT" });
    for (let i = 0; i < 10; i++) s = reduce(s, { type: "TRAVEL", km: 1 });
    expect(s.activeEventId).toBeUndefined();
    expect(s.fired.filter((id) => id === "the-crossing")).toHaveLength(1);
  });

  it("replays identically from the same seed", () => {
    const walk = (seed: number) => {
      let s = initialState(
        { id: "leg", distanceKm: 30, terrain: "open-desert", scripted: [], pool: ["a", "b"] },
        CAST,
        seed,
      );
      const seen: string[] = [];
      for (let i = 0; i < 60; i++) {
        s = reduce(s, { type: "TRAVEL", km: 0.5 });
        if (s.activeEventId) {
          seen.push(s.activeEventId);
          s = reduce(s, { type: "DISMISS_EVENT" });
        }
      }
      return seen;
    };
    expect(walk(2024)).toEqual(walk(2024));
    expect(walk(2024).length).toBeGreaterThan(0);
  });

  it("opens the waypoint entry on arrival, exactly once", () => {
    const leg = {
      id: "leg-test",
      distanceKm: 10,
      terrain: "open-desert" as const,
      scripted: [],
      pool: [],
      waypoint: "succoth",
      unlocks: ["how-far-was-it"],
    };
    let s = initialState(leg, CAST);
    expect(s.unlockedCodex).toEqual([]);

    s = reduce(s, { type: "TRAVEL", km: 6 });
    expect(s.arrivedAt).toBeUndefined();

    s = reduce(s, { type: "TRAVEL", km: 6 });
    expect(s.arrivedAt).toBe("succoth");
    expect(s.unlockedCodex).toEqual(["succoth", "how-far-was-it"]);

    // Walking on at the camp must not re-open it.
    const dismissed = reduce(s, { type: "DISMISS_WAYPOINT" });
    const pushed = reduce(dismissed, { type: "TRAVEL", km: 5 });
    expect(pushed.arrivedAt).toBeUndefined();
    expect(pushed.unlockedCodex).toEqual(["succoth", "how-far-was-it"]);
  });

  it("opens the entries an event carries when it fires", () => {
    const leg = {
      id: "leg-test",
      distanceKm: 20,
      terrain: "open-desert" as const,
      scripted: [{ eventId: "the-dough", atProgress: 0.2 }],
      pool: [],
      eventUnlocks: { "the-dough": ["kneading-troughs"] },
    };
    const s = reduce(initialState(leg, CAST), { type: "TRAVEL", km: 5 });
    expect(s.activeEventId).toBe("the-dough");
    expect(s.unlockedCodex).toContain("kneading-troughs");
  });

  it("never lists the same entry twice", () => {
    const leg = {
      id: "leg-test",
      distanceKm: 10,
      terrain: "open-desert" as const,
      waypoint: "succoth",
      unlocks: ["succoth"],
    };
    const s = reduce(initialState(leg, CAST), { type: "TRAVEL", km: 12 });
    expect(s.unlockedCodex).toEqual(["succoth"]);
  });

  it("queues the checkpoint on arrival and clears it when it is done", () => {
    const leg = {
      id: "leg-test",
      distanceKm: 10,
      terrain: "open-desert" as const,
      waypoint: "succoth",
      quiz: "quiz-leg-01",
    };
    let s = reduce(initialState(leg, CAST), { type: "TRAVEL", km: 12 });
    expect(s.quizPending).toBe("quiz-leg-01");
    s = reduce(s, { type: "FINISH_QUIZ" });
    expect(s.quizPending).toBeUndefined();
  });

  it("keeps a running score across the run, and a retry costs only the score", () => {
    let s = start();
    s = reduce(s, { type: "ANSWER", questionId: "q1", correct: false });
    s = reduce(s, { type: "ANSWER", questionId: "q1", correct: true });
    s = reduce(s, { type: "ANSWER", questionId: "q2", correct: true });
    expect(s.quiz.correct).toEqual(["q1", "q2"]);
    expect(s.quiz.attempts).toEqual({ q1: 2, q2: 1 });
    // Nothing else about the household moved — a wrong answer is never a penalty.
    expect(s.household).toEqual(start().household);
  });

  it("drinks from the skins as the household walks", () => {
    const before = start();
    const after = reduce(before, { type: "TRAVEL", km: 10 });
    expect(after.water.litres).toBeLessThan(before.water.litres);
    // Still watered, so nobody is suffering for it yet.
    for (const member of after.household) expect(member.water).toBe(100);
  });

  /**
   * The point of §5.3: running dry is not just a number going down, it makes the
   * march itself cost more. Same distance, same pace — only the water differs.
   */
  it("makes walking cost more when the skins are empty", () => {
    const watered = reduce(start(), { type: "TRAVEL", km: 12 });

    const dryStart: GameState = {
      ...start(),
      water: { litres: 0, capacity: 24 },
      household: start().household.map((m) => ({ ...m, water: 10 })),
    };
    const parched = reduce(dryStart, { type: "TRAVEL", km: 12 });

    expect(parched.household[0]!.condition).toBeLessThan(watered.household[0]!.condition);
  });

  it("never lets the player refill the skins by walking or resting", () => {
    const walked = reduce(start(), { type: "TRAVEL", km: 10 });
    const camped = reduce(walked, { type: "MAKE_CAMP" });
    expect(camped.water.litres).toBeLessThanOrEqual(walked.water.litres);
  });

  it("fills the skins only from a scripted choice", () => {
    const drained: GameState = { ...start(), water: { litres: 2, capacity: 24 } };
    const found = reduce(drained, {
      type: "DECIDE",
      eventId: "the-spring",
      choiceId: "fill-every-skin",
      provisions: { water: 15 },
    });
    expect(found.water.litres).toBe(17);
  });

  it("lets a choice widen what the household can carry", () => {
    const wider = reduce(start(), {
      type: "DECIDE",
      eventId: "the-dough-unrisen",
      choiceId: "leave-the-trough",
      provisions: { waterCapacity: 8, water: 8 },
    });
    expect(wider.water.capacity).toBe(32);
    expect(wider.water.litres).toBe(32);
  });

  it("records the names and faces the player chose for the whole household", () => {
    const named = reduce(start(), {
      type: "NAME_HOUSEHOLD",
      identities: {
        eliab: { name: "Hanniel", look: 2 },
        milcah: { name: "Achsah", look: 1 },
      },
      head: { age: 41, trade: "shepherd" },
    });
    expect(named.identities.eliab).toEqual({ name: "Hanniel", look: 2 });
    expect(named.identities.milcah).toEqual({ name: "Achsah", look: 1 });
    expect(named.head).toEqual({ age: 41, trade: "shepherd" });
  });

  it("starts every member named from the roster, with the first look", () => {
    const s = start();
    expect(s.identities.eliab).toEqual({ name: "Eliab", look: 0 });
    expect(s.identities.milcah).toEqual({ name: "Milcah", look: 0 });
  });
});
