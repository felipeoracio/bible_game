/**
 * The simulation's vocabulary.
 *
 * Nothing in `src/sim` may import Phaser or React. This module is the reason the
 * engine can be reused for Episode 2 without touching the rendering layers, and
 * the reason the rules are testable without a browser.
 *
 * The content model — tiers, scripture refs, legs — lives in `src/content/types.ts`.
 * This file is the runtime state that the simulation moves through.
 */

import type { CastMember, HouseholdEffect, Provisions, Terrain } from "@/content/types";
import type { RunnableSetPiece } from "./systems/setpiece";
import { freshMember, type MemberState } from "./systems/household";
import { emptySchedule, firstPooledAtKm, type LegSchedule } from "./systems/events";
import { emptyQuizProgress, type QuizProgress } from "./systems/quiz";
import { freshWater, type WaterStore } from "./systems/water";
import { freshManna, type MannaStore } from "./systems/manna";
import type { SetPieceState } from "./systems/setpiece";

export type Pace = "steady" | "quick" | "driving";

export const PACES: readonly Pace[] = ["steady", "quick", "driving"] as const;

/** Kilometres covered per in-game hour at each pace. */
export const PACE_SPEED_KMH: Record<Pace, number> = {
  steady: 3,
  quick: 4.5,
  driving: 6,
};

export interface GameState {
  /** Days elapsed since the departure from Rameses. Starts at 1. */
  day: number;
  /** The pace the household is keeping. */
  pace: Pace;
  /** Kilometres travelled within the current leg. */
  distanceKm: number;
  /** Length of the current leg. Reasoned, not recorded — see the content model. */
  legDistanceKm: number;
  /** Which leg of the itinerary the household is on. */
  legId: string;
  /** Ground being crossed. Sets movement cost and which scenery is drawn. */
  terrain: Terrain;
  /** The household, in marching order. */
  household: MemberState[];
  /** Kilometres since the last night in camp. */
  kmSinceRest: number;
  /**
   * What the household is carrying to drink. Only scripted content ever refills
   * this — the player controls how fast it empties, never when more appears.
   */
  water: WaterStore;
  /**
   * Who the player says these people are: a name and a chosen look for every
   * member, not only the head. The roster in the content supplies the defaults.
   */
  identities: Record<string, MemberIdentity>;
  /** Details that belong to the head alone. */
  head: HeadDetails;
  /**
   * Every decision the player has taken, as event id to chosen option id. Later
   * content reads this — it is what "carries forward" actually means.
   */
  decisions: Record<string, string>;
  /** Nights spent in camp. Distinct from `day`, which also counts arrival days. */
  nightsCamped: number;

  // --- Events ---------------------------------------------------------------
  /** The current leg's event configuration, copied in when the leg begins. */
  schedule: LegSchedule;
  /** Events already shown this run. Nothing fires twice. */
  fired: string[];
  /** Distance at which the next pooled event becomes eligible. */
  nextPooledAtKm: number;
  /** Advances on every chance roll, so a run replays identically from its seed. */
  seed: number;
  /**
   * The event on screen, if any. While this is set the household stops walking —
   * the march waits for the player, not the other way round.
   */
  activeEventId?: string;

  // --- Codex ----------------------------------------------------------------
  /** Entries the player has earned, in the order they were opened. */
  unlockedCodex: string[];
  /** Waypoint reached and not yet read. Set once, when the camp is first reached. */
  arrivedAt?: string;

  // --- Checkpoints ----------------------------------------------------------
  /** First-try accuracy across the whole run, not just the current quiz. */
  quiz: QuizProgress;
  /** Checkpoint waiting to be taken, set on arrival and cleared when it is done. */
  quizPending?: string;

  // --- Set pieces -----------------------------------------------------------
  /**
   * The set piece on screen, if one is running. While this is set the march is
   * suspended entirely — the crossing is not something you walk past.
   */
  setPiece?: SetPieceState;
  /**
   * The ruler of ten this household answers to after Jethro's reorganisation
   * (Exodus 18:25). A `judges` id in the content. Persists for the rest of the run.
   */
  judgeId?: string;

  // --- Falling behind -------------------------------------------------------
  /**
   * Kilometres behind the head of the column. Grows when the household cannot hold
   * Israel's speed and shrinks when it makes the ground back up.
   */
  lagKm: number;

  // --- Manna ----------------------------------------------------------------
  /**
   * Days since manna first fell, 1-indexed. Zero until it begins — the seven-day
   * pattern is counted from the first morning, not from leaving Egypt, so this is
   * its own clock rather than a reading of `day`.
   */
  mannaDay: number;
  /** What is in the basket. Empty and inert until `mannaDay` is set. */
  manna: MannaStore;
  /** Set at dawn when a hoarded basket bred worms, so camp can say so once. */
  mannaSpoiled?: number;
}

/** A name and an appearance, chosen for one member of the household. */
export interface MemberIdentity {
  name: string;
  /** Index into that member's appearance variants. */
  look: number;
}

/** What the player sets for the head, beyond a name and a face. */
export interface HeadDetails {
  age: number;
  /** A `TradeOption` id from the content. */
  trade: string;
}

export type Action =
  | { type: "SET_PACE"; pace: Pace }
  | { type: "TRAVEL"; km: number }
  | { type: "MAKE_CAMP" }
  | {
      type: "NAME_HOUSEHOLD";
      identities: Record<string, MemberIdentity>;
      head: HeadDetails;
    }
  | {
      type: "DECIDE";
      eventId: string;
      choiceId: string;
      effects?: HouseholdEffect;
      provisions?: Provisions;
    }
  | { type: "DISMISS_EVENT" }
  | { type: "DISMISS_WAYPOINT" }
  | { type: "ANSWER"; questionId: string; correct: boolean }
  | { type: "FINISH_QUIZ" }
  /**
   * Manna begins. Fired from scripted content at Leg 8 and never by the player,
   * for the same reason water refills are: the supply is not theirs to start.
   */
  | { type: "MANNA_BEGINS" }
  /** Go out for the morning portion. `inTime` is false once the sun has grown hot. */
  | { type: "GATHER_MANNA"; inTime: boolean }
  /** Keep some back. Obedient on the sixth day, and the v20 mistake on any other. */
  | { type: "LAY_ASIDE_MANNA"; omers: number }
  /** Enter a set piece. Scripted from a leg — never something the player opens. */
  | { type: "BEGIN_SET_PIECE"; piece: RunnableSetPiece }
  | { type: "SET_PIECE_CHOOSE"; piece: RunnableSetPiece; choiceId: string }
  | { type: "SET_PIECE_ADVANCE"; piece: RunnableSetPiece }
  /**
   * Read the recorded outcome and apply it. Carries the judges the content has so
   * Jethro can place the household without `src/sim` importing an episode.
   */
  | { type: "FINISH_SET_PIECE"; piece: RunnableSetPiece; judgeIds?: readonly string[] }
  /**
   * Set out on the next stage of the itinerary.
   *
   * Takes the same flattened leg the run started with, so the caller is the one
   * place that knows about episodes and `src/sim` still does not.
   */
  | { type: "BEGIN_LEG"; leg: LegInput };

/**
 * Takes only the shape it needs from a content `Leg`, so the simulation stays
 * independent of the content model while still being driven by it.
 */
/** What the simulation needs to know about a leg. Flattened from the content. */
export interface LegInput {
  id: string;
  distanceKm: number;
  terrain: Terrain;
  scripted?: LegSchedule["scripted"];
  setPiece?: LegSchedule["setPiece"];
  beginsManna?: boolean;
  pool?: LegSchedule["pool"];
  waypoint?: string;
  unlocks?: string[];
  eventUnlocks?: Record<string, string[]>;
  quiz?: string;
}

export function initialState(
  leg: LegInput,
  household: CastMember[],
  /** Fixed by default so a fresh run is reproducible; vary it per save later. */
  seed = 0x5eed,
): GameState {
  return {
    day: 1,
    pace: "steady",
    distanceKm: 0,
    legDistanceKm: leg.distanceKm,
    legId: leg.id,
    terrain: leg.terrain,
    household: household.map((member) => freshMember(member.id, member.role)),
    kmSinceRest: 0,
    water: freshWater(),
    lagKm: 0,
    mannaDay: 0,
    manna: freshManna(),
    decisions: {},
    nightsCamped: 0,
    schedule: {
      scripted: leg.scripted ?? emptySchedule.scripted,
      setPiece: leg.setPiece,
      beginsManna: leg.beginsManna,
      pool: leg.pool ?? emptySchedule.pool,
      waypoint: leg.waypoint,
      unlocks: leg.unlocks ?? [],
      eventUnlocks: leg.eventUnlocks ?? {},
      quizId: leg.quiz,
    },
    fired: [],
    unlockedCodex: [],
    quiz: emptyQuizProgress,
    nextPooledAtKm: firstPooledAtKm(seed),
    seed,
    identities: Object.fromEntries(
      household.map((member) => [member.id, { name: member.name, look: 0 }]),
    ),
    head: {
      age: household.find((member) => member.role === "head")?.age ?? 35,
      trade: "brickmaker",
    },
  };
}
