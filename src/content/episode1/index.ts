import type { CodexEntry, Episode, GameEvent, Quiz, SetPiece } from "../types";
import { household, trades } from "./cast";
import { legs } from "./legs";
import { leg01Events } from "./events/leg-01";
import { leg02Events } from "./events/leg-02";
import { leg03Events } from "./events/leg-03";
import { leg04Events } from "./events/leg-04";
import { leg05Events } from "./events/leg-05";
import { legs0608Events } from "./events/legs-06-08";
import {
  leg01CampEvents,
  leg01CampLines,
  legs0204CampEvents,
  legs0508CampEvents,
} from "./camp";
import { opening } from "./opening";
import { leg01Codex } from "./codex/leg-01";
import { legs0204Codex } from "./codex/legs-02-04";
import { legs0508Codex } from "./codex/legs-05-08";
import { setPieceCodex } from "./codex/setpieces";
import { judges, setPieces } from "./setpieces";
import { leg01Quiz } from "./quiz/leg-01";
import { leg02Quiz, leg03Quiz, leg04Quiz } from "./quiz/legs-02-04";
import { leg05Quiz, leg06Quiz, leg07Quiz, leg08Quiz } from "./quiz/legs-05-08";

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
  events: byId<GameEvent>([
    ...leg01Events,
    ...leg02Events,
    ...leg03Events,
    ...leg04Events,
    ...leg05Events,
    ...legs0608Events,
    ...leg01CampEvents,
    ...legs0204CampEvents,
    ...legs0508CampEvents,
  ]),
  codex: byId<CodexEntry>([
    ...leg01Codex,
    ...legs0204Codex,
    ...legs0508Codex,
    ...setPieceCodex,
  ]),
  quizzes: byId<Quiz>([
    leg01Quiz, leg02Quiz, leg03Quiz, leg04Quiz,
    leg05Quiz, leg06Quiz, leg07Quiz, leg08Quiz,
  ]),
  setPieces: byId<SetPiece>(setPieces),
  judges,
  household,
  trades,
  campLines: leg01CampLines,
  opening,
};
