import { create } from "zustand";
import { episode1 } from "@/content/episode1";
import { reduce } from "@/sim/reducer";
import { initialState, type Action, type GameState } from "@/sim/types";

/**
 * The single bridge between the pure simulation and the two things that draw it:
 * Phaser (the travel scene) and React (every other screen).
 *
 * Phaser lives outside React's render cycle, so it reads with `useGame.getState()`
 * and writes with `useGame.getState().dispatch(...)`. React components use the hook
 * with a selector. Neither one owns the rules — `sim/reducer.ts` does.
 */

/**
 * The journey starts at the first leg of the itinerary. Multi-leg progression and
 * saved games arrive later; for now the game always opens on Rameses to Succoth.
 */
const openingLeg = episode1.legs[0];
if (!openingLeg) throw new Error("Episode 1 has no legs — content failed to load.");

/**
 * Flatten the leg plus its events into the shape the simulation needs.
 *
 * The reducer decides what unlocks, so it needs the event-to-entry map up front —
 * this is the one place content is translated into simulation input, which keeps
 * `src/sim` free of any import from a particular episode.
 */
const startingLeg = {
  ...openingLeg,
  eventUnlocks: Object.fromEntries(
    Object.values(episode1.events)
      .filter((event) => event.unlocks && event.unlocks.length > 0)
      .map((event) => [event.id, event.unlocks!]),
  ),
};

interface GameStore {
  state: GameState;
  dispatch: (action: Action) => void;
  reset: () => void;
}

export const useGame = create<GameStore>((set) => ({
  state: initialState(startingLeg, episode1.household),
  dispatch: (action) => set((store) => ({ state: reduce(store.state, action) })),
  reset: () => set({ state: initialState(startingLeg, episode1.household) }),
}));

/** For Phaser and anything else outside a React render. */
export const gameStore = {
  get: () => useGame.getState().state,
  dispatch: (action: Action) => useGame.getState().dispatch(action),
  subscribe: (listener: (state: GameState) => void) =>
    useGame.subscribe((store) => listener(store.state)),
};
