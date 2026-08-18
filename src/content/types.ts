/**
 * The content model, and the three-tier labelling system that the whole product
 * rests on (design doc §6.3).
 *
 * The important idea here is that a claim about Scripture cannot be made without
 * a citation, and that this is enforced by the compiler rather than by a reviewer
 * remembering to check. `recorded` carries a non-empty tuple of references, so
 * `{ tier: "recorded", refs: [] }` is a type error, not a review finding.
 *
 * Nothing in this file imports Phaser or React. Content is data.
 */

/** Books cited so far. Widen as later legs and episodes need more. */
export type BookId = "exodus" | "numbers";

export interface ScriptureRef {
  book: BookId;
  chapter: number;
  /** A single verse ("34") or an inclusive range ("37-38"). */
  verses: string;
}

/** A tuple with at least one element. This is what makes `refs: []` uncompilable. */
export type NonEmpty<T> = [T, ...T[]];

/**
 * Where a piece of content comes from. Every authored string in the game carries
 * one of these, and the interface shows it to the player.
 *
 * - `recorded` — stated directly in the text. Must cite chapter and verse.
 * - `reasoned` — not stated, but supported by the setting or surrounding text.
 *   Must say what the reasoning rests on; the Codex shows that line to the player.
 * - `invented` — created for gameplay. Consistent with the setting, never claimed
 *   as Scripture.
 */
export type Provenance =
  | { tier: "recorded"; refs: NonEmpty<ScriptureRef> }
  | { tier: "reasoned"; basis: string; refs?: ScriptureRef[] }
  | { tier: "invented" };

export type Tier = Provenance["tier"];

// --- Authoring helpers -------------------------------------------------------
// Content files are written by hand in volume, so these exist to keep the source
// readable: `recorded(ref("exodus", 12, "34"))` rather than a nested object.

export function ref(book: BookId, chapter: number, verses: string | number): ScriptureRef {
  return { book, chapter, verses: String(verses) };
}

export function recorded(...refs: NonEmpty<ScriptureRef>): Provenance {
  return { tier: "recorded", refs };
}

export function reasoned(basis: string, ...refs: ScriptureRef[]): Provenance {
  return refs.length > 0 ? { tier: "reasoned", basis, refs } : { tier: "reasoned", basis };
}

export function invented(): Provenance {
  return { tier: "invented" };
}

// --- Content -----------------------------------------------------------------

export type Terrain =
  | "delta-marsh"
  | "coastal-sand"
  | "open-desert"
  | "rocky-wadi"
  | "mountain-approach";

/** A scripted event and the point in the leg where it fires. */
export interface ScriptedSlot {
  eventId: string;
  /** 0 to 1 along the leg. */
  atProgress: number;
}

export interface Leg {
  id: string;
  /** 1 to 12 for Episode 1. */
  index: number;
  from: string;
  to: string;
  distanceKm: number;
  /**
   * Numbers 33 records the camps in sequence but not the distances between them,
   * so every leg length in this game is reasoned and must say so.
   */
  distance: Provenance;
  terrain: Terrain;
  /**
   * Painted backdrop for this leg, as a path under `/public`. When present it
   * replaces the procedurally generated horizon and middle layers; the ground the
   * household walks on is still drawn from the terrain theme, so it keeps scrolling
   * at full speed under their feet.
   *
   * Legs without one fall back to generated scenery, which is what lets legs 2–12
   * be playable before their art exists.
   */
  backdrop?: string;
  scripted: ScriptedSlot[];
  /** Ordinary-life events eligible to fire on this leg. */
  pool: string[];
  /** Decisions the household can face at camp on this leg. */
  camp: string[];
  /** Codex entry unlocked on arrival. */
  waypoint: string;
  /** Further entries opened by arriving, beyond the waypoint itself. */
  unlocks?: string[];
  quiz: string;
}

/**
 * A decision the player makes. Its provenance is separate from the event's: the
 * situation can be recorded while the household's response to it is invented,
 * which is exactly the split the design rests on (§5.5).
 */
/**
 * How a choice moves the household. Applied to every member, clamped at both ends.
 * Small numbers on purpose: no single decision should swing a journey.
 */
export interface HouseholdEffect {
  condition?: number;
  morale?: number;
  trust?: number;
}

export interface Choice {
  id: string;
  label: string;
  provenance: Provenance;
  /** Shown after the choice is taken. */
  outcome: string;
  effects?: HouseholdEffect;
}

export interface GameEvent {
  id: string;
  title: string;
  body: string;
  provenance: Provenance;
  /** Empty for pure narration. */
  choices: Choice[];
  /**
   * Codex entries this event opens. Living through something is what earns the
   * reference on it — the player meets a man of the mixed multitude, and only then
   * does the entry explaining that single line of Exodus become readable.
   */
  unlocks?: string[];
}

/**
 * Who is in the player's household.
 *
 * These people are invented, and the game says so. Their roles matter mechanically
 * because children and the elderly tire faster on a hard march, which is the whole
 * reason the household is a family rather than a squad.
 */
export type HouseholdRole = "head" | "spouse" | "child" | "elder";

export interface CastMember {
  id: string;
  name: string;
  role: HouseholdRole;
  /** Approximate years. They are invented people; the ages are characterisation. */
  age: number;
  /** One line, shown on the character sheet and in the Codex. */
  description: string;
  provenance: Provenance;
}

/**
 * A trade the player can give the head of the household. Two of these are recorded
 * occupations of Israel in Egypt; the rest are reasoned from the setting. The
 * choice is characterisation, not a stat — it changes what people say to you.
 */
export interface TradeOption {
  id: string;
  label: string;
  /** Shown under the label during character creation. */
  description: string;
  provenance: Provenance;
}

export type CodexKind = "waypoint" | "person" | "object" | "event" | "note";

export interface CodexEntry {
  id: string;
  title: string;
  kind: CodexKind;
  /** Plain-language note. Written to be read aloud in a family. */
  note: string;
  provenance: Provenance;
  /** Presented in full on the entry. */
  passages: ScriptureRef[];
  related: string[];
}

export interface QuizOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  /** Opened when the answer is wrong. Never a punishment — it shows the verse. */
  teaches: ScriptureRef;
  explanation: string;
}

export interface Quiz {
  id: string;
  legId: string;
  questions: QuizQuestion[];
}

/**
 * One episode's entire content. Swap this object and the engine plays a different
 * journey without changing a line of `src/sim`, `src/game`, or `src/ui`.
 */
export interface Episode {
  id: string;
  title: string;
  legs: Leg[];
  events: Record<string, GameEvent>;
  codex: Record<string, CodexEntry>;
  quizzes: Record<string, Quiz>;
  /** The player's household, in marching order — the head first. */
  household: CastMember[];
  /** Trades offered during character creation. */
  trades: TradeOption[];
  /** What the household says at camp, by member and mood. */
  campLines: CampLine[];
  /** The exposition shown before a new run. */
  opening: OpeningBeat[];
}

/**
 * What a household member says when the player sits with them at camp.
 *
 * Bands, not free text per night: a member's most pressing state picks the line.
 * These carry no provenance of their own — they are speech by invented people, and
 * the validator already refuses to let anyone recorded into the player's household,
 * so the tier is settled at the roster.
 */
export type CampMood = "weary" | "low-spirit" | "distrustful" | "content";

export const CAMP_MOODS: readonly CampMood[] = [
  "weary",
  "low-spirit",
  "distrustful",
  "content",
] as const;

/** One screen of the exposition. Defined in `episode1/opening.ts`. */
export interface OpeningBeat {
  id: string;
  heading: string;
  lines: string[];
  provenance: Provenance;
  passages?: ScriptureRef[];
}

export interface CampLine {
  /** Matches a `CastMember` id. */
  memberId: string;
  mood: CampMood;
  text: string;
}
