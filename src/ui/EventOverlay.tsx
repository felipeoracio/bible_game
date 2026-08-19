"use client";

import { episode1 } from "@/content/episode1";
import type { Choice } from "@/content/types";
import { useGame } from "@/state/store";
import EventCard from "./EventCard";

/**
 * What happens on the road. Blocks the march until the player answers, which the
 * reducer enforces too — `TRAVEL` is ignored while an event is open, so holding the
 * march key through an incident cannot skip it.
 */
export default function EventOverlay() {
  const activeEventId = useGame((s) => s.state.activeEventId);
  const dispatch = useGame((s) => s.dispatch);

  const event = activeEventId ? episode1.events[activeEventId] : undefined;
  if (!event) return null;

  const decide = (choice: Choice) =>
    dispatch({
      type: "DECIDE",
      eventId: event.id,
      choiceId: choice.id,
      effects: choice.effects,
      provisions: choice.provisions,
    });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/92 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <div className="mx-auto min-w-[288px] max-w-3xl">
        <EventCard
          event={event}
          onDecide={decide}
          continueLabel="Walk on"
          onContinue={() => dispatch({ type: "DISMISS_EVENT" })}
        />
      </div>
    </div>
  );
}
