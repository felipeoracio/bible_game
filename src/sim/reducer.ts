import { restAll, walkAll } from "./systems/household";
import { applyEffectAll } from "./systems/camp";
import { nextEvent } from "./systems/events";
import { recordAnswer } from "./systems/quiz";
import { drink, refill, thirstPenalty, widenCapacity } from "./systems/water";
import type { Action, GameState } from "./types";

/**
 * The whole game, eventually. Pure: same state and action always produce the same
 * result, no side effects, no randomness. Any randomness arrives as a seeded value
 * on the action itself (see `sim/rng.ts`, F6) so that runs stay reproducible.
 */
export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_PACE":
      return state.pace === action.pace ? state : { ...state, pace: action.pace };

    case "TRAVEL": {
      // The column halts while something is happening. Nothing accumulates.
      if (state.activeEventId !== undefined) return state;
      if (action.km <= 0) return state;

      const distanceKm = Math.min(state.distanceKm + action.km, state.legDistanceKm);
      // Only the ground actually covered costs the household anything, so arriving
      // at the camp does not charge them for the step that was clipped.
      const walked = distanceKm - state.distanceKm;
      if (walked <= 0) return state;

      /*
       * Drink first, then walk. The thirst penalty is read from hydration *after*
       * drinking, so a household with water in the skins pays nothing extra and a
       * household without pays for every kilometre of it.
       */
      const drunk = drink(state.water, state.household, walked, state.pace, state.terrain);
      const thirstCost = Object.fromEntries(
        drunk.household.map((member) => [member.id, thirstPenalty(member, walked)]),
      );

      const moved: GameState = {
        ...state,
        distanceKm,
        kmSinceRest: state.kmSinceRest + walked,
        water: drunk.water,
        household: walkAll(drunk.household, walked, state.pace, thirstCost),
      };

      const triggered = nextEvent({
        schedule: moved.schedule,
        progress: legProgress(moved),
        distanceKm: moved.distanceKm,
        fired: moved.fired,
        nextPooledAtKm: moved.nextPooledAtKm,
        seed: moved.seed,
      });
      if (triggered) {
        return {
          ...moved,
          activeEventId: triggered.eventId,
          fired: [...moved.fired, triggered.eventId],
          seed: triggered.seed,
          nextPooledAtKm: triggered.nextPooledAtKm,
          unlockedCodex: unlock(
            moved.unlockedCodex,
            moved.schedule.eventUnlocks[triggered.eventId],
          ),
        };
      }

      /*
       * Arrival. Checked here rather than in the UI so that reaching the camp opens
       * its Codex entry exactly once, however the player got there.
       */
      const justArrived = !isLegComplete(state) && isLegComplete(moved);
      if (justArrived) {
        const { waypoint, unlocks, quizId } = moved.schedule;
        return {
          ...moved,
          arrivedAt: waypoint,
          quizPending: quizId,
          unlockedCodex: unlock(moved.unlockedCodex, [
            ...(waypoint ? [waypoint] : []),
            ...unlocks,
          ]),
        };
      }

      return moved;
    }

    case "MAKE_CAMP":
      return {
        ...state,
        day: state.day + 1,
        nightsCamped: state.nightsCamped + 1,
        kmSinceRest: 0,
        household: restAll(state.household),
      };

    case "DECIDE": {
      // Recording the choice is the point; the effect is optional, because plenty
      // of decisions matter for what they unlock rather than what they cost.
      const household = action.effects
        ? applyEffectAll(state.household, action.effects)
        : state.household;

      // Scripted relief: the spring, the bitter pool made sweet, the rock. This is
      // the only path by which the household ever gains water.
      let water = state.water;
      if (action.provisions?.waterCapacity) {
        water = widenCapacity(water, action.provisions.waterCapacity);
      }
      if (action.provisions?.water) {
        water = refill(water, action.provisions.water);
      }

      return {
        ...state,
        household,
        water,
        decisions: { ...state.decisions, [action.eventId]: action.choiceId },
        /*
         * Deciding deliberately leaves the event open. The player has to be able to
         * read what their choice did before the card goes away; `DISMISS_EVENT` is
         * what closes it, from the "walk on" button.
         */
      };
    }

    case "DISMISS_EVENT":
      return state.activeEventId === undefined
        ? state
        : { ...state, activeEventId: undefined };

    case "DISMISS_WAYPOINT":
      return state.arrivedAt === undefined ? state : { ...state, arrivedAt: undefined };

    case "ANSWER": {
      const quiz = recordAnswer(state.quiz, action.questionId, action.correct);
      return quiz === state.quiz ? state : { ...state, quiz };
    }

    case "FINISH_QUIZ":
      return state.quizPending === undefined ? state : { ...state, quizPending: undefined };

    case "NAME_HOUSEHOLD":
      return { ...state, identities: action.identities, head: action.head };
  }
}

/**
 * Add entries without duplicating, preserving the order they were earned in.
 *
 * Deduplicates within the incoming batch as well as against what is already open —
 * a leg whose `unlocks` repeats its own waypoint is legitimate content, and must
 * not put the entry in the list twice.
 */
function unlock(current: string[], ids: string[] | undefined): string[] {
  if (!ids || ids.length === 0) return current;
  const fresh: string[] = [];
  for (const id of ids) {
    if (!current.includes(id) && !fresh.includes(id)) fresh.push(id);
  }
  return fresh.length === 0 ? current : [...current, ...fresh];
}

/**
 * These take only the fields they read rather than a whole `GameState`, so callers
 * that hold a couple of values — a React component with two selectors — do not have
 * to fabricate a state object, and adding a field to `GameState` cannot break them.
 */
type Progress = Pick<GameState, "distanceKm" | "legDistanceKm">;

/** The household has reached the named camp at the end of this leg. */
export function isLegComplete(state: Progress): boolean {
  return state.distanceKm >= state.legDistanceKm;
}

/** 0 to 1, for progress bars and the map ribbon. */
export function legProgress(state: Progress): number {
  if (state.legDistanceKm <= 0) return 1;
  return Math.min(state.distanceKm / state.legDistanceKm, 1);
}
