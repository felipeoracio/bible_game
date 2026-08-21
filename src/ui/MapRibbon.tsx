"use client";

import { episode1 } from "@/content/episode1";
import { useGame } from "@/state/store";

/**
 * The itinerary as a strip of camps.
 *
 * Numbers 33 is a list, and this is that list with pictures on it: where the
 * household set out, every camp it has reached, and the one it is walking to now.
 * Reached is read from the Codex rather than from a separate counter — a camp's
 * waypoint entry opens on arrival, so "have I been here" already has one answer in
 * the game and this uses it.
 *
 * The medallions are windowed out of one sprite sheet (`map-ribbon.webp`) rather
 * than loaded as twelve files. `MEDALLION` maps a leg to its cell.
 */

/** Pixel geometry of the sliced sheet — see `scripts/import-map-ribbon.py`. */
export const CELL_W = 84;
export const CELL_H = 96;
export const CELLS = 13;

/**
 * Which cell of the delivered ribbon belongs to which camp.
 *
 * The art was drawn against a slightly different list from the itinerary the game
 * walks: it has no Pi-hahiroth and no Elim — both recorded camps, Numbers 33:7 and
 * 33:9 — and ends on Mount Sinai, which is past where this episode stops.
 *
 * Elim is filled from leg 7's panorama, whose left end the artist painted as Elim,
 * so that cell is a picture of the place rather than something that looks like it.
 * Pi-hahiroth has no such source and renders as an empty frame, which is the honest
 * way to show art nobody has drawn.
 */
export const MEDALLION: Record<string, number> = {
  rameses: 0,
  "leg-01-rameses-succoth": 1, // Succoth
  "leg-02-succoth-etham": 2, // Etham
  // leg 3 — Pi-hahiroth — not on the delivered map
  "leg-04-the-crossing": 3, // the Red Sea crossing
  "leg-05-marah": 4, // Marah
  "leg-06-elim": 12, // composited from the Elim end of leg 7's panorama
  "leg-07-red-sea": 5, // by the sea
  "leg-08-wilderness-of-sin": 6,
  "leg-09-dophkah": 7,
  "leg-10-alush": 8,
  "leg-11-rephidim": 9,
  "leg-12-sinai": 10, // the wilderness of Sinai
};

export interface Stop {
  key: string;
  label: string;
  cell: number | undefined;
  reached: boolean;
  current: boolean;
}

export function Medallion({ stop }: { stop: Stop }) {
  const tone = stop.current
    ? "border-terracotta"
    : stop.reached
      ? "border-ochre/70"
      : "border-linen/15";

  return (
    <li className="flex w-[84px] shrink-0 flex-col items-center gap-1.5">
      <div
        className={`relative h-[96px] w-[84px] border-2 ${tone} bg-ink`}
        /*
         * Unreached camps are dimmed and desaturated rather than hidden. Seeing
         * that there is somewhere ahead you have not been is part of the point,
         * the same reason locked Codex entries are listed by title.
         */
        style={
          stop.cell === undefined
            ? undefined
            : {
                backgroundImage: "url(/art/map-ribbon.webp)",
                backgroundPosition: `-${stop.cell * CELL_W}px 0`,
                backgroundSize: `${CELL_W * CELLS}px ${CELL_H}px`,
                /*
                 * Three states, not two. The camp being walked to is only part
                 * dimmed — it has not been reached, but it is the one the player
                 * should be looking at, and treating it like the far end of the
                 * itinerary buries it.
                 */
                filter: stop.reached
                  ? undefined
                  : stop.current
                    ? "grayscale(0.3) brightness(0.8)"
                    : "grayscale(0.85) brightness(0.45)",
              }
        }
        aria-hidden
      >
        {stop.cell === undefined && (
          <span className="text-pixel-sm absolute inset-0 flex items-center justify-center text-center text-linen/25">
            not yet
            <br />
            drawn
          </span>
        )}
      </div>
      <span
        className={`text-pixel-sm w-full text-center leading-tight ${
          stop.current ? "text-terracotta" : stop.reached ? "text-linen/80" : "text-linen/30"
        }`}
      >
        {stop.label}
      </span>
    </li>
  );
}

export default function MapRibbon() {
  const unlocked = useGame((s) => s.state.unlockedCodex);
  const legId = useGame((s) => s.state.legId);

  const legIndex = episode1.legs.findIndex((leg) => leg.id === legId);

  const stops: Stop[] = [
    {
      key: "rameses",
      label: "Rameses",
      cell: MEDALLION.rameses,
      // Where everyone starts, so it is behind you from the first step.
      reached: true,
      current: false,
    },
    ...episode1.legs.map((leg, i) => ({
      key: leg.id,
      label: leg.to,
      cell: MEDALLION[leg.id],
      reached: unlocked.includes(leg.waypoint),
      current: i === legIndex && !unlocked.includes(leg.waypoint),
    })),
  ];

  const reached = stops.filter((s) => s.reached).length;

  return (
    <section className="frame frame-panel flex flex-col gap-3" aria-label="The itinerary">
      <div className="text-pixel-sm flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 uppercase tracking-widest">
        <h2 className="text-ochre">The road out of Egypt</h2>
        <span className="text-linen/50">
          {reached} of {stops.length} camps reached
        </span>
      </div>

      {/*
        Scrolls sideways rather than wrapping. Thirteen camps in a line is the
        shape of the thing — Numbers 33 is a list, and it reads as one.
      */}
      <ol className="flex gap-3 overflow-x-auto pb-2">
        {stops.map((stop) => (
          <Medallion key={stop.key} stop={stop} />
        ))}
      </ol>

      <p className="text-pixel-sm text-linen/45">
        Every camp and its place in the order is recorded in Numbers 33. How far apart
        they were is not.
      </p>
    </section>
  );
}
