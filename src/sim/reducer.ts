import { restAll, walkAll } from "./systems/household";
import { applyEffectAll } from "./systems/camp";
import { nextEvent } from "./systems/events";
import { recordAnswer } from "./systems/quiz";
import { drink, refill, thirstPenalty, widenCapacity } from "./systems/water";
import { dawn, eat, freshManna, gather, layAside } from "./systems/manna";
import { advanceLag } from "./systems/column";
import { settleAll } from "./systems/fracture";
import {
  advance as advanceSetPiece,
  atOutcome,
  begin as beginSetPiece,
  choose as chooseInSetPiece,
  currentPhase,
  effectOf,
  finish as finishSetPiece,
  outcomeOf,
} from "./systems/setpiece";
import { exposure, harm } from "./systems/rephidim";
import { assign as assignJudge } from "./systems/jethro";
import { initialState, type Action, type GameState } from "./types";

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
      // And a set piece is not something you can walk past: the sea is in the way
      // until it is finished with you.
      if (state.setPiece !== undefined && !state.setPiece.finished) return state;
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

      /*
       * Lag is worked out from the household *before* this stretch wore them down,
       * because the ground was covered at the speed they were managing at the time.
       * Charging them for condition they only lost at the far end would double-count
       * the same kilometres.
       */
      const lagKm = advanceLag(state.lagKm, drunk.household, walked, state.pace);

      const moved: GameState = {
        ...state,
        distanceKm,
        lagKm,
        kmSinceRest: state.kmSinceRest + walked,
        water: drunk.water,
        household: settleAll(walkAll(drunk.household, walked, state.pace, thirstCost)),
      };

      /*
       * The set piece outranks everything. If the household has just reached the
       * sea, that is what is happening to them — not a sandal strap, and not a
       * scripted conversation. It fires once and the march is stopped until it is
       * finished; `moved.setPiece` being already set is what makes that once.
       */
      const due = moved.schedule.setPiece;
      if (due && moved.setPiece === undefined && legProgress(moved) >= due.atProgress) {
        return { ...moved, setPiece: beginSetPiece(due.setPieceId) };
      }

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

    case "MAKE_CAMP": {
      const rested = restAll(state.household);

      // Manna is not running yet: camp is exactly what it was before F10.
      if (state.mannaDay <= 0) {
        return {
          ...state,
          day: state.day + 1,
          nightsCamped: state.nightsCamped + 1,
          kmSinceRest: 0,
          household: rested,
        };
      }

      /*
       * The evening meal, then the night, then the morning.
       *
       * Eating happens before dawn resolves so the household is fed from what it
       * gathered today — and so that whatever is deliberately kept back is what
       * the worms find. That ordering is the mechanic: hoarding only costs you
       * because you had the chance to eat it first.
       */
      const meal = eat(state.manna, rested);
      const morning = dawn(meal.manna);

      return {
        ...state,
        day: state.day + 1,
        mannaDay: state.mannaDay + 1,
        nightsCamped: state.nightsCamped + 1,
        kmSinceRest: 0,
        household: meal.household,
        manna: morning.manna,
        mannaSpoiled: morning.spoiled > 0 ? morning.spoiled : undefined,
      };
    }

    /** Leg 8. Scripted, like every other supply the household does not control. */
    case "MANNA_BEGINS":
      return state.mannaDay > 0 ? state : { ...state, mannaDay: 1, manna: freshManna() };

    case "GATHER_MANNA": {
      if (state.mannaDay <= 0) return state;
      const result = gather(state.manna, state.household, state.mannaDay, action.inTime);
      // Going out and finding none is a real outcome the player is allowed to have,
      // so this returns changed state only when the basket actually changed.
      return result.manna === state.manna ? state : { ...state, manna: result.manna };
    }

    case "LAY_ASIDE_MANNA": {
      if (state.mannaDay <= 0) return state;
      const manna = layAside(state.manna, state.mannaDay, action.omers);
      return manna === state.manna ? state : { ...state, manna };
    }

    // --- Set pieces ---------------------------------------------------------
    /*
     * The march stops dead for these. `TRAVEL` already refuses to move while an
     * event is open; a set piece is the same idea with the volume turned up, and
     * the scene has no way to walk past one.
     */
    case "BEGIN_SET_PIECE":
      return state.setPiece ? state : { ...state, setPiece: beginSetPiece(action.piece.id) };

    case "SET_PIECE_CHOOSE": {
      if (!state.setPiece) return state;
      const phase = currentPhase(action.piece, state.setPiece);
      if (!phase) return state;

      const setPiece = chooseInSetPiece(action.piece, state.setPiece, action.choiceId);
      if (setPiece === state.setPiece) return state;

      // What the player chose moves their household, and only their household.
      const effect = effectOf(action.piece, phase.id, action.choiceId);
      const household = effect
        ? settleAll(applyEffectAll(state.household, effect))
        : state.household;

      return { ...state, setPiece, household };
    }

    case "SET_PIECE_ADVANCE": {
      if (!state.setPiece) return state;
      const setPiece = advanceSetPiece(action.piece, state.setPiece);
      return setPiece === state.setPiece ? state : { ...state, setPiece };
    }

    case "FINISH_SET_PIECE": {
      if (!state.setPiece || state.setPiece.finished) return state;
      if (!atOutcome(action.piece, state.setPiece)) return state;

      /*
       * The recorded outcome. Read straight off the content — there is deliberately
       * no path from `state.setPiece.taken` to anything below, because what happened
       * at the sea is not a function of what this household decided to do about it.
       */
      const outcome = outcomeOf(action.piece);

      let household = outcome.effects
        ? applyEffectAll(state.household, outcome.effects)
        : state.household;

      // Deuteronomy 25:18: what Amalek costs you depends on where you were standing,
      // which was settled over the preceding legs rather than in this moment.
      if (action.piece.mechanic === "amalek-at-the-rear") {
        household = applyEffectAll(household, harm(exposure(state.lagKm, household)));
      }
      household = settleAll(household);

      // Scripted relief, on the same footing as every other: the outcome hands it
      // over, and no choice can.
      let water = state.water;
      if (outcome.provisions?.waterCapacity) {
        water = widenCapacity(water, outcome.provisions.waterCapacity);
      }
      if (outcome.provisions?.water) water = refill(water, outcome.provisions.water);

      // Exodus 18:25 — the household is placed under a ruler of ten, who persists.
      let judgeId = state.judgeId;
      let seed = state.seed;
      if (action.piece.mechanic === "appointed-to-a-judge" && judgeId === undefined) {
        const placed = assignJudge(action.judgeIds ?? [], seed);
        if (placed) {
          judgeId = placed.judgeId;
          seed = placed.seed;
        }
      }

      return {
        ...state,
        household,
        water,
        judgeId,
        seed,
        setPiece: finishSetPiece(state.setPiece),
        unlockedCodex: unlock(state.unlockedCodex, [...(action.piece.unlocks ?? [])]),
      };
    }

    /**
     * Set out on the next stage.
     *
     * The whole feature is in what this does *not* reset. A leg is a fresh road,
     * not a fresh start: the household walks onto it in exactly the condition it
     * walked off the last one, still carrying the same water, still as far behind
     * the column as it had fallen, still estranged from whoever had stopped
     * following. That accumulation is the game — the reason pushing hard on leg 3
     * is felt at Rephidim on leg 11.
     *
     * `fired` is kept for the same reason: an event that has happened to this
     * household has happened, and should not happen again later in the run.
     */
    case "BEGIN_LEG": {
      const { leg } = action;
      if (leg.id === state.legId) return state;
      const blank = initialState(leg, []);
      return {
        ...state,
        legId: leg.id,
        legDistanceKm: leg.distanceKm,
        terrain: leg.terrain,
        distanceKm: 0,
        kmSinceRest: 0,
        schedule: blank.schedule,
        nextPooledAtKm: state.distanceKm + blank.nextPooledAtKm,
        // Cleared because they belong to the leg just finished, not the next one.
        arrivedAt: undefined,
        quizPending: undefined,
        activeEventId: undefined,
        setPiece: undefined,
      };
    }

    case "DECIDE": {
      // Recording the choice is the point; the effect is optional, because plenty
      // of decisions matter for what they unlock rather than what they cost.
      const household = action.effects
        ? settleAll(applyEffectAll(state.household, action.effects))
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
