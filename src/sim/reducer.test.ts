import { describe, expect, it } from "vitest";
import { invented, type CastMember } from "@/content/types";
import { isLegComplete, legProgress, reduce } from "./reducer";
import { initialState, type GameState } from "./types";
import { freshManna } from "./systems/manna";
import type { RunnableSetPiece } from "./systems/setpiece";

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

describe("manna through the reducer", () => {
  /**
   * Manna does not exist until Leg 8, and until then it must not perturb a single
   * thing. This is the test that lets the system ship dormant.
   */
  describe("before it begins", () => {
    it("ignores every manna action", () => {
      const s = start();
      expect(reduce(s, { type: "GATHER_MANNA", inTime: true })).toBe(s);
      expect(reduce(s, { type: "LAY_ASIDE_MANNA", omers: 3 })).toBe(s);
    });

    it("leaves camp working exactly as it did", () => {
      const walked = reduce(start(), { type: "TRAVEL", km: 10 });
      const camped = reduce(walked, { type: "MAKE_CAMP" });
      expect(camped.day).toBe(walked.day + 1);
      expect(camped.kmSinceRest).toBe(0);
      expect(camped.mannaDay).toBe(0);
      expect(camped.manna).toEqual(freshManna());
      // Nobody starves in Egypt for want of a system that has not started.
      for (const member of camped.household) expect(member.condition).toBeGreaterThan(90);
    });
  });

  describe("once it begins", () => {
    const begun = () => reduce(start(), { type: "MANNA_BEGINS" });

    it("starts the week on its own clock, not the journey's", () => {
      const walked = reduce(start(), { type: "TRAVEL", km: 10 });
      const camped = reduce(walked, { type: "MAKE_CAMP" });
      const s = reduce(camped, { type: "MANNA_BEGINS" });
      expect(s.day).toBe(2);
      expect(s.mannaDay).toBe(1);
    });

    it("does not restart once it is running", () => {
      const once = begun();
      expect(reduce(once, { type: "MANNA_BEGINS" })).toBe(once);
    });

    it("fills the basket for the morning", () => {
      const gathered = reduce(begun(), { type: "GATHER_MANNA", inTime: true });
      expect(gathered.manna.fresh).toBe(CAST.length);
    });

    it("comes back empty-handed once the sun has grown hot", () => {
      const late = reduce(begun(), { type: "GATHER_MANNA", inTime: false });
      expect(late.manna.fresh).toBe(0);
    });

    it("feeds the household overnight and empties the basket by morning", () => {
      const gathered = reduce(begun(), { type: "GATHER_MANNA", inTime: true });
      const camped = reduce(gathered, { type: "MAKE_CAMP" });
      expect(camped.mannaDay).toBe(2);
      expect(camped.manna.fresh).toBe(0);
      expect(camped.mannaSpoiled).toBeUndefined();
    });

    it("finds worms in what was hoarded on an ordinary day", () => {
      const gathered = reduce(begun(), { type: "GATHER_MANNA", inTime: true });
      const hoarded = reduce(gathered, { type: "LAY_ASIDE_MANNA", omers: 99 });
      const camped = reduce(hoarded, { type: "MAKE_CAMP" });
      expect(camped.mannaSpoiled).toBe(CAST.length);
      expect(camped.manna.laidAside).toBe(0);
      // And they went without supper for it, which is the other half of v20.
      for (const member of camped.household) expect(member.condition).toBeLessThan(100);
    });

    it("goes hungry on a night it gathered nothing", () => {
      const camped = reduce(begun(), { type: "MAKE_CAMP" });
      for (const member of camped.household) expect(member.condition).toBeLessThan(100);
    });

    /** The sixth day and the Sabbath, played through the reducer as a player would. */
    it("carries a prepared household through the Sabbath", () => {
      let s = begun();
      // Days one to five.
      for (let i = 0; i < 5; i++) {
        s = reduce(s, { type: "GATHER_MANNA", inTime: true });
        s = reduce(s, { type: "MAKE_CAMP" });
      }
      expect(s.mannaDay).toBe(6);

      // The sixth day: twice as much falls, and the second omer is laid aside.
      s = reduce(s, { type: "GATHER_MANNA", inTime: true });
      expect(s.manna.fresh).toBe(CAST.length * 2);
      s = reduce(s, { type: "LAY_ASIDE_MANNA", omers: CAST.length });
      s = reduce(s, { type: "MAKE_CAMP" });

      // Sabbath morning: nothing rotted, and there is food without going out.
      expect(s.mannaDay).toBe(7);
      expect(s.mannaSpoiled).toBeUndefined();
      expect(s.manna.fresh).toBe(CAST.length);

      // Going out anyway finds none, and costs them nothing they already have.
      const wentOut = reduce(s, { type: "GATHER_MANNA", inTime: true });
      expect(wentOut.manna.fresh).toBe(CAST.length);

      const sabbathNight = reduce(s, { type: "MAKE_CAMP" });
      for (const member of sabbathNight.household) expect(member.condition).toBe(100);
    });

    it("leaves an unprepared household hungry on the Sabbath", () => {
      let s = begun();
      for (let i = 0; i < 6; i++) {
        s = reduce(s, { type: "GATHER_MANNA", inTime: true });
        s = reduce(s, { type: "MAKE_CAMP" });
      }
      expect(s.mannaDay).toBe(7);
      // The uneaten half of the sixth day's double portion bred worms.
      expect(s.mannaSpoiled).toBe(CAST.length);

      const before = s.household[0]!.condition;
      s = reduce(s, { type: "GATHER_MANNA", inTime: true });
      s = reduce(s, { type: "MAKE_CAMP" });
      expect(s.household[0]!.condition).toBeLessThan(before);
    });
  });
});

describe("falling behind, through the reducer", () => {
  it("starts in among the column", () => {
    expect(start().lagKm).toBe(0);
  });

  it("keeps a healthy household in place at a steady walk", () => {
    const walked = reduce(start(), { type: "TRAVEL", km: 20 });
    expect(walked.lagKm).toBeCloseTo(0);
  });

  /** The trap: drive them until they cannot walk, and the column leaves anyway. */
  it("drops a spent household behind however hard it is driven", () => {
    const spent: GameState = {
      ...start(),
      pace: "driving",
      household: start().household.map((m) => ({ ...m, condition: 12 })),
    };
    const walked = reduce(spent, { type: "TRAVEL", km: 10 });
    expect(walked.lagKm).toBeGreaterThan(0);
  });

  it("lets a recovered household make the ground back up", () => {
    const behind: GameState = { ...start(), lagKm: 6, pace: "driving" };
    const walked = reduce(behind, { type: "TRAVEL", km: 10 });
    expect(walked.lagKm).toBeLessThan(6);
  });

  it("never puts the household in front of Israel", () => {
    const s = reduce({ ...start(), pace: "driving" }, { type: "TRAVEL", km: 15 });
    expect(s.lagKm).toBe(0);
  });
});

describe("the household coming apart, through the reducer", () => {
  it("keeps everyone following on an ordinary march", () => {
    const walked = reduce(start(), { type: "TRAVEL", km: 15 });
    for (const member of walked.household) expect(member.following).toBe(true);
  });

  it("loses whoever a decision pushes past the end of their trust", () => {
    const strained: GameState = {
      ...start(),
      household: start().household.map((m) => ({ ...m, trust: 10 })),
    };
    const after = reduce(strained, {
      type: "DECIDE",
      eventId: "the-crossing",
      choiceId: "push-on",
      effects: { trust: -5 },
    });
    for (const member of after.household) expect(member.following).toBe(false);
  });

  /** Nobody dies and nobody leaves Israel — the household is the same size after. */
  it("never removes anyone from the household", () => {
    const before = start();
    const broken: GameState = {
      ...before,
      household: before.household.map((m) => ({ ...m, trust: 0 })),
    };
    const after = reduce(broken, {
      type: "DECIDE",
      eventId: "the-crossing",
      choiceId: "push-on",
      effects: { trust: -1 },
    });
    expect(after.household).toHaveLength(before.household.length);
  });

  it("takes them back once trust is properly rebuilt", () => {
    const gone: GameState = {
      ...start(),
      household: start().household.map((m) => ({ ...m, trust: 28, following: false })),
    };
    const after = reduce(gone, {
      type: "DECIDE",
      eventId: "the-crossing",
      choiceId: "wait",
      effects: { trust: 5 },
    });
    for (const member of after.household) expect(member.following).toBe(true);
  });
});

describe("set pieces, through the reducer", () => {
  const marah: RunnableSetPiece = {
    id: "marah",
    phases: [
      {
        id: "the-pool",
        futile: true,
        choices: [
          { id: "try-it", effects: { condition: -7 } },
          { id: "keep-them-back", effects: { trust: 5 } },
        ],
      },
    ],
    outcome: { provisions: { water: 999 }, effects: { morale: 12 } },
    unlocks: ["marah-note"],
  };

  const dry = (): GameState => ({ ...start(), water: { litres: 0, capacity: 24 } });

  const playThrough = (from: GameState, piece: RunnableSetPiece, choiceId: string) => {
    let s = reduce(from, { type: "BEGIN_SET_PIECE", piece });
    s = reduce(s, { type: "SET_PIECE_CHOOSE", piece, choiceId });
    s = reduce(s, { type: "SET_PIECE_ADVANCE", piece });
    return reduce(s, { type: "FINISH_SET_PIECE", piece });
  };

  it("begins once and does not restart on top of itself", () => {
    const begun = reduce(start(), { type: "BEGIN_SET_PIECE", piece: marah });
    expect(begun.setPiece?.id).toBe("marah");
    expect(reduce(begun, { type: "BEGIN_SET_PIECE", piece: marah })).toBe(begun);
  });

  /** The sea is in the way. You do not walk past a set piece. */
  it("stops the march dead while one is running", () => {
    const begun = reduce(start(), { type: "BEGIN_SET_PIECE", piece: marah });
    expect(reduce(begun, { type: "TRAVEL", km: 5 })).toBe(begun);
  });

  it("lets the march resume once it is finished", () => {
    const done = playThrough(start(), marah, "try-it");
    expect(reduce(done, { type: "TRAVEL", km: 5 }).distanceKm).toBeGreaterThan(0);
  });

  it("applies what the player chose to the household", () => {
    const begun = reduce(start(), { type: "BEGIN_SET_PIECE", piece: marah });
    const chosen = reduce(begun, { type: "SET_PIECE_CHOOSE", piece: marah, choiceId: "try-it" });
    expect(chosen.household[0]!.condition).toBeLessThan(100);
  });

  it("will not let the same phase be answered twice", () => {
    const begun = reduce(start(), { type: "BEGIN_SET_PIECE", piece: marah });
    const once = reduce(begun, { type: "SET_PIECE_CHOOSE", piece: marah, choiceId: "try-it" });
    const twice = reduce(once, { type: "SET_PIECE_CHOOSE", piece: marah, choiceId: "try-it" });
    expect(twice).toBe(once);
  });

  it("refuses to finish before every phase has been played", () => {
    const begun = reduce(start(), { type: "BEGIN_SET_PIECE", piece: marah });
    expect(reduce(begun, { type: "FINISH_SET_PIECE", piece: marah })).toBe(begun);
  });

  /** The payoff F9's whole water system was built for. */
  it("fills the skins from the recorded outcome, not from the choice", () => {
    const done = playThrough(dry(), marah, "try-it");
    expect(done.water.litres).toBe(done.water.capacity);
  });

  it("opens the Codex entry the outcome carries", () => {
    expect(playThrough(start(), marah, "try-it").unlockedCodex).toContain("marah-note");
  });

  /**
   * The bet the game rests on, checked at the level that actually ships: every
   * route through Marah ends with the same water and the same entry opened.
   */
  it("ends the same way whatever the player chose", () => {
    const a = playThrough(dry(), marah, "try-it");
    const b = playThrough(dry(), marah, "keep-them-back");

    expect(a.water.litres).toBe(b.water.litres);
    expect(a.unlockedCodex).toEqual(b.unlockedCodex);
    // The households differ, because that is the part the player does own.
    expect(a.household[0]!.condition).not.toBe(b.household[0]!.condition);
  });

  it("does not apply the outcome twice if finish is dispatched again", () => {
    const done = playThrough(start(), marah, "try-it");
    expect(reduce(done, { type: "FINISH_SET_PIECE", piece: marah })).toBe(done);
  });

  describe("Amalek at the rear", () => {
    const rephidim: RunnableSetPiece = {
      id: "rephidim",
      mechanic: "amalek-at-the-rear",
      phases: [{ id: "the-hill", futile: true, choices: [{ id: "watch" }] }],
      outcome: {},
    };

    /** Deuteronomy 25:18 — it costs you according to where you were standing. */
    it("costs a straggling household far more than one that kept up", () => {
      const kept = playThrough({ ...start(), lagKm: 0 }, rephidim, "watch");
      const behind = playThrough({ ...start(), lagKm: 20 }, rephidim, "watch");
      expect(behind.household[0]!.condition).toBeLessThan(kept.household[0]!.condition);
    });

    /** Exodus 17:13 — Joshua wins either way, and every household saw it. */
    it("raises trust even for the household that was caught", () => {
      const behind = playThrough({ ...start(), lagKm: 20 }, rephidim, "watch");
      expect(behind.household[0]!.trust).toBeGreaterThan(start().household[0]!.trust);
    });
  });

  describe("being placed under a judge", () => {
    const jethro: RunnableSetPiece = {
      id: "jethro",
      mechanic: "appointed-to-a-judge",
      phases: [{ id: "the-queue", choices: [{ id: "wait" }] }],
      outcome: {},
    };

    const withJudges = (from: GameState) => {
      let s = reduce(from, { type: "BEGIN_SET_PIECE", piece: jethro });
      s = reduce(s, { type: "SET_PIECE_CHOOSE", piece: jethro, choiceId: "wait" });
      s = reduce(s, { type: "SET_PIECE_ADVANCE", piece: jethro });
      return reduce(s, {
        type: "FINISH_SET_PIECE",
        piece: jethro,
        judgeIds: ["shelumiel", "ahira"],
      });
    };

    it("places the household under one of the judges the content has", () => {
      expect(["shelumiel", "ahira"]).toContain(withJudges(start()).judgeId);
    });

    it("keeps the judge for the rest of the run", () => {
      const placed = withJudges(start());
      const later = reduce(placed, { type: "TRAVEL", km: 5 });
      expect(later.judgeId).toBe(placed.judgeId);
    });

    it("does nothing when the content has no judges", () => {
      let s = reduce(start(), { type: "BEGIN_SET_PIECE", piece: jethro });
      s = reduce(s, { type: "SET_PIECE_CHOOSE", piece: jethro, choiceId: "wait" });
      s = reduce(s, { type: "SET_PIECE_ADVANCE", piece: jethro });
      expect(reduce(s, { type: "FINISH_SET_PIECE", piece: jethro }).judgeId).toBeUndefined();
    });
  });
});

describe("setting out on the next leg", () => {
  const nextLeg = { id: "leg-next", distanceKm: 15, terrain: "rocky-wadi" as const };

  /** A worn, thirsty, straggling household that has just finished a leg. */
  const finished = (): GameState => {
    let s = reduce(start(), { type: "SET_PACE", pace: "driving" });
    s = reduce(s, { type: "TRAVEL", km: 20 });
    return { ...s, lagKm: 4, arrivedAt: "somewhere", quizPending: "a-quiz" };
  };

  it("puts the household on the new road at the start of it", () => {
    const s = reduce(finished(), { type: "BEGIN_LEG", leg: nextLeg });
    expect(s.legId).toBe("leg-next");
    expect(s.legDistanceKm).toBe(15);
    expect(s.terrain).toBe("rocky-wadi");
    expect(s.distanceKm).toBe(0);
    expect(s.kmSinceRest).toBe(0);
  });

  it("clears what belonged to the leg just finished", () => {
    const s = reduce(finished(), { type: "BEGIN_LEG", leg: nextLeg });
    expect(s.arrivedAt).toBeUndefined();
    expect(s.quizPending).toBeUndefined();
    expect(s.setPiece).toBeUndefined();
  });

  /**
   * The heart of it. A leg is a fresh road, not a fresh start — everything the
   * household is carrying, in every sense, comes with them. This is what makes
   * pushing hard on leg 3 something you feel at Rephidim on leg 11.
   */
  describe("what comes with them", () => {
    it("keeps the household exactly as worn as it was", () => {
      const before = finished();
      const after = reduce(before, { type: "BEGIN_LEG", leg: nextLeg });
      expect(after.household).toEqual(before.household);
      expect(after.household[0]!.condition).toBeLessThan(100);
    });

    it("keeps the water in the skins", () => {
      const before = finished();
      const after = reduce(before, { type: "BEGIN_LEG", leg: nextLeg });
      expect(after.water).toEqual(before.water);
      expect(after.water.litres).toBeLessThan(after.water.capacity);
    });

    it("keeps how far behind the column they had fallen", () => {
      expect(reduce(finished(), { type: "BEGIN_LEG", leg: nextLeg }).lagKm).toBe(4);
    });

    it("keeps the day count, the Codex, and every decision taken", () => {
      const before = { ...finished(), unlockedCodex: ["succoth"], decisions: { x: "y" } };
      const after = reduce(before, { type: "BEGIN_LEG", leg: nextLeg });
      expect(after.day).toBe(before.day);
      expect(after.unlockedCodex).toEqual(["succoth"]);
      expect(after.decisions).toEqual({ x: "y" });
    });

    it("keeps the names the player chose", () => {
      const before = reduce(finished(), {
        type: "NAME_HOUSEHOLD",
        identities: { eliab: { name: "Hanniel", look: 1 } },
        head: { age: 40, trade: "shepherd" },
      });
      const after = reduce(before, { type: "BEGIN_LEG", leg: nextLeg });
      expect(after.identities.eliab).toEqual({ name: "Hanniel", look: 1 });
    });

    /** An event that has happened to this household has happened. */
    it("does not let an event fire again on a later leg", () => {
      const before = { ...finished(), fired: ["the-asking"] };
      expect(reduce(before, { type: "BEGIN_LEG", leg: nextLeg }).fired).toContain("the-asking");
    });
  });

  it("ignores an attempt to begin the leg already being walked", () => {
    const s = start();
    expect(reduce(s, { type: "BEGIN_LEG", leg: { ...nextLeg, id: s.legId } })).toBe(s);
  });

  it("carries a set piece onto the leg that has one", () => {
    const withSea: GameState = reduce(finished(), {
      type: "BEGIN_LEG",
      leg: { ...nextLeg, setPiece: { setPieceId: "the-crossing", atProgress: 0.5 } },
    });
    expect(withSea.schedule.setPiece?.setPieceId).toBe("the-crossing");

    // Walking past the trigger point stops the march and opens it.
    const walked = reduce(withSea, { type: "TRAVEL", km: 12 });
    expect(walked.setPiece?.id).toBe("the-crossing");
    expect(reduce(walked, { type: "TRAVEL", km: 3 })).toBe(walked);
  });

  it("does not open the set piece before the household has reached it", () => {
    const withSea = reduce(finished(), {
      type: "BEGIN_LEG",
      leg: { ...nextLeg, setPiece: { setPieceId: "the-crossing", atProgress: 0.9 } },
    });
    expect(reduce(withSea, { type: "TRAVEL", km: 2 }).setPiece).toBeUndefined();
  });
});
