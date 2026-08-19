import { describe, expect, it } from "vitest";
import { invented, type CastMember } from "@/content/types";
import {
  byMostRecent,
  CURRENT_VERSION,
  emptySaveFile,
  MAX_RUNS,
  migrate,
  parseSaveFile,
  remove,
  restore,
  toPersisted,
  toSavedRun,
  upsert,
  type SavedRun,
} from "./save";
import { reduce } from "./reducer";
import { initialState, type GameState } from "./types";
import { AXIS_MAX } from "./systems/household";

const CAST: CastMember[] = [
  { id: "eliab", name: "Eliab", role: "head", age: 35, description: "", provenance: invented() },
  { id: "milcah", name: "Milcah", role: "child", age: 6, description: "", provenance: invented() },
];

const LEG = { id: "leg-test", distanceKm: 20, terrain: "open-desert" as const };

const start = (): GameState => initialState(LEG, CAST);

const saved = (state: GameState): SavedRun =>
  toSavedRun(state, { id: "run-1", name: "Eliab", at: 1000 });

/** A run carrying an arbitrary state blob, for the untrusted-input tests. */
const withState = (state: unknown): SavedRun =>
  ({ id: "run-1", name: "Eliab", updatedAt: 1000, legId: LEG.id, state }) as SavedRun;

describe("what gets written", () => {
  /**
   * The leg's schedule, distance and terrain belong to the episode rather than to
   * the player, so a save made before a content fix picks the fix up.
   */
  it("leaves the content-derived fields out of the file", () => {
    const persisted = toPersisted(start()) as Record<string, unknown>;
    expect(persisted.schedule).toBeUndefined();
    expect(persisted.legDistanceKm).toBeUndefined();
    expect(persisted.terrain).toBeUndefined();
  });

  it("keeps everything the player actually did", () => {
    const persisted = toPersisted(start());
    expect(persisted.household).toHaveLength(2);
    expect(persisted.decisions).toBeDefined();
    expect(persisted.unlockedCodex).toBeDefined();
  });

  it("records the leg and the head's name on the slot", () => {
    const run = saved(start());
    expect(run.legId).toBe(LEG.id);
    expect(run.name).toBe("Eliab");
  });
});

describe("a round trip", () => {
  it("brings a run back exactly as it was left", () => {
    let state = reduce(start(), { type: "SET_PACE", pace: "driving" });
    state = reduce(state, { type: "TRAVEL", km: 7 });
    state = reduce(state, { type: "MAKE_CAMP" });

    const back = restore(saved(state), start());

    expect(back.day).toBe(state.day);
    expect(back.pace).toBe(state.pace);
    expect(back.distanceKm).toBeCloseTo(state.distanceKm);
    expect(back.nightsCamped).toBe(state.nightsCamped);
    expect(back.water.litres).toBeCloseTo(state.water.litres);
    expect(back.household).toEqual(state.household);
  });

  it("carries the player's names and choices across", () => {
    let state = reduce(start(), {
      type: "NAME_HOUSEHOLD",
      identities: { eliab: { name: "Hanniel", look: 2 }, milcah: { name: "Achsah", look: 1 } },
      head: { age: 41, trade: "shepherd" },
    });
    state = reduce(state, { type: "DECIDE", eventId: "the-asking", choiceId: "ask" });

    const back = restore(saved(state), start());
    expect(back.identities.eliab).toEqual({ name: "Hanniel", look: 2 });
    expect(back.head).toEqual({ age: 41, trade: "shepherd" });
    expect(back.decisions["the-asking"]).toBe("ask");
  });

  it("rebuilds the leg from content rather than from the file", () => {
    const back = restore(saved(start()), start());
    expect(back.legDistanceKm).toBe(LEG.distanceKm);
    expect(back.terrain).toBe(LEG.terrain);
    expect(back.schedule).toBeDefined();
  });
});

/**
 * The heart of this feature. A save file lives in localStorage, where anyone with
 * dev tools can edit it, and may have been written by an older build. None of the
 * following may crash, and none of them may produce an impossible game.
 */
describe("a save file is untrusted input", () => {
  it("survives a completely empty state", () => {
    const back = restore(withState({}), start());
    expect(back).toEqual(start());
  });

  it("survives a state that is not an object at all", () => {
    expect(() => restore(withState("nonsense"), start())).not.toThrow();
    expect(() => restore(withState(null), start())).not.toThrow();
    expect(restore(withState(42), start()).day).toBe(1);
  });

  it("refuses NaN and Infinity, which would poison every later sum", () => {
    const back = restore(withState({ day: NaN, distanceKm: Infinity, lagKm: -Infinity }), start());
    expect(Number.isFinite(back.day)).toBe(true);
    expect(Number.isFinite(back.distanceKm)).toBe(true);
    expect(Number.isFinite(back.lagKm)).toBe(true);
  });

  it("refuses a hand-edited household with axes out of range", () => {
    const back = restore(
      withState({
        household: [{ id: "eliab", condition: 999, morale: -50, trust: "lots", water: NaN }],
      }),
      start(),
    );
    const eliab = back.household.find((m) => m.id === "eliab")!;
    expect(eliab.condition).toBe(AXIS_MAX);
    expect(eliab.morale).toBe(0);
    expect(eliab.trust).toBe(80);
    expect(eliab.water).toBe(AXIS_MAX);
  });

  /** A file cannot invent a person, or change what somebody is in the family. */
  it("will not let a file add people to the household", () => {
    const back = restore(
      withState({ household: [{ id: "pharaoh", role: "head", condition: 100 }] }),
      start(),
    );
    expect(back.household.map((m) => m.id)).toEqual(["eliab", "milcah"]);
  });

  it("will not let a file change somebody's role", () => {
    const back = restore(withState({ household: [{ id: "milcah", role: "head" }] }), start());
    expect(back.household.find((m) => m.id === "milcah")!.role).toBe("child");
  });

  /** Content drift: the cast gained somebody since this run was saved. */
  it("brings new members in fresh when the cast has grown", () => {
    const older = withState({ household: [{ id: "eliab", condition: 40 }] });
    const back = restore(older, start());
    expect(back.household.find((m) => m.id === "eliab")!.condition).toBe(40);
    expect(back.household.find((m) => m.id === "milcah")!.condition).toBe(AXIS_MAX);
  });

  it("cannot strand the player past the end of a leg that has since been shortened", () => {
    const back = restore(withState({ distanceKm: 9999 }), start());
    expect(back.distanceKm).toBe(LEG.distanceKm);
  });

  it("cannot carry more water than the skins hold", () => {
    const back = restore(withState({ water: { litres: 500, capacity: 24 } }), start());
    expect(back.water.litres).toBeLessThanOrEqual(24);
  });

  it("refuses a made-up pace", () => {
    expect(restore(withState({ pace: "sprinting" }), start()).pace).toBe("steady");
  });

  it("drops non-string entries from the id lists", () => {
    const back = restore(withState({ unlockedCodex: ["succoth", 7, null, "how-far"] }), start());
    expect(back.unlockedCodex).toEqual(["succoth", "how-far"]);
  });

  /** First-try accuracy is a study record, so it must not be forgeable with a string. */
  it("refuses quiz attempt counts that are not whole numbers", () => {
    const back = restore(
      withState({ quiz: { attempts: { q1: "perfect", q2: 0, q3: 2.7 }, correct: ["q3"] } }),
      start(),
    );
    expect(back.quiz.attempts.q1).toBeUndefined();
    expect(back.quiz.attempts.q2).toBeUndefined();
    expect(back.quiz.attempts.q3).toBe(2);
  });
});

describe("reading the file off disk", () => {
  it("reports an empty slot rather than failing", () => {
    expect(parseSaveFile(null)).toEqual({ ok: false, reason: "empty" });
    expect(parseSaveFile("")).toEqual({ ok: false, reason: "empty" });
  });

  it("reports unreadable json rather than throwing", () => {
    const result = parseSaveFile("{ this is not json");
    expect(result).toEqual({ ok: false, reason: "unreadable" });
  });

  /**
   * Refused rather than guessed at. Misreading a file the player may still open in
   * a newer tab is worse than admitting this build cannot read it.
   */
  it("refuses a file from a newer build of the game", () => {
    const result = parseSaveFile({ version: CURRENT_VERSION + 1, runs: [] });
    expect(result).toEqual({ ok: false, reason: "from-a-newer-version" });
  });

  it("reads a file this build wrote", () => {
    const file = upsert(emptySaveFile(), saved(start()));
    const result = parseSaveFile(JSON.stringify(file));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.runs).toHaveLength(1);
  });

  it("keeps the good runs and drops the broken ones", () => {
    const good = saved(start());
    const result = parseSaveFile({
      version: CURRENT_VERSION,
      runs: [good, { name: "no id" }, null, { id: "x" }, "nonsense"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.runs.map((r) => r.id)).toEqual(["run-1"]);
  });

  it("treats a file with no runs array as a file with no runs", () => {
    const result = parseSaveFile({ version: CURRENT_VERSION });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.runs).toEqual([]);
  });

  it("stamps the current version on anything it migrates", () => {
    expect(migrate({ version: 0, runs: [] }).version).toBe(CURRENT_VERSION);
  });
});

describe("the slots", () => {
  const runAt = (id: string, at: number): SavedRun => ({
    ...saved(start()),
    id,
    updatedAt: at,
  });

  it("lists the most recently played first", () => {
    const runs = [runAt("a", 10), runAt("b", 30), runAt("c", 20)];
    expect(byMostRecent(runs).map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("replaces a run rather than piling up copies of it", () => {
    let file = upsert(emptySaveFile(), runAt("a", 10));
    file = upsert(file, runAt("a", 20));
    expect(file.runs).toHaveLength(1);
    expect(file.runs[0]!.updatedAt).toBe(20);
  });

  /** A family that keeps starting journeys must not fill the browser's quota. */
  it("drops the oldest once the slots are full", () => {
    let file = emptySaveFile();
    for (let i = 0; i < MAX_RUNS + 3; i++) file = upsert(file, runAt(`run-${i}`, i));
    expect(file.runs).toHaveLength(MAX_RUNS);
    expect(file.runs.map((r) => r.id)).not.toContain("run-0");
    expect(file.runs.map((r) => r.id)).toContain(`run-${MAX_RUNS + 2}`);
  });

  it("removes only the run asked for", () => {
    let file = upsert(emptySaveFile(), runAt("a", 10));
    file = upsert(file, runAt("b", 20));
    expect(remove(file, "a").runs.map((r) => r.id)).toEqual(["b"]);
  });

  it("shrugs off a delete for something that is not there", () => {
    const file = upsert(emptySaveFile(), runAt("a", 10));
    expect(remove(file, "nope").runs).toHaveLength(1);
  });
});
