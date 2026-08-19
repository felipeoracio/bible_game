import { AXIS_MAX, type MemberState } from "./systems/household";
import type { GameState, MemberIdentity } from "./types";

/**
 * Saving and loading (§5.6). Pure — no localStorage, no browser, no content
 * imports. `state/storage.ts` is the part that talks to the disk.
 *
 * The governing assumption: **a save file is untrusted input.** It lives in
 * localStorage, where any curious ten-year-old with dev tools can edit it, and it
 * may have been written by an older build of the game. So nothing here trusts a
 * field it has not checked. `restore` works by laying validated values over a
 * freshly-initialised state, which means a truncated, corrupted, or hand-edited
 * save degrades into a playable game rather than a crash or a household with NaN
 * for its condition.
 *
 * Three things are deliberately *not* saved, and are rebuilt from content instead:
 * the leg's schedule, its distance, and its terrain. Those belong to the episode,
 * not to the player, so a save made before a content fix picks the fix up.
 */

export const CURRENT_VERSION = 1;

/** More than a family needs, few enough that the list stays readable. */
export const MAX_RUNS = 6;

/** Everything about a run that belongs to the player rather than to the content. */
export type PersistedState = Omit<GameState, "schedule" | "legDistanceKm" | "terrain">;

export interface SavedRun {
  id: string;
  /** The head's name. What the player actually recognises the slot by. */
  name: string;
  /** Millis since the epoch, for ordering the list. */
  updatedAt: number;
  legId: string;
  state: PersistedState;
}

export interface SaveFile {
  version: number;
  runs: SavedRun[];
}

export const emptySaveFile = (): SaveFile => ({ version: CURRENT_VERSION, runs: [] });

// --- Validators --------------------------------------------------------------
// Small and boring on purpose. Every one of them takes something unknown and
// returns something the simulation can hold without checking again.

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A finite number inside its bounds, or the fallback. Catches NaN and Infinity. */
function num(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/** An optional string field: present and a string, or absent. Never null. */
function maybeStr(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

// --- Writing -----------------------------------------------------------------

/**
 * Take everything worth keeping out of a live game state.
 *
 * The three content-derived fields are dropped here rather than merely ignored on
 * load, so a save file cannot carry a stale leg distance around at all.
 */
export function toPersisted(state: GameState): PersistedState {
  const { schedule: _schedule, legDistanceKm: _d, terrain: _t, ...rest } = state;
  return rest;
}

export function toSavedRun(
  state: GameState,
  meta: { id: string; name: string; at: number },
): SavedRun {
  return {
    id: meta.id,
    name: meta.name,
    updatedAt: meta.at,
    legId: state.legId,
    state: toPersisted(state),
  };
}

// --- Reading -----------------------------------------------------------------

function restoreMember(saved: unknown, fresh: MemberState): MemberState {
  if (!isRecord(saved)) return fresh;
  return {
    // Identity comes from the roster, never from the file — a save cannot invent
    // a person or change what role somebody plays in the household.
    id: fresh.id,
    role: fresh.role,
    condition: num(saved.condition, fresh.condition, 0, AXIS_MAX),
    morale: num(saved.morale, fresh.morale, 0, AXIS_MAX),
    trust: num(saved.trust, fresh.trust, 0, AXIS_MAX),
    water: num(saved.water, fresh.water, 0, AXIS_MAX),
    following: bool(saved.following, fresh.following),
  };
}

/**
 * Rebuild the household by matching the roster, not the file.
 *
 * If the cast has changed since the save was written, anyone new arrives fresh and
 * anyone removed is dropped. A save can never produce a household with a person in
 * it that the episode does not have.
 */
function restoreHousehold(saved: unknown, fresh: MemberState[]): MemberState[] {
  const byId = new Map<string, unknown>();
  if (Array.isArray(saved)) {
    for (const entry of saved) {
      if (isRecord(entry) && typeof entry.id === "string") byId.set(entry.id, entry);
    }
  }
  return fresh.map((member) => restoreMember(byId.get(member.id), member));
}

function restoreIdentities(
  saved: unknown,
  fresh: Record<string, MemberIdentity>,
): Record<string, MemberIdentity> {
  if (!isRecord(saved)) return fresh;
  const out: Record<string, MemberIdentity> = {};
  for (const [id, base] of Object.entries(fresh)) {
    const entry = saved[id];
    out[id] = isRecord(entry)
      ? { name: str(entry.name, base.name), look: num(entry.look, base.look, 0, 32) }
      : base;
  }
  return out;
}

/** Whole attempt counts of at least one, or the entry is dropped. */
function restoreAttempts(saved: unknown): Record<string, number> {
  if (!isRecord(saved)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(saved)) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 1) {
      out[key] = Math.floor(value);
    }
  }
  return out;
}

function restoreDecisions(saved: unknown): Record<string, string> {
  if (!isRecord(saved)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(saved)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/**
 * Lay a saved run over a freshly-initialised state.
 *
 * `base` is what the game would look like starting this leg from scratch, built by
 * the caller from the current content. Anything the file does not supply, or
 * supplies badly, simply stays as it is in `base`.
 */
export function restore(run: SavedRun, base: GameState): GameState {
  const saved: Record<string, unknown> = isRecord(run.state) ? run.state : {};

  const household = restoreHousehold(saved.household, base.household);
  const water = isRecord(saved.water) ? saved.water : {};
  const manna = isRecord(saved.manna) ? saved.manna : {};
  const quiz = isRecord(saved.quiz) ? saved.quiz : {};

  return {
    ...base,
    day: num(saved.day, base.day, 1),
    pace:
      saved.pace === "steady" || saved.pace === "quick" || saved.pace === "driving"
        ? saved.pace
        : base.pace,
    // Distance is clamped to the leg as content defines it *now*, so a save made
    // when the leg was longer cannot strand the player past its own finish line.
    distanceKm: num(saved.distanceKm, base.distanceKm, 0, base.legDistanceKm),
    household,
    kmSinceRest: num(saved.kmSinceRest, base.kmSinceRest, 0),
    lagKm: num(saved.lagKm, base.lagKm, 0),
    water: {
      capacity: num(water.capacity, base.water.capacity, 0),
      litres: num(water.litres, base.water.litres, 0, num(water.capacity, base.water.capacity, 0)),
    },
    mannaDay: num(saved.mannaDay, base.mannaDay, 0),
    manna: {
      fresh: num(manna.fresh, base.manna.fresh, 0),
      laidAside: num(manna.laidAside, base.manna.laidAside, 0),
      laidAsideOn: num(manna.laidAsideOn, base.manna.laidAsideOn, 0, 7),
      gatheredToday: bool(manna.gatheredToday, base.manna.gatheredToday),
    },
    mannaSpoiled:
      typeof saved.mannaSpoiled === "number" && Number.isFinite(saved.mannaSpoiled)
        ? Math.max(0, saved.mannaSpoiled)
        : undefined,
    identities: restoreIdentities(saved.identities, base.identities),
    head: isRecord(saved.head)
      ? { age: num(saved.head.age, base.head.age, 1, 120), trade: str(saved.head.trade, base.head.trade) }
      : base.head,
    decisions: restoreDecisions(saved.decisions),
    nightsCamped: num(saved.nightsCamped, base.nightsCamped, 0),
    fired: strings(saved.fired),
    nextPooledAtKm: num(saved.nextPooledAtKm, base.nextPooledAtKm, 0),
    seed: num(saved.seed, base.seed),
    activeEventId: maybeStr(saved.activeEventId),
    unlockedCodex: strings(saved.unlockedCodex),
    arrivedAt: maybeStr(saved.arrivedAt),
    quiz: {
      // Attempt counts drive the first-try accuracy the Codex reports, so a
      // hand-edited file must not be able to award a perfect record with a string.
      attempts: restoreAttempts(quiz.attempts),
      correct: strings(quiz.correct),
    },
    quizPending: maybeStr(saved.quizPending),
  };
}

// --- The file itself ---------------------------------------------------------

function parseRun(value: unknown): SavedRun | null {
  if (!isRecord(value)) return null;
  const id = maybeStr(value.id);
  const legId = maybeStr(value.legId);
  // Without an id there is no slot to write back to, and without a leg there is
  // nothing to rebuild the run against. Everything else has a sane default.
  if (!id || !legId) return null;
  return {
    id,
    legId,
    name: str(value.name, "Unnamed household"),
    updatedAt: num(value.updatedAt, 0, 0),
    state: (isRecord(value.state) ? value.state : {}) as PersistedState,
  };
}

export type ParseResult =
  | { ok: true; file: SaveFile }
  | { ok: false; reason: "empty" | "unreadable" | "from-a-newer-version" };

/**
 * Read whatever was on disk.
 *
 * A save from a *newer* build is refused rather than guessed at — silently
 * misreading a file the player might still open in a newer tab is worse than
 * telling them this build cannot read it. Older versions migrate.
 */
export function parseSaveFile(raw: unknown): ParseResult {
  if (raw === null || raw === undefined || raw === "") return { ok: false, reason: "empty" };

  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return { ok: false, reason: "unreadable" };
    }
  }

  if (!isRecord(value)) return { ok: false, reason: "unreadable" };

  const version = num(value.version, 0, 0);
  if (version > CURRENT_VERSION) return { ok: false, reason: "from-a-newer-version" };

  const runs = Array.isArray(value.runs)
    ? value.runs.map(parseRun).filter((run): run is SavedRun => run !== null)
    : [];

  return { ok: true, file: migrate({ version, runs }) };
}

/**
 * Bring an older file up to the current schema.
 *
 * Only version 1 has ever shipped, so this is currently an identity function with
 * a version stamp — but the hook and its test exist now, because the first time a
 * schema changes is exactly when nobody wants to be inventing a migration path.
 */
export function migrate(file: SaveFile): SaveFile {
  return { ...file, version: CURRENT_VERSION };
}

/** Newest first — how the slot list is read. */
export function byMostRecent(runs: readonly SavedRun[]): SavedRun[] {
  return [...runs].sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Put a run into the file, replacing any earlier save of the same run.
 *
 * Trims the oldest once the list is full, so a family that keeps starting new
 * journeys never fills the browser's storage quota.
 */
export function upsert(file: SaveFile, run: SavedRun): SaveFile {
  const others = file.runs.filter((candidate) => candidate.id !== run.id);
  return { version: CURRENT_VERSION, runs: byMostRecent([run, ...others]).slice(0, MAX_RUNS) };
}

export function remove(file: SaveFile, id: string): SaveFile {
  return { version: CURRENT_VERSION, runs: file.runs.filter((run) => run.id !== id) };
}
