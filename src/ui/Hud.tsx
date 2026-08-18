"use client";

import { episode1 } from "@/content/episode1";
import { legProgress } from "@/sim/reducer";
import { PACES, type Pace } from "@/sim/types";
import { useGame } from "@/state/store";

const PACE_LABEL: Record<Pace, string> = {
  steady: "Steady",
  quick: "Quick",
  driving: "Driving",
};

/**
 * The React half of the render. It reads the same simulation state the canvas
 * does, which is the point of Feature 1: one source of truth, two renderers.
 */
export default function Hud({ onMakeCamp }: { onMakeCamp: () => void }) {
  // Primitive selectors only — returning a fresh object here would re-render on
  // every dispatch.
  const day = useGame((s) => s.state.day);
  const pace = useGame((s) => s.state.pace);
  const distanceKm = useGame((s) => s.state.distanceKm);
  const legDistanceKm = useGame((s) => s.state.legDistanceKm);
  const legId = useGame((s) => s.state.legId);
  const kmSinceRest = useGame((s) => s.state.kmSinceRest);
  const dispatch = useGame((s) => s.dispatch);

  const leg = episode1.legs.find((candidate) => candidate.id === legId);
  const progress = legProgress({ distanceKm, legDistanceKm });
  const arrived = progress >= 1;

  return (
    <div className="frame frame-panel flex flex-col gap-4">
      <div className="text-pixel-sm flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 uppercase tracking-widest">
        <span className="text-ochre">Day {day}</span>
        <span className="text-linen/70">
          {distanceKm.toFixed(1)} of {legDistanceKm} km
        </span>
      </div>

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
        <button
          type="button"
          onClick={onMakeCamp}
          disabled={kmSinceRest <= 0}
          title={kmSinceRest <= 0 ? "Walk a while before you stop for the night." : undefined}
          className="text-pixel-sm ml-auto border-2 border-ochre/60 px-3 py-1.5 uppercase tracking-widest text-linen transition-colors hover:border-terracotta hover:bg-terracotta disabled:cursor-not-allowed disabled:border-linen/15 disabled:text-linen/25"
        >
          Make camp
        </button>
      </div>

      <p className="text-pixel-sm text-linen/60">
        {arrived ? (
          <span className="text-linen">
            You have reached {leg?.to ?? "the camp"}. Make camp for the night.
          </span>
        ) : (
          <>Hold the right arrow, D, space, or press and hold the screen to march.</>
        )}
      </p>
    </div>
  );
}
