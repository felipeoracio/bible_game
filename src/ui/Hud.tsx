"use client";

import { episode1 } from "@/content/episode1";
import { legProgress } from "@/sim/reducer";
import { PACES, type Pace } from "@/sim/types";
import { daysOfWaterLeft } from "@/sim/systems/water";
import { POSITION_LABEL, POSITION_NOTE, positionAt } from "@/sim/systems/column";
import { useGame } from "@/state/store";
import { useState } from "react";

const PACE_LABEL: Record<Pace, string> = {
  steady: "Steady",
  quick: "Quick",
  driving: "Driving",
};

/**
 * The React half of the render. It reads the same simulation state the canvas
 * does, which is the point of Feature 1: one source of truth, two renderers.
 */
export default function Hud({
  onMakeCamp,
  onSetOut,
}: {
  onMakeCamp: () => void;
  /** Opens the map. Advancing the leg is the map's job, not the button's. */
  onSetOut: () => void;
}) {
  // Primitive selectors only — returning a fresh object here would re-render on
  // every dispatch.
  const day = useGame((s) => s.state.day);
  const pace = useGame((s) => s.state.pace);
  const distanceKm = useGame((s) => s.state.distanceKm);
  const legDistanceKm = useGame((s) => s.state.legDistanceKm);
  const legId = useGame((s) => s.state.legId);
  const kmSinceRest = useGame((s) => s.state.kmSinceRest);
  const water = useGame((s) => s.state.water);
  const household = useGame((s) => s.state.household);
  const terrain = useGame((s) => s.state.terrain);
  const lagKm = useGame((s) => s.state.lagKm);
  const nightsCamped = useGame((s) => s.state.nightsCamped);
  const dispatch = useGame((s) => s.dispatch);

  /** Set once the itinerary runs out, which for Episode 1 means Sinai. */
  const [atSinai, setAtSinai] = useState(false);

  const legAt = episode1.legs.findIndex((candidate) => candidate.id === legId);
  const leg = legAt >= 0 ? episode1.legs[legAt] : undefined;
  const nextTo = legAt >= 0 ? episode1.legs[legAt + 1]?.to : undefined;

  /*
   * Water is shown as days of walking rather than litres, because litres mean
   * nothing to a player and "two days left" is the decision they actually face.
   */
  const daysLeft = daysOfWaterLeft(water, household, pace, terrain);
  const waterFraction = water.capacity > 0 ? water.litres / water.capacity : 0;
  const waterTone =
    daysLeft < 1 ? "text-terracotta" : daysLeft < 2 ? "text-ochre" : "text-linen/70";
  const position = positionAt(lagKm);
  const progress = legProgress({ distanceKm, legDistanceKm });
  const arrived = progress >= 1;
  /*
   * Nights spent at *this* camp. `nightsCamped` counts the whole run, so it is
   * compared against the number of legs already behind the household — arriving
   * and sleeping is what earns the road onward.
   */
  const nightsHere = nightsCamped - legAt;

  return (
    <div className="frame frame-panel flex flex-col gap-4">
      <div className="text-pixel-sm flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 uppercase tracking-widest">
        <span className="text-ochre">Day {day}</span>
        <span className="text-linen/70">
          {distanceKm.toFixed(1)} of {legDistanceKm} km
        </span>
      </div>

      {/*
        The skins. Only scripted relief ever refills these, so this readout is a
        warning rather than a resource the player can go and top up.
      */}
      <div className="text-pixel-sm flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="uppercase tracking-widest text-linen/50">Water</span>
        <span
          className="inline-block h-3 w-28 border-2 border-ochre/30 bg-ink"
          role="progressbar"
          aria-label="Water carried"
          aria-valuenow={Math.round(waterFraction * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span
            className={`block h-full ${daysLeft < 1 ? "bg-terracotta" : "bg-indigo"}`}
            style={{ width: `${Math.max(0, Math.min(1, waterFraction)) * 100}%` }}
          />
        </span>
        <span className={waterTone}>
          {water.litres < 0.1
            ? "the skins are empty"
            : `about ${daysLeft < 1 ? "less than a day" : `${Math.floor(daysLeft)} day${Math.floor(daysLeft) === 1 ? "" : "s"}`} left at this pace`}
        </span>
      </div>

      {/*
        Where you are in the column. Said in words rather than kilometres, because
        "4.2 km behind" is not something a player can act on and "toward the back"
        is. Only shown once there is something to say.
      */}
      {position !== "with-the-column" && (
        <p
          className={`text-pixel-sm ${position === "stragglers" ? "text-terracotta" : "text-ochre"}`}
          role="status"
        >
          {POSITION_LABEL[position]} &mdash;{" "}
          <span className="text-linen/60">{POSITION_NOTE[position]}</span>
        </p>
      )}

      <div
        className="h-3 w-full overflow-hidden border-2 border-ochre/30 bg-ink"
        role="progressbar"
        aria-label="Distance to the next camp"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-terracotta transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-pixel-sm mr-1 uppercase tracking-widest text-linen/50">Pace</span>
        {PACES.map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => dispatch({ type: "SET_PACE", pace: p })}
            aria-pressed={pace === p}
            className={`text-pixel-sm border-2 px-3 py-1.5 uppercase tracking-widest transition-colors ${
              pace === p
                ? "border-terracotta bg-terracotta text-linen"
                : "border-ochre/40 text-linen/80 hover:border-ochre hover:bg-linen/10"
            }`}
          >
            {PACE_LABEL[p]} <span className="opacity-50">{i + 1}</span>
          </button>
        ))}

        {/*
          Making camp is the only way the household recovers, so it is put beside
          the pace controls rather than hidden — stopping is a pace decision too.
        */}
        {/*
          Only offered once the household has actually reached the camp and slept
          there. Setting out is the deliberate end of a stage, so it sits beside
          "make camp" rather than firing on its own.
        */}
        {arrived && nightsHere > 0 && (
          <button
            type="button"
            onClick={() => {
              // Nothing left on the itinerary: say so instead of opening a map
              // of a road that does not continue.
              if (legAt >= 0 && episode1.legs[legAt + 1]) onSetOut();
              else setAtSinai(true);
            }}
            className="text-pixel-sm border-2 border-terracotta bg-terracotta px-3 py-1.5 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
          >
            {nextTo ? `Set out for ${nextTo}` : "Set out"}
          </button>
        )}

        <button
          type="button"
          onClick={onMakeCamp}
          disabled={kmSinceRest <= 0}
          title={kmSinceRest <= 0 ? "Walk a while before you stop for the night." : undefined}
          className="text-pixel-sm ml-auto border-2 border-ochre/60 px-3 py-1.5 uppercase tracking-widest text-linen transition-colors hover:border-terracotta hover:bg-terracotta disabled:cursor-not-allowed disabled:border-linen/15 disabled:text-linen/25 disabled:hover:border-linen/15 disabled:hover:bg-transparent"
        >
          Make camp
        </button>
      </div>

      {/*
        The end of the itinerary. Episode 1 stops at Sinai, and the remaining legs
        arrive with the rest of F14 — said plainly rather than leaving a button
        that quietly does nothing.
      */}
      {atSinai && (
        <p className="text-pixel-sm text-ochre" role="status">
          This is as far as the itinerary goes for now. The road on from here is
          still being written.
        </p>
      )}

      <p className="text-pixel-sm text-linen/60">
        {arrived ? (
          <span className="text-linen">
            You have reached {leg?.to ?? "the camp"}.{" "}
            {nightsHere > 0
              ? "Set out when your household is ready."
              : "Make camp for the night."}
          </span>
        ) : (
          <>Hold the right arrow, D, space, or press and hold the screen to march.</>
        )}
      </p>
    </div>
  );
}
