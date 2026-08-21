"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { episode1 } from "@/content/episode1";
import { accuracy } from "@/sim/systems/quiz";
import { useGame } from "@/state/store";
import CodexEntryView from "./CodexEntryView";
import MapRibbon from "./MapRibbon";

/**
 * The Codex, readable outside of play.
 *
 * Locked entries are listed rather than hidden: seeing that there is something at
 * Elim you have not reached yet is part of the point, and a title gives nothing
 * away. What stays behind the lock is the note and the passage — those are earned
 * by walking to them.
 */
export default function CodexReader() {
  const unlocked = useGame((s) => s.state.unlockedCodex);
  const quiz = useGame((s) => s.state.quiz);
  const entries = Object.values(episode1.codex);
  const known = accuracy(quiz);
  const [openId, setOpenId] = useState<string | undefined>(() => unlocked[0]);

  /*
   * `/codex#entry-id` opens straight onto an entry, which is what the "read next"
   * links from an arrival screen use. Read from the hash rather than a search
   * param so the page stays statically rendered with no Suspense boundary.
   */
  useEffect(() => {
    const wanted = window.location.hash.slice(1);
    if (wanted && episode1.codex[wanted]) setOpenId(wanted);
  }, []);

  const entry = openId ? episode1.codex[openId] : undefined;
  const isOpen = (id: string) => unlocked.includes(id);

  return (
    <main className="mx-auto flex min-h-screen min-w-[320px] max-w-4xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div>
          <h1 className="text-pixel-lg uppercase text-linen">The Codex</h1>
          <p className="text-pixel-sm mt-2 text-linen/55">
            Everything the game claims, and where it comes from. {unlocked.length} of{" "}
            {entries.length} found.
            {known !== undefined && (
              <>
                {" "}
                {Math.round(known * 100)}% of checkpoint questions known first time.
              </>
            )}
          </p>
        </div>
        <Link
          href="/"
          className="text-pixel-sm uppercase tracking-widest text-linen/50 hover:text-linen"
        >
          Back
        </Link>
      </header>

      {/* The itinerary, before the entries that explain it. */}
      <MapRibbon />

      {unlocked.length === 0 && (
        <p className="frame frame-parchment frame-slim text-pixel-sm">
          You have not found anything yet. Entries open as you walk the journey and live
          through what the text records — the camps you reach, the people you meet, and
          the things you carry.
        </p>
      )}

      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <nav className="md:w-64 md:shrink-0" aria-label="Codex entries">
          <ul className="flex flex-col gap-2">
            {entries.map((candidate) => {
              const open = isOpen(candidate.id);
              const selected = candidate.id === openId;
              return (
                <li key={candidate.id}>
                  <button
                    type="button"
                    disabled={!open}
                    onClick={() => setOpenId(candidate.id)}
                    title={open ? undefined : "Not yet found on the journey."}
                    className={`text-pixel-sm w-full border-2 px-3 py-2 text-left uppercase tracking-widest transition-colors ${
                      selected
                        ? "border-terracotta bg-terracotta/20 text-linen"
                        : open
                          ? "border-ochre/40 text-linen/85 hover:border-ochre hover:bg-linen/5"
                          : "cursor-not-allowed border-linen/15 text-linen/25"
                    }`}
                  >
                    {candidate.title}
                    {!open && <span className="ml-2 opacity-70">&middot; locked</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="frame frame-panel min-w-0 grow">
          {entry ? (
            <CodexEntryView entry={entry} unlocked={unlocked} onOpen={setOpenId} />
          ) : (
            <p className="text-pixel-sm text-linen/50">
              Choose an entry to read it.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
