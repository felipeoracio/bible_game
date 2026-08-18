import web from "./web.json";
import type { ScriptureRef } from "../types";

/**
 * The translation adapter.
 *
 * Episode 1 ships the World English Bible, which is public domain — no licence,
 * no lead time, no publisher approval. Everything downstream goes through this
 * module, so swapping or adding a translation later is a change here and nowhere
 * else. Only the passages the game actually cites are bundled.
 */

export interface Verse {
  number: number;
  text: string;
}

export interface Passage {
  ref: ScriptureRef;
  translation: string;
  rights: string;
  /** Human-readable, e.g. "Exodus 12:37-38". */
  label: string;
  verses: Verse[];
}

export const translation = web.translation;

type Chapters = Record<string, Record<string, string> | undefined>;
type Book = { name: string; chapters: Chapters } | undefined;

const books = web.books as Record<string, { name: string; chapters: Chapters }>;

/**
 * Expand a verse spec into verse numbers. Accepts "34", "37-38", and "3,5-6".
 * Returns an empty array for anything malformed — the validator turns that into
 * a build failure rather than letting it reach a player.
 */
export function parseVerses(spec: string): number[] {
  const out: number[] = [];
  for (const part of spec.split(",")) {
    const piece = part.trim();
    if (/^\d+$/.test(piece)) {
      out.push(Number(piece));
      continue;
    }
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(piece);
    if (!range) return [];
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (end < start) return [];
    for (let n = start; n <= end; n++) out.push(n);
  }
  return out;
}

export function bookName(book: string): string {
  return books[book]?.name ?? book;
}

export function formatRef(ref: ScriptureRef): string {
  return `${bookName(ref.book)} ${ref.chapter}:${ref.verses}`;
}

/**
 * Resolve a reference to its text. Returns null if the book, chapter, or any
 * verse in the range is not bundled — a missing verse must not silently render
 * as a gap in a passage the game is presenting as Scripture.
 */
export function getPassage(ref: ScriptureRef): Passage | null {
  const book: Book = books[ref.book];
  const chapter = book?.chapters[String(ref.chapter)];
  if (!chapter) return null;

  const numbers = parseVerses(ref.verses);
  if (numbers.length === 0) return null;

  const verses: Verse[] = [];
  for (const number of numbers) {
    const text = chapter[String(number)];
    if (text === undefined) return null;
    verses.push({ number, text });
  }

  return {
    ref,
    translation: translation.name,
    rights: translation.rights,
    label: formatRef(ref),
    verses,
  };
}

/** True when every verse in the reference is present in the bundled text. */
export function refResolves(ref: ScriptureRef): boolean {
  return getPassage(ref) !== null;
}
