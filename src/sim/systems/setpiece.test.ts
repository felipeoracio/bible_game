import { describe, expect, it } from "vitest";
import {
  advance,
  atOutcome,
  begin,
  choose,
  currentPhase,
  effectOf,
  finish,
  isFutile,
  outcomeOf,
  type RunnableSetPiece,
  type SetPieceState,
} from "./setpiece";

/** A stand-in for Marah: two phases, both futile, relief only on the outcome. */
const piece: RunnableSetPiece = {
  id: "marah",
  phases: [
    {
      id: "the-third-day",
      choices: [
        { id: "press-on", effects: { condition: -4 } },
        { id: "rest-them", effects: { morale: 3 } },
      ],
      futile: true,
    },
    {
      id: "the-bitter-pool",
      choices: [
        { id: "drink-anyway", effects: { condition: -6 } },
        { id: "refuse-it", effects: { morale: -5 } },
        { id: "wait", effects: { trust: 2 } },
      ],
      futile: true,
    },
  ],
  outcome: { provisions: { water: 999 }, effects: { morale: 8 } },
};

const play = (choices: string[]): SetPieceState => {
  let state = begin(piece.id);
  for (const choiceId of choices) {
    state = choose(piece, state, choiceId);
    state = advance(piece, state);
  }
  return state;
};

describe("running a set piece", () => {
  it("starts on the first phase with nothing chosen", () => {
    const state = begin(piece.id);
    expect(state.phaseIndex).toBe(0);
    expect(currentPhase(piece, state)?.id).toBe("the-third-day");
    expect(state.finished).toBe(false);
  });

  it("records the choice without moving on", () => {
    const state = choose(piece, begin(piece.id), "press-on");
    expect(state.taken["the-third-day"]).toBe("press-on");
    // The player has to be able to read what their household did first.
    expect(state.phaseIndex).toBe(0);
  });

  it("will not move on until the phase has been answered", () => {
    const state = begin(piece.id);
    expect(advance(piece, state)).toBe(state);
  });

  it("refuses a second answer to the same phase", () => {
    const once = choose(piece, begin(piece.id), "press-on");
    const twice = choose(piece, once, "rest-them");
    expect(twice.taken["the-third-day"]).toBe("press-on");
  });

  it("ignores a choice that is not on this phase", () => {
    const state = begin(piece.id);
    expect(choose(piece, state, "drink-anyway")).toBe(state);
  });

  it("reaches the outcome once every phase is played", () => {
    const state = play(["press-on", "wait"]);
    expect(atOutcome(piece, state)).toBe(true);
    expect(currentPhase(piece, state)).toBeUndefined();
  });

  it("walks past a phase that has nothing to choose", () => {
    const narration: RunnableSetPiece = {
      id: "n",
      phases: [{ id: "only", choices: [] }],
      outcome: {},
    };
    const state = advance(narration, begin("n"));
    expect(atOutcome(narration, state)).toBe(true);
  });

  it("finishes once, and stays finished", () => {
    const done = finish(play(["press-on", "wait"]));
    expect(done.finished).toBe(true);
    expect(finish(done)).toBe(done);
  });

  it("hands the reducer the effect the player actually chose", () => {
    expect(effectOf(piece, "the-bitter-pool", "drink-anyway")).toEqual({ condition: -6 });
    expect(effectOf(piece, "the-bitter-pool", "nope")).toBeUndefined();
    expect(effectOf(piece, "nowhere", "drink-anyway")).toBeUndefined();
  });
});

/**
 * The bet the entire game rests on: the player has real agency inside an event
 * Scripture has already settled. These are the tests that keep it honest.
 */
describe("what the player cannot change", () => {
  /** Every route through Marah — six of them — ends at the same water. */
  it("gives the same recorded outcome down every possible path", () => {
    const first = piece.phases[0]!.choices.map((c) => c.id);
    const second = piece.phases[1]!.choices.map((c) => c.id);

    const outcomes = new Set<string>();
    let paths = 0;
    for (const a of first) {
      for (const b of second) {
        const state = play([a, b]);
        expect(atOutcome(piece, state)).toBe(true);
        outcomes.add(JSON.stringify(outcomeOf(piece)));
        paths++;
      }
    }

    expect(paths).toBe(6);
    expect(outcomes.size).toBe(1);
  });

  it("gives the same outcome even to a player who chose nothing at all", () => {
    expect(outcomeOf(piece)).toEqual(outcomeOf(piece));
    const skipped = begin(piece.id);
    expect(outcomeOf(piece)).toEqual({ provisions: { water: 999 }, effects: { morale: 8 } });
    expect(skipped.taken).toEqual({});
  });

  /**
   * Marah's water is bitter whatever the household tries, and the interface needs
   * to know that so it stops inviting them to solve it.
   */
  it("says plainly when nothing the player does can change the situation", () => {
    expect(isFutile(piece, begin(piece.id))).toBe(true);
    expect(isFutile(piece, play(["press-on", "wait"]))).toBe(false);
  });
});
