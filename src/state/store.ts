import { create } from "zustand";
import { episode1 } from "@/content/episode1";
import { reduce } from "@/sim/reducer";
import { byMostRecent, restore, toSavedRun, type SavedRun } from "@/sim/save";
import { initialState, type Action, type GameState } from "@/sim/types";
import { deleteRun as removeRun, newRunId, putRun, readRuns } from "./storage";

/**
 * The single bridge between the pure simulation and the two things that draw it:
 * Phaser (the travel scene) and React (every other screen).
 *
 * Phaser lives outside React's render cycle, so it reads with `useGame.getState()`
 * and writes with `useGame.getState().dispatch(...)`. React components use the hook
 * with a selector. Neither one owns the rules — `sim/reducer.ts` does.
 */

const openingLeg = episode1.legs[0];
if (!openingLeg) throw new Error("Episode 1 has no legs — content failed to load.");

/**
 * Flatten a leg plus its events into the shape the simulation needs.
 *
 * The reducer decides what unlocks, so it needs the event-to-entry map up front —
 * this is the one place content is translated into simulation input, which keeps
 * `src/sim` free of any import from a particular episode.
 */
function legInput(leg: (typeof episode1.legs)[number]) {
  return {
    ...leg,
    eventUnlocks: Object.fromEntries(
      Object.values(episode1.events)
        .filter((event) => event.unlocks && event.unlocks.length > 0)
        .map((event) => [event.id, event.unlocks!]),
    ),
  };
}

const freshState = (legId = openingLeg.id): GameState => {
  const leg = episode1.legs.find((candidate) => candidate.id === legId) ?? openingLeg;
  return initialState(legInput(leg), episode1.household);
};

/** The head's name, which is what a player recognises a saved run by. */
function nameOf(state: GameState): string {
  const head = episode1.household.find((member) => member.role === "head");
  const id = head?.id;
  return (id ? state.identities[id]?.name : undefined) ?? head?.name ?? "A household";
}

/**
 * How often the game writes to disk while the player is marching.
 *
 * `TRAVEL` fires on every animation frame, so saving on each one would serialise
 * the whole run sixty times a second. Two seconds is frequent enough that a
 * closed tab costs a few paces and no more.
 */
const AUTOSAVE_MS = 2000;

interface GameStore {
  state: GameState;
  /** Which saved slot this run writes to. Null until the household is named. */
  runId: string | null;
  /** False when the browser refuses to store anything — private mode, full quota. */
  canSave: boolean;
  dispatch: (action: Action) => void;
  reset: () => void;
  /** Begin a run in a fresh slot. Called when the player finishes creating a household. */
  beginRun: () => void;
  /** Put a saved run back into play. Returns false if it no longer fits the content. */
  loadRun: (run: SavedRun) => boolean;
  /**
   * Pick the run back up after a reload.
   *
   * The store lives in memory, so refreshing the page would otherwise drop the
   * player back at the start of the leg with a stranger's family. Only ever acts
   * when no run is active, so it cannot stamp on a game already in progress.
   */
  rehydrate: () => boolean;
  saveNow: () => void;
  listRuns: () => SavedRun[];
  deleteRun: (id: string) => void;
}

export const useGame = create<GameStore>((set, get) => {
  let lastSavedAt = 0;
  let pending: ReturnType<typeof setTimeout> | undefined;

  const write = () => {
    const { state, runId } = get();
    if (!runId) return;
    lastSavedAt = Date.now();
    const ok = putRun(toSavedRun(state, { id: runId, name: nameOf(state), at: lastSavedAt }));
    if (!ok) set({ canSave: false });
  };

  /** Write at most once per interval, and never drop the final one. */
  const autosave = () => {
    if (!get().runId) return;
    const since = Date.now() - lastSavedAt;
    if (since >= AUTOSAVE_MS) {
      if (pending) {
        clearTimeout(pending);
        pending = undefined;
      }
      write();
      return;
    }
    if (pending) return;
    pending = setTimeout(() => {
      pending = undefined;
      write();
    }, AUTOSAVE_MS - since);
  };

  return {
    state: freshState(),
    runId: null,
    canSave: true,

    dispatch: (action) => {
      set((store) => ({ state: reduce(store.state, action) }));
      autosave();
    },

    reset: () => set({ state: freshState(), runId: null }),

    beginRun: () => {
      set({ runId: newRunId() });
      write();
    },

    loadRun: (run) => {
      const leg = episode1.legs.find((candidate) => candidate.id === run.legId);
      // A run whose leg no longer exists cannot be rebuilt. Better to say so than
      // to silently drop the player somewhere they were not.
      if (!leg) return false;
      set({ state: restore(run, freshState(run.legId)), runId: run.id });
      return true;
    },

    rehydrate: () => {
      if (get().runId) return true;
      const [mostRecent] = byMostRecent(readRuns());
      return mostRecent ? get().loadRun(mostRecent) : false;
    },

    saveNow: write,
    listRuns: () => readRuns(),
    deleteRun: (id) => {
      removeRun(id);
      if (get().runId === id) set({ runId: null });
    },
  };
});

/** For Phaser and anything else outside a React render. */
export const gameStore = {
  get: () => useGame.getState().state,
  dispatch: (action: Action) => useGame.getState().dispatch(action),
  subscribe: (listener: (state: GameState) => void) =>
    useGame.subscribe((store) => listener(store.state)),
};
