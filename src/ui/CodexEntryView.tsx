"use client";

import { episode1 } from "@/content/episode1";
import type { CodexEntry } from "@/content/types";
import { TierTag } from "./EventCard";
import Passage from "./Passage";

const KIND_LABEL: Record<CodexEntry["kind"], string> = {
  waypoint: "Camp",
  person: "Person",
  object: "Object",
  event: "Event",
  note: "Note",
};

/**
 * One Codex entry in full: what the game claims, how it is tagged, the passage it
 * rests on, and where to read next. This is the screen a parent or a teacher
 * actually evaluates, so nothing here is abbreviated.
 */
export default function CodexEntryView({
  entry,
  onOpen,
  unlocked,
}: {
  entry: CodexEntry;
  /** Follow a link to a related entry. */
  onOpen?: (id: string) => void;
  /** Which entries the player has earned, for dimming links they cannot follow. */
  unlocked: readonly string[];
}) {
  const legIndex = episode1.legs.find((leg) => leg.waypoint === entry.id)?.index;

  return (
    <article className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        {/* A camp says where it falls on the itinerary; everything else says what it is. */}
        <p className="text-pixel-sm uppercase tracking-widest text-linen/45">
          {legIndex !== undefined
            ? `Camp ${legIndex} of 12 on the itinerary`
            : KIND_LABEL[entry.kind]}
        </p>
        <h3 className="text-pixel uppercase tracking-widest text-linen">{entry.title}</h3>
        <TierTag provenance={entry.provenance} />
      </header>

      <p className="text-pixel-sm leading-relaxed text-linen/85">{entry.note}</p>

      {entry.passages.length > 0 && <Passage refs={entry.passages} />}

      {entry.related.length > 0 && (
        <footer className="flex flex-col gap-2">
          <h4 className="text-pixel-sm uppercase tracking-widest text-ochre">Read next</h4>
          <ul className="flex flex-wrap gap-2">
            {entry.related.map((id) => {
              const related = episode1.codex[id];
              if (!related) return null;
              const open = unlocked.includes(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    disabled={!open || !onOpen}
                    onClick={() => onOpen?.(id)}
                    title={open ? undefined : "Not yet found on the journey."}
                    className="text-pixel-sm border-2 border-ochre/40 px-3 py-1.5 uppercase tracking-widest text-linen transition-colors hover:border-terracotta hover:bg-terracotta/20 disabled:cursor-not-allowed disabled:border-linen/15 disabled:text-linen/25 disabled:hover:bg-transparent"
                  >
                    {open ? related.title : "Not yet found"}
                  </button>
                </li>
              );
            })}
          </ul>
        </footer>
      )}
    </article>
  );
}
