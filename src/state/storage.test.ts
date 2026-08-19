import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_VERSION, type SavedRun } from "@/sim/save";
import {
  BACKUP_KEY,
  deleteRun,
  isAvailable,
  newRunId,
  putRun,
  readRuns,
  readSaveFile,
  SAVE_KEY,
  writeSaveFile,
} from "./storage";

/** Enough of the Storage interface to exercise the adapter, plus a way to break it. */
class FakeStorage {
  private data = new Map<string, string>();
  failWrites = false;

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new DOMException("QuotaExceededError");
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

let storage: FakeStorage;

const run = (id: string, name: string): SavedRun => ({
  id,
  name,
  updatedAt: Date.now(),
  legId: "leg-01",
  state: {} as SavedRun["state"],
});

beforeEach(() => {
  storage = new FakeStorage();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("without a browser", () => {
  /** These pages are prerendered at build time, where there is no localStorage. */
  it("reports nothing rather than throwing during a server render", () => {
    vi.stubGlobal("window", undefined);
    expect(() => readSaveFile()).not.toThrow();
    expect(readRuns()).toEqual([]);
    expect(writeSaveFile({ version: CURRENT_VERSION, runs: [] })).toBe(false);
    expect(isAvailable()).toBe(false);
  });
});

describe("when storage refuses to co-operate", () => {
  /** Private browsing and a full quota both make localStorage throw on write. */
  it("says saving is unavailable instead of crashing", () => {
    storage.failWrites = true;
    expect(isAvailable()).toBe(false);
    expect(writeSaveFile({ version: CURRENT_VERSION, runs: [] })).toBe(false);
    expect(putRun(run("a", "Eliab"))).toBe(false);
  });

  it("lets the player carry on playing", () => {
    storage.failWrites = true;
    expect(() => putRun(run("a", "Eliab"))).not.toThrow();
    expect(readRuns()).toEqual([]);
  });
});

describe("ordinary use", () => {
  it("writes a run and reads it back", () => {
    expect(putRun(run("a", "Eliab"))).toBe(true);
    expect(readRuns().map((r) => r.name)).toEqual(["Eliab"]);
  });

  it("keeps separate households in separate slots", () => {
    putRun(run("a", "Eliab"));
    putRun(run("b", "Jochebed"));
    expect(readRuns()).toHaveLength(2);
  });

  it("updates a run in place rather than adding a copy", () => {
    putRun(run("a", "Eliab"));
    putRun({ ...run("a", "Eliab"), state: { day: 4 } as SavedRun["state"] });
    expect(readRuns()).toHaveLength(1);
  });

  it("deletes only the run asked for", () => {
    putRun(run("a", "Eliab"));
    putRun(run("b", "Jochebed"));
    deleteRun("a");
    expect(readRuns().map((r) => r.name)).toEqual(["Jochebed"]);
  });

  it("hands out ids that do not collide", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newRunId()));
    expect(ids.size).toBe(200);
  });
});

/**
 * The Continue screen tells a player with a newer save to update, and their
 * journeys will open. Overwriting that file the moment they start a new game would
 * make that a lie, so it is moved aside instead of destroyed.
 */
describe("a file this build cannot read", () => {
  const NEWER = JSON.stringify({
    version: CURRENT_VERSION + 1,
    runs: [{ id: "precious", legId: "leg-01", name: "From a newer build", state: {} }],
  });

  it("is kept, not thrown away, when a new run is saved over it", () => {
    storage.setItem(SAVE_KEY, NEWER);
    putRun(run("a", "Eliab"));

    expect(storage.getItem(BACKUP_KEY)).toBe(NEWER);
    expect(readRuns().map((r) => r.name)).toEqual(["Eliab"]);
  });

  it("keeps corrupted contents too, in case they can be salvaged by hand", () => {
    storage.setItem(SAVE_KEY, "{{{ not json");
    putRun(run("a", "Eliab"));
    expect(storage.getItem(BACKUP_KEY)).toBe("{{{ not json");
  });

  /** The first backup is the one most likely to be the real save. */
  it("does not let a later failure overwrite the first backup", () => {
    storage.setItem(SAVE_KEY, NEWER);
    putRun(run("a", "Eliab"));

    storage.setItem(SAVE_KEY, "{{{ later rubbish");
    putRun(run("b", "Jochebed"));

    expect(storage.getItem(BACKUP_KEY)).toBe(NEWER);
  });

  it("does not back up an empty slot", () => {
    putRun(run("a", "Eliab"));
    expect(storage.getItem(BACKUP_KEY)).toBeNull();
  });

  it("reports why it could not be read", () => {
    storage.setItem(SAVE_KEY, NEWER);
    expect(readSaveFile()).toEqual({ ok: false, reason: "from-a-newer-version" });

    storage.setItem(SAVE_KEY, "{{{");
    expect(readSaveFile()).toEqual({ ok: false, reason: "unreadable" });
  });
});
