"use client";

import { episode1 } from "@/content/episode1";
import { AXIS_MAX, SUFFERING_THRESHOLD, weakest, type MemberState } from "@/sim/systems/household";
import { useGame } from "@/state/store";

/**
 * The household, on three tracks each.
 *
 * Deliberately not a single health bar. A family can be walking fine and still have
 * stopped believing in you, and the player needs to be able to see that difference
 * at a glance — it is the thing the game is about.
 */

const AXES = [
  { key: "condition", label: "Body", colour: "bg-olive" },
  { key: "morale", label: "Spirit", colour: "bg-ochre" },
  { key: "trust", label: "Trust", colour: "bg-indigo" },
  // Water sits alongside the three axes rather than among them: it is a supply
  // problem, not a state of mind, and resting does nothing for it.
  { key: "water", label: "Water", colour: "bg-sand" },
] as const satisfies readonly { key: keyof MemberState; label: string; colour: string }[];

/** Warn at a quarter and again at a tenth, so trouble is visible before it is a crisis. */
function toneFor(value: number): string {
  if (value <= 10) return "text-terracotta";
  if (value <= 25) return "text-ochre";
  return "text-linen/70";
}

function AxisBar({ value, colour }: { value: number; colour: string }) {
  const percent = (value / AXIS_MAX) * 100;
  return (
    <span
      className="inline-block h-2 w-14 min-w-8 max-w-14 shrink border border-ochre/30 align-middle"
      aria-hidden
    >
      <span
        className={`block h-full ${percent <= 10 ? "bg-terracotta" : colour}`}
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}

export default function PartyPanel() {
  const household = useGame((s) => s.state.household);
  const identities = useGame((s) => s.state.identities);

  const roster = episode1.household;

  const nameOf = (id: string) =>
    identities[id]?.name ?? roster.find((candidate) => candidate.id === id)?.name ?? id;

  /**
   * Say out loud who is in trouble. Reading five sets of bars to spot the one that
   * has quietly dropped is exactly the kind of work a family playing together should
   * not have to do.
   */
  const struggling = weakest(household);
  const warn = struggling && struggling.condition <= SUFFERING_THRESHOLD ? struggling : undefined;

  return (
    <section className="frame frame-panel" aria-label="Your household">
      <h2 className="text-pixel-sm mb-3 uppercase tracking-widest text-ochre">Your household</h2>

      <ul className="flex flex-col gap-2">
        {household.map((member) => {
          const name = nameOf(member.id);

          return (
            <li key={member.id} className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-pixel-sm w-20 shrink-0 uppercase tracking-widest text-linen">
                {name}
              </span>
              {AXES.map((axis) => {
                const value = member[axis.key];
                return (
                  <span
                    key={axis.key}
                    className="text-pixel-sm flex min-w-0 shrink items-center gap-1.5"
                  >
                    <span className="shrink-0 text-linen/40">{axis.label}</span>
                    <AxisBar value={value} colour={axis.colour} />
                    <span className={`w-6 shrink-0 text-right ${toneFor(value)}`}>
                      {Math.round(value)}
                    </span>
                  </span>
                );
              })}
            </li>
          );
        })}
      </ul>

      {warn && (
        <p className="text-pixel-sm mt-3 text-terracotta" role="status">
          {nameOf(warn.id)} is falling behind. Ease the pace, or make camp.
        </p>
      )}
    </section>
  );
}
