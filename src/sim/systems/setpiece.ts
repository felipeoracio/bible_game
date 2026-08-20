import type { HouseholdEffect, Provisions, SetPieceMechanic } from "@/content/types";

/**
 * Running a set piece (§5.7).
 *
 * Four moments, four different verbs — the crossing, Marah, Rephidim, Jethro — and
 * one machine underneath them, because the thing they have in common is the thing
 * the whole game rests on: **the player acts, and Scripture's outcome happens
 * anyway.**
 *
 * This module knows nothing about which set piece is running. It sequences phases,
 * records what the player chose, and then hands back the recorded outcome. What it
 * will not do, at any point, is let a choice reach the outcome. There is no branch
 * here from `taken` to what gets returned by `outcomeOf` — the outcome is read
 * straight off the content, and a test asserts that walking every possible path
 * through a set piece produces exactly the same one.
 *
 * The shape of the content (`content/types.ts`) makes the same guarantee
 * structurally: a choice has no `provisions` field to give, so the water at Marah
 * cannot be authored as a prize for choosing well.
 */

/** Just enough of a `SetPiece` to run one, so `src/sim` stays free of the content. */
export interface RunnablePhase {
  id: string;
  choices: readonly { id: string; effects?: HouseholdEffect }[];
  futile?: boolean;
}

export interface RunnableSetPiece {
  id: string;
  /** Named rule the reducer runs for this piece, if it needs one beyond its phases. */
  mechanic?: SetPieceMechanic;
  phases: readonly RunnablePhase[];
  outcome: { provisions?: Provisions; effects?: HouseholdEffect };
  /** Codex entries the recorded outcome opens. */
  unlocks?: readonly string[];
}

export interface SetPieceState {
  id: string;
  /** Which phase is on screen. Equals `phases.length` once they are all done. */
  phaseIndex: number;
  /** Choice taken, by phase id. */
  taken: Record<string, string>;
  /** True once the recorded outcome has been read and applied. */
  finished: boolean;
}

export const begin = (id: string): SetPieceState => ({
  id,
  phaseIndex: 0,
  taken: {},
  finished: false,
});

export function currentPhase(
  piece: RunnableSetPiece,
  state: SetPieceState,
): RunnablePhase | undefined {
  return piece.phases[state.phaseIndex];
}

/** True once every phase has been played and only the outcome is left to read. */
export function atOutcome(piece: RunnableSetPiece, state: SetPieceState): boolean {
  return state.phaseIndex >= piece.phases.length;
}

/**
 * Take a choice in the current phase.
 *
 * Does not advance — the player has to be able to read what their household did
 * before the screen moves, the same rule the road events and camp learned the hard
 * way in F5 and F6.
 */
export function choose(
  piece: RunnableSetPiece,
  state: SetPieceState,
  choiceId: string,
): SetPieceState {
  const phase = currentPhase(piece, state);
  if (!phase) return state;
  if (state.taken[phase.id] !== undefined) return state;
  if (!phase.choices.some((choice) => choice.id === choiceId)) return state;
  return { ...state, taken: { ...state.taken, [phase.id]: choiceId } };
}

/** Move on. Only possible once this phase has been answered. */
export function advance(piece: RunnableSetPiece, state: SetPieceState): SetPieceState {
  const phase = currentPhase(piece, state);
  if (!phase) return state;
  // A phase with no choices is pure narration and can always be walked past.
  if (phase.choices.length > 0 && state.taken[phase.id] === undefined) return state;
  return { ...state, phaseIndex: state.phaseIndex + 1 };
}

/**
 * What Scripture records happening.
 *
 * Takes the state only to insist, in the signature, that it does not consult it.
 * The outcome of a set piece is a property of the set piece.
 */
export function outcomeOf(piece: RunnableSetPiece): RunnableSetPiece["outcome"] {
  return piece.outcome;
}

export function finish(state: SetPieceState): SetPieceState {
  return state.finished ? state : { ...state, finished: true };
}

/** The effect a choice carries, for the reducer to apply to the household. */
export function effectOf(
  piece: RunnableSetPiece,
  phaseId: string,
  choiceId: string,
): HouseholdEffect | undefined {
  const phase = piece.phases.find((candidate) => candidate.id === phaseId);
  return phase?.choices.find((choice) => choice.id === choiceId)?.effects;
}

/**
 * Whether the situation the player is in can be changed by them at all.
 *
 * Used by the interface to stop promising more than the phase can deliver — a
 * futile phase does not say "solve this", it says "this is happening to you".
 */
export function isFutile(piece: RunnableSetPiece, state: SetPieceState): boolean {
  return currentPhase(piece, state)?.futile === true;
}
