"use client";

import { useState } from "react";
import { episode1 } from "@/content/episode1";
import type { Choice, GameEvent } from "@/content/types";
import { figureFor, lookAsset } from "@/game/party";
import { moodOf } from "@/sim/systems/camp";
import { useGame } from "@/state/store";
import EventCard from "./EventCard";
import MannaPanel from "./MannaPanel";
import { withNames } from "@/content/names";

/**
 * The evening beat.
 *
 * Three things happen here, in order: the household tells you how it is going in
 * its own words, you face one decision that the rest of the journey remembers, and
 * then you sleep. Rest is deliberately last and deliberately unavoidable — the
 * player should have to look at their family before the numbers go back up.
 */

export default function CampScreen({ onClose }: { onClose: () => void }) {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);

  const roster = episode1.household;

  const leg = episode1.legs.find((candidate) => candidate.id === state.legId);

  /*
   * One decision per camp, picked once when the screen opens and then held.
   * Deriving it from `state.decisions` on every render meant that taking the
   * choice made the whole block vanish before its outcome could be read.
   */
  const [decision] = useState<GameEvent | undefined>(() => {
    const pending = (leg?.camp ?? []).find((id) => state.decisions[id] === undefined);
    return pending ? episode1.events[pending] : undefined;
  });

  const choose = (choice: Choice) => {
    if (!decision) return;
    dispatch({
      type: "DECIDE",
      eventId: decision.id,
      choiceId: choice.id,
      effects: choice.effects,
      provisions: choice.provisions,
    });
  };

  const sleep = () => {
    dispatch({ type: "MAKE_CAMP" });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/92 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Camp for the night"
    >
      <div className="mx-auto flex min-w-[288px] max-w-3xl flex-col gap-5">
        <header className="text-pixel-sm flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 uppercase tracking-widest">
          <h2 className="text-linen">
            Camp &middot; night {state.nightsCamped + 1}
          </h2>
          <span className="text-linen/50">
            {state.distanceKm >= state.legDistanceKm
              ? leg?.to
              : `${state.distanceKm.toFixed(0)} km from ${leg?.from}`}
          </span>
        </header>

        {/* Who said what, chosen by whichever of their three axes is worst. */}
        <section className="frame frame-panel flex flex-col gap-4" aria-label="Your household at camp">
          {state.household.map((member) => {
            const person = roster.find((candidate) => candidate.id === member.id);
            const identity = state.identities[member.id];
            const name = identity?.name ?? person?.name;
            const mood = moodOf(member);
            const line = episode1.campLines.find(
              (candidate) => candidate.memberId === member.id && candidate.mood === mood,
            );
            const figure = figureFor(member.id);

            return (
              <article key={member.id} className="flex items-start gap-3">
                {figure && (
                  <img
                    src={lookAsset(figure.kind, identity?.look ?? 0)}
                    alt=""
                    className="shrink-0 [image-rendering:pixelated]"
                    style={{ height: figure.height * 1.4 }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-pixel-sm uppercase tracking-widest text-ochre">{name}</p>
                  <p className="text-pixel-sm mt-1 text-linen/85">
                    {line ? withNames(line.text, state.identities) : null}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        {/* The basket. Renders nothing until manna begins at Leg 8. */}
        <MannaPanel />

        {/* The decision that carries forward. Same card the road uses. */}
        {decision && (
          <EventCard
            event={decision}
            onDecide={choose}
            continueLabel="Sleep until dawn"
            onContinue={sleep}
          />
        )}

        {!decision && (
          <button
            type="button"
            onClick={sleep}
            className="text-pixel w-fit border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
          >
            Sleep until dawn
          </button>
        )}
      </div>
    </div>
  );
}
