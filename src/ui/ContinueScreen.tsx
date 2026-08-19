"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { episode1 } from "@/content/episode1";
import { byMostRecent, type SavedRun } from "@/sim/save";
import { readSaveFile } from "@/state/storage";
import { useGame } from "@/state/store";

/**
 * The saved journeys.
 *
 * This is played by families, so the list has to answer "which one is mine?" at a
 * glance — the household's name, where they had got to, and when. Not a slot
 * number and a timestamp.
 *
 * Everything here runs after mount. The page is prerendered at build time, where
 * there is no localStorage, so reading during render would produce a server/client
 * mismatch and a hydration error.
 */

function whenText(at: number): string {
  if (!at) return "";
  const days = Math.floor((Date.now() - at) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(at).toLocaleDateString();
}

function RunRow({
  run,
  onPlay,
  onDelete,
}: {
  run: SavedRun;
  onPlay: () => void;
  onDelete: () => void;
}) {
  const leg = episode1.legs.find((candidate) => candidate.id === run.legId);
  const [confirming, setConfirming] = useState(false);

  const day = typeof run.state?.day === "number" ? run.state.day : 1;
  const distance = typeof run.state?.distanceKm === "number" ? run.state.distanceKm : 0;

  return (
    <li className="frame frame-panel flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="min-w-0 flex-1">
        <p className="text-pixel uppercase tracking-widest text-linen">{run.name}</p>
        <p className="text-pixel-sm mt-1 text-linen/55">
          {leg ? `${leg.from} to ${leg.to}` : "A leg this version no longer has"} &middot; day{" "}
          {day} &middot; {distance.toFixed(0)} km walked
        </p>
        <p className="text-pixel-sm mt-1 text-linen/35">Last played {whenText(run.updatedAt)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPlay}
          disabled={!leg}
          title={leg ? undefined : "This journey was saved on a leg the game no longer has."}
          className="text-pixel-sm border-2 border-terracotta bg-terracotta px-4 py-1.5 uppercase tracking-widest text-linen transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:border-linen/15 disabled:bg-transparent disabled:text-linen/25"
        >
          Take up the road
        </button>

        {/*
          Two taps to delete. A child clicking around the menu should not be able
          to wipe a sibling's journey with one press.
        */}
        {confirming ? (
          <>
            <button
              type="button"
              onClick={onDelete}
              className="text-pixel-sm border-2 border-terracotta px-4 py-1.5 uppercase tracking-widest text-terracotta transition-colors hover:bg-terracotta hover:text-linen"
            >
              Really delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-pixel-sm px-2 py-1.5 uppercase tracking-widest text-linen/50 hover:text-linen"
            >
              Keep
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-pixel-sm border-2 border-ochre/30 px-4 py-1.5 uppercase tracking-widest text-linen/60 transition-colors hover:border-ochre hover:text-linen"
          >
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

export default function ContinueScreen() {
  const router = useRouter();
  const loadRun = useGame((s) => s.loadRun);
  const removeRun = useGame((s) => s.deleteRun);

  const [runs, setRuns] = useState<SavedRun[] | null>(null);
  const [problem, setProblem] = useState<string | undefined>();

  useEffect(() => {
    const result = readSaveFile();
    if (result.ok) {
      setRuns(byMostRecent(result.file.runs));
      return;
    }
    setRuns([]);
    // "empty" is not a problem — it is simply a player who has not saved yet.
    if (result.reason === "unreadable") {
      setProblem("There is a saved file here, but this version of the game cannot read it.");
    } else if (result.reason === "from-a-newer-version") {
      setProblem(
        "These journeys were saved by a newer version of the game. Update, and they will open.",
      );
    }
  }, []);

  const play = (run: SavedRun) => {
    if (loadRun(run)) router.push("/play");
  };

  const drop = (run: SavedRun) => {
    removeRun(run.id);
    setRuns((current) => (current ?? []).filter((candidate) => candidate.id !== run.id));
  };

  return (
    <main className="mx-auto flex min-h-screen min-w-[320px] max-w-3xl flex-col gap-6 px-4 py-12">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="text-pixel uppercase tracking-widest text-ochre">Journeys under way</h1>
        <Link
          href="/"
          className="text-pixel-sm uppercase tracking-widest text-linen/50 hover:text-linen"
        >
          Back
        </Link>
      </header>

      {problem && (
        <p className="frame frame-panel text-pixel-sm text-terracotta" role="status">
          {problem}
        </p>
      )}

      {runs === null ? (
        <p className="text-pixel-sm text-linen/40">Looking for saved journeys&hellip;</p>
      ) : runs.length === 0 ? (
        <div className="frame frame-panel flex flex-col items-start gap-4">
          <p className="text-pixel-sm text-linen/70">
            Nothing saved yet. The game keeps your place from the moment your household has
            names.
          </p>
          <Link
            href="/opening"
            className="text-pixel border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
          >
            Begin the march
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {runs.map((run) => (
            <RunRow key={run.id} run={run} onPlay={() => play(run)} onDelete={() => drop(run)} />
          ))}
        </ul>
      )}
    </main>
  );
}
