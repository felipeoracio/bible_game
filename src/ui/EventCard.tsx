"use client";

import { useState } from "react";
import { formatRef } from "@/content/scripture";
import type { Choice, GameEvent, Provenance } from "@/content/types";
import { useGame } from "@/state/store";
import { withNames } from "@/content/names";

/**
 * One event, and the choice it puts to the player.
 *
 * Shared by the road and by camp so the two never drift apart in look or in
 * behaviour. The tier tag is always on screen and always specific — "Recorded ·
 * Exodus 12:31-33", not a generic badge. Design doc §6.3 calls that a feature to
 * talk about in marketing rather than an internal process, so it is never hidden
 * behind a hover.
 */

export function TierTag({ provenance }: { provenance: Provenance }) {
  const label =
    provenance.tier === "recorded"
      ? `Recorded · ${provenance.refs.map(formatRef).join(", ")}`
      : provenance.tier === "reasoned"
        ? "Reasoned"
        : "Invented for the game";

  const tone =
    provenance.tier === "recorded"
      ? "border-ochre text-ochre"
      : provenance.tier === "reasoned"
        ? "border-olive text-olive"
        : "border-linen/30 text-linen/45";

  return (
    <span
      className={`text-pixel-sm inline-block border px-1.5 uppercase ${tone}`}
      title={provenance.tier === "reasoned" ? provenance.basis : undefined}
    >
      {label}
    </span>
  );
}

interface EventCardProps {
  event: GameEvent;
  /** Called once, when the player commits to an option. */
  onDecide: (choice: Choice) => void;
  /** Label for the button that closes the card once it is settled. */
  continueLabel: string;
  onContinue: () => void;
}

export default function EventCard({
  event,
  onDecide,
  continueLabel,
  onContinue,
}: EventCardProps) {
  const identities = useGame((s) => s.state.identities);
  const [taken, setTaken] = useState<Choice | undefined>();
  // Content names the family by id; the player named them something else.
  const named = (text: string) => withNames(text, identities);

  const choose = (choice: Choice) => {
    if (taken) return;
    setTaken(choice);
    onDecide(choice);
  };

  const settled = taken !== undefined || event.choices.length === 0;

  return (
    <section className="frame frame-dark flex flex-col gap-3" aria-label={event.title}>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-pixel uppercase tracking-widest text-linen">{event.title}</h3>
        <TierTag provenance={event.provenance} />
      </div>

      <p className="frame frame-parchment frame-slim text-pixel-sm">{named(event.body)}</p>

      {taken ? (
        <div className="flex flex-col gap-2">
          <p className="text-pixel-sm text-linen/85">{named(taken.outcome)}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-pixel-sm text-linen/40">Your household&rsquo;s choice:</span>
            <TierTag provenance={taken.provenance} />
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {event.choices.map((choice, index) => (
            <li key={choice.id}>
              <button
                type="button"
                onClick={() => choose(choice)}
                className="text-pixel-sm flex w-full items-center gap-3 border-2 border-ochre/40 px-3 py-2 text-left uppercase tracking-widest text-linen transition-colors hover:border-terracotta hover:bg-terracotta/20"
              >
                <span className="shrink-0 border border-ochre/50 px-1.5 text-ochre">
                  {index + 1}
                </span>
                <span className="min-w-0 grow">{named(choice.label)}</span>
                {/* Which choices are the text's and which are ours, before you pick. */}
                <TierTag provenance={choice.provenance} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {settled && (
        <button
          type="button"
          onClick={onContinue}
          className="text-pixel w-fit border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
        >
          {continueLabel}
        </button>
      )}
    </section>
  );
}
