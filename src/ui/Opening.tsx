"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { opening } from "@/content/episode1/opening";
import { TierTag } from "./EventCard";
import Passage from "./Passage";

/**
 * The exposition, before the household is built.
 *
 * One beat at a time, advanced by the player rather than on a timer — this is meant
 * to be read, possibly aloud, and a family reads at its own pace. Skippable from the
 * first screen, because the second time through nobody wants it.
 *
 * The Leg 1 panorama sits behind it, dimmed: the player is looking at Egypt while
 * being told what Egypt was.
 */
export default function Opening() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const beat = opening[index];
  const last = index === opening.length - 1;

  const next = () => (last ? router.push("/new") : setIndex((i) => i + 1));

  // Enter and Space page forward, so the whole thing can be read without a mouse.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!beat) return null;

  return (
    <main className="relative flex min-h-screen min-w-[320px] flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/art/leg-01-rameses-succoth.webp)" }}
      />
      <div aria-hidden className="absolute inset-0 bg-ink/80" />

      <div className="relative flex w-full max-w-2xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-pixel-sm uppercase tracking-[0.4em] text-ochre">{beat.heading}</p>
          <TierTag provenance={beat.provenance} />
        </header>

        <section className="frame frame-panel flex flex-col gap-4" aria-live="polite">
          {beat.lines.map((line, i) => (
            <p key={i} className="text-pixel-sm leading-relaxed text-linen/90">
              {line}
            </p>
          ))}
          {beat.passages && beat.passages.length > 0 && <Passage refs={beat.passages} />}
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={next}
            className="text-pixel border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
          >
            {last ? "Name your household" : "Go on"}
          </button>

          {/* Skippable from the first screen; nobody reads this twice. */}
          <Link
            href="/new"
            className="text-pixel-sm uppercase tracking-widest text-linen/45 hover:text-linen"
          >
            Skip
          </Link>

          <span className="text-pixel-sm ml-auto text-linen/35" aria-hidden>
            {index + 1} / {opening.length}
          </span>
        </div>
      </div>
    </main>
  );
}
