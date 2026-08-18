"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { episode1 } from "@/content/episode1";
import { useGame } from "@/state/store";
import CodexEntryView from "./CodexEntryView";

/**
 * Arrival at a named camp.
 *
 * This is where the learning is meant to land (§4): the Codex entry opens, the
 * passage is put in front of the player, and the checkpoint follows. The quiz
 * arrives with F8; until then this screen ends the leg.
 */
export default function WaypointScreen() {
  const arrivedAt = useGame((s) => s.state.arrivedAt);
  const unlocked = useGame((s) => s.state.unlockedCodex);
  const legId = useGame((s) => s.state.legId);
  const dispatch = useGame((s) => s.dispatch);
  const router = useRouter();

  const entry = arrivedAt ? episode1.codex[arrivedAt] : undefined;
  if (!entry) return null;

  const leg = episode1.legs.find((candidate) => candidate.id === legId);
  const opened = unlocked.filter((id) => id !== arrivedAt);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/94 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Arrived at ${entry.title}`}
    >
      <div className="mx-auto flex min-w-[288px] max-w-3xl flex-col gap-5">
        <header className="text-pixel-sm uppercase tracking-widest text-ochre">
          You have reached {leg?.to ?? entry.title}
        </header>

        <section className="frame frame-panel">
          <CodexEntryView
            entry={entry}
            unlocked={unlocked}
            // Following a link leaves the arrival screen for the Codex proper,
            // rather than nesting a reader inside a modal.
            onOpen={(id) => router.push(`/codex#${id}`)}
          />
        </section>

        {opened.length > 0 && (
          <p className="text-pixel-sm text-linen/50">
            Also added to the Codex on this leg:{" "}
            {opened.map((id) => episode1.codex[id]?.title).filter(Boolean).join(", ")}.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => dispatch({ type: "DISMISS_WAYPOINT" })}
            className="text-pixel border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
          >
            Continue to the checkpoint
          </button>
          <Link
            href="/codex"
            className="text-pixel-sm uppercase tracking-widest text-linen/50 hover:text-linen"
          >
            Open the Codex
          </Link>
        </div>
      </div>
    </div>
  );
}
