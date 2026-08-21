"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { episode1 } from "@/content/episode1";
import { useGame } from "@/state/store";
import { TierTag } from "./EventCard";
import { CELL_W, MEDALLION, Medallion, type Stop } from "./MapRibbon";

/**
 * Setting out — the beat between one camp and the next.
 *
 * The Codex ribbon is a reference you go and look at. This is the same itinerary
 * used as a moment: pressed "set out", the player watches the road they have
 * walked slide behind them and the next camp light up ahead. It is the one point
 * in the game where they are thinking about the route, so it is the right place to
 * say how far it is and — the part that matters — that the distance is ours and
 * the camps are not.
 *
 * The strip is translated rather than scrolled so the departing camp sits under a
 * fixed marker, and the marker travels from it to the destination. Everything is a
 * CSS transition on one transform, which keeps it cheap and lets
 * `prefers-reduced-motion` turn the whole thing into a cut.
 */

/** How long the marker takes to walk the gap. */
const TRAVEL_MS = 1600;

interface SettingOutProps {
  /** Index into `episode1.legs` of the leg about to be walked. */
  legIndex: number;
  /** Called once the player commits — the caller advances the leg. */
  onBegin: () => void;
  onCancel: () => void;
}

export default function SettingOut({ legIndex, onBegin, onCancel }: SettingOutProps) {
  const unlocked = useGame((s) => s.state.unlockedCodex);
  const leg = episode1.legs[legIndex];

  /*
   * Two frames: `false` puts the marker over the camp just left, `true` moves it
   * to the one ahead. Flipping it after a tick is what starts the transition —
   * setting the end state on the first render would give no animation at all.
   */
  const [arrived, setArrived] = useState(false);

  /*
   * The offset is computed in plain pixels from the measured window rather than
   * with `calc(50% - …)`. Two reasons, both found by watching it fail to move: a
   * transition between two calc() values carrying a percentage does not
   * interpolate, and the percentage resolved against the flex container's
   * constrained width rather than the width of the thirteen medallions inside it.
   */
  const windowRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(0);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /*
   * Measured before paint, not after. With a plain effect the first frame renders
   * at a width of zero, so the strip is drawn a long way off its mark and then
   * lurches across the screen instead of sliding one camp. Laying it out first
   * means the animation starts exactly where the household is standing.
   */
  useLayoutEffect(() => {
    const measure = () => setWindowWidth(windowRef.current?.offsetWidth ?? 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    // Nothing moves until the strip knows where it is.
    if (windowWidth === 0) return;
    if (reduceMotion) {
      setArrived(true);
      return;
    }
    const id = window.setTimeout(() => setArrived(true), 250);
    return () => window.clearTimeout(id);
  }, [reduceMotion, windowWidth]);

  if (!leg) return null;

  /*
   * The same thirteen stops the Codex ribbon shows, so the two can never disagree
   * about where the household has been. Stop 0 is Rameses; leg N's destination is
   * stop N + 1, which makes the camp being left stop `legIndex`.
   */
  const stops: Stop[] = [
    { key: "rameses", label: "Rameses", cell: MEDALLION.rameses, reached: true, current: false },
    ...episode1.legs.map((l, i) => ({
      key: l.id,
      label: l.to,
      cell: MEDALLION[l.id],
      /*
       * Anything at or behind the camp being left is reached by definition — you
       * cannot set out from Succoth without having got to Succoth. The Codex is
       * still consulted for the rest, but it is not the only witness here, so a
       * waypoint that failed to open cannot make the road behind you look
       * unwalked.
       */
      reached: i < legIndex || unlocked.includes(l.waypoint),
      // The destination lights up only once the marker has walked to it.
      current: i === legIndex && arrived,
    })),
  ];

  const fromIndex = legIndex; // the camp behind you
  const toIndex = legIndex + 1; // the camp ahead
  const GAP = 12;
  const step = CELL_W + GAP;
  const markerAt = arrived ? toIndex : fromIndex;

  // Slide the strip so the marker's stop sits in the middle of the window.
  const offset = windowWidth / 2 - CELL_W / 2 - markerAt * step;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center overflow-y-auto bg-ink/95 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Setting out for ${leg.to}`}
    >
      <div className="mx-auto flex w-full min-w-[288px] max-w-3xl flex-col gap-5">
        <header className="text-pixel-sm uppercase tracking-widest text-ochre">
          Leg {leg.index} of {episode1.legs.length}
        </header>

        <h2 className="text-pixel-lg text-linen">
          {leg.from} <span className="text-ochre">to</span> {leg.to}
        </h2>

        {/*
          The road, with the household's marker on it. Overflow is hidden rather
          than scrollable here — this is a thing being watched, not browsed.
        */}
        <section className="frame frame-panel flex flex-col gap-3" aria-label="The road ahead">
          <div ref={windowRef} className="relative h-[122px] overflow-hidden">
            {/* The fixed marker the strip travels under. */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 z-10 h-[96px] w-[84px] -translate-x-1/2 border-2 border-terracotta"
            />
            {/*
              The strip is not rendered until the window around it has been
              measured. If it is, React commits the corrected offset and switches
              the transition on in the same paint, and the browser animates the
              correction — the strip flies in from off-screen instead of stepping
              one camp. Mounting it already in the right place gives it nothing to
              animate from.
            */}
            {windowWidth > 0 && (
            <ol
              className="flex gap-3 will-change-transform"
              style={{
                transform: `translateX(${offset}px)`,
                /*
                 * No transition until the strip has been measured, or the
                 * correction from an unmeasured zero width animates too — which
                 * is what made the first attempt lurch across the screen instead
                 * of stepping one camp.
                 */
                transition: reduceMotion ? undefined : `transform ${TRAVEL_MS}ms ease-in-out`,
              }}
            >
              {stops.map((stop) => (
                <Medallion key={stop.key} stop={stop} />
              ))}
            </ol>
            )}
          </div>
        </section>

        {/*
          The teaching moment, at the point the player is actually thinking about
          distance. The tag says plainly that the number is reasoned and the camps
          are not, which is the whole argument of the game in one line.
        */}
        <section className="frame frame-panel flex flex-col gap-2" aria-label="How far it is">
          <div className="text-pixel-sm flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="uppercase tracking-widest text-linen/50">The road</span>
            <span className="text-linen">{leg.distanceKm} km</span>
            <TierTag provenance={leg.distance} />
          </div>
          {leg.distance.tier === "reasoned" && (
            <p className="text-pixel-sm text-linen/60">{leg.distance.basis}</p>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onBegin}
            className="text-pixel border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
          >
            Take up the road
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-pixel-sm uppercase tracking-widest text-linen/50 hover:text-linen"
          >
            Not yet
          </button>
        </div>
      </div>
    </div>
  );
}
