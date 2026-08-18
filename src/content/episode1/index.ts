import type { CodexEntry, Episode, GameEvent, Quiz } from "../types";
import { household, trades } from "./cast";
import { legs } from "./legs";
import { leg01Events } from "./events/leg-01";
import { leg01CampEvents, leg01CampLines } from "./camp";
import { opening } from "./opening";
import { leg01Codex } from "./codex/leg-01";
import { leg01Quiz } from "./quiz/leg-01";

const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

/**
 * Episode 1 assembled. This object is the only thing the rest of the game imports
 * from `content` — swap it for `episode2` and the engine plays a different journey.
 */
export const episode1: Episode = {
  id: "episode-1-egypt-to-sinai",
  title: "Egypt to Sinai",
  legs,
  events: byId<GameEvent>([...leg01Events, ...leg01CampEvents]),
  codex: byId<CodexEntry>([...leg01Codex]),
  quizzes: byId<Quiz>([leg01Quiz]),
  household,
  trades,
  campLines: leg01CampLines,
  opening,
};
