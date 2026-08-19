import {
  emptySaveFile,
  parseSaveFile,
  remove,
  upsert,
  type ParseResult,
  type SaveFile,
  type SavedRun,
} from "@/sim/save";

/**
 * The only module in the game that touches localStorage.
 *
 * Everything here has to survive three things that are all perfectly normal and
 * none of which are errors on the player's part:
 *
 *   - **Server rendering.** There is no `window` during the build, and these pages
 *     are prerendered, so every call has to be safe to make with no browser.
 *   - **Storage being unavailable.** Private browsing, disabled cookies, and a full
 *     quota all make localStorage throw rather than return null. A family that
 *     cannot save should still be able to play.
 *   - **A file written by another build.** Handled in `sim/save.ts`, which treats
 *     the contents as untrusted input.
 */

export const SAVE_KEY = "by-way-of-the-wilderness/saves";

/** Whether saving is possible at all in this browser, tested by actually doing it. */
export function isAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = `${SAVE_KEY}/probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Reads the file, reporting *why* it could not be read rather than swallowing it. */
export function readSaveFile(): ParseResult {
  if (typeof window === "undefined") return { ok: false, reason: "empty" };
  try {
    return parseSaveFile(window.localStorage.getItem(SAVE_KEY));
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}

/** The runs on disk, or none — for the parts of the UI that only want a list. */
export function readRuns(): SavedRun[] {
  const result = readSaveFile();
  return result.ok ? result.file.runs : [];
}

/**
 * Write the file back.
 *
 * Returns whether it worked. A failed write is not thrown: the player is mid-march
 * and losing the run to an exception would be far worse than quietly not saving
 * this tick, so the caller decides whether to tell them.
 */
export function writeSaveFile(file: SaveFile): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

/** Where a file this build could not read is kept, rather than thrown away. */
export const BACKUP_KEY = `${SAVE_KEY}/unreadable-backup`;

/**
 * Move a file we cannot read out of the way instead of destroying it.
 *
 * This matters most for a save written by a *newer* build: the Continue screen
 * tells the player to update and their journeys will open, and overwriting the
 * file the moment they start a new game would make that a lie. An existing backup
 * is never overwritten, so the earliest — and most likely to be the real one —
 * survives.
 */
function setAside(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (raw === null || raw === "") return;
    if (window.localStorage.getItem(BACKUP_KEY) === null) {
      window.localStorage.setItem(BACKUP_KEY, raw);
    }
  } catch {
    // Out of quota, most likely. Nothing useful to do, and not worth failing over.
  }
}

/** Read, insert, write. The whole file is rewritten, so slots stay consistent. */
export function putRun(run: SavedRun): boolean {
  const result = readSaveFile();
  if (result.ok) return writeSaveFile(upsert(result.file, run));

  // Merging into something we could not parse is how a save system loses a run it
  // did understand — so start a clean file, but keep the old one first.
  if (result.reason !== "empty") setAside();
  return writeSaveFile(upsert(emptySaveFile(), run));
}

export function deleteRun(id: string): boolean {
  const result = readSaveFile();
  if (!result.ok) return false;
  return writeSaveFile(remove(result.file, id));
}

/** A run id. `crypto.randomUUID` is not available on every browser we care about. */
export function newRunId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `run-${Date.now().toString(36)}-${random}`;
}
