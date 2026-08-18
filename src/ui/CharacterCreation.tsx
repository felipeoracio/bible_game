"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { episode1 } from "@/content/episode1";
import { lookAsset, PARTY, VARIANTS_PER_KIND } from "@/game/party";
import type { MemberIdentity } from "@/sim/types";
import { useGame } from "@/state/store";

/**
 * Building the household.
 *
 * Every member is named and given a face, not only the head — these five walk the
 * whole journey together and the player should recognise them at camp. The head
 * additionally carries an age and a trade, because those are the only details the
 * text gives us any purchase on.
 *
 * The trades wear their tier tags here, on the first screen the player touches: two
 * of the four are what Scripture says Israel was made to do in Egypt, and two are
 * reasoned from the period. Setting that expectation early is the point.
 *
 * Tribe selection is deliberately absent — out of scope for Episode 1 (see PLAN.md).
 */

const MIN_AGE = 18;
const MAX_AGE = 70;
const MAX_NAME = 18;

const TIER_LABEL: Record<string, string> = {
  recorded: "Recorded",
  reasoned: "Reasoned",
  invented: "Invented",
};

const ROLE_LABEL: Record<string, string> = {
  head: "You, the head of the household",
  spouse: "Your husband or wife",
  child: "Your child",
  elder: "Your elder",
};

export default function CharacterCreation() {
  const router = useRouter();
  const dispatch = useGame((s) => s.dispatch);
  const startingIdentities = useGame((s) => s.state.identities);
  const startingHead = useGame((s) => s.state.head);

  const [identities, setIdentities] = useState<Record<string, MemberIdentity>>(() => ({
    ...startingIdentities,
  }));
  const [age, setAge] = useState(startingHead.age);
  const [trade, setTrade] = useState(startingHead.trade);

  const roster = episode1.household;

  const set = (id: string, patch: Partial<MemberIdentity>) =>
    setIdentities((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { name: "", look: 0 }), ...patch },
    }));

  const cycleLook = (id: string, delta: number) => {
    const current = identities[id]?.look ?? 0;
    set(id, { look: (current + delta + VARIANTS_PER_KIND) % VARIANTS_PER_KIND });
  };

  const missing = roster.filter((member) => !identities[member.id]?.name.trim());
  const ready = missing.length === 0;

  const begin = () => {
    if (!ready) return;
    const trimmed = Object.fromEntries(
      Object.entries(identities).map(([id, identity]) => [
        id,
        { ...identity, name: identity.name.trim() },
      ]),
    );
    dispatch({ type: "NAME_HOUSEHOLD", identities: trimmed, head: { age, trade } });
    router.push("/play");
  };

  return (
    <main className="mx-auto flex min-h-screen min-w-[320px] max-w-3xl flex-col gap-8 px-4 py-12">
      <header>
        <p className="text-pixel-sm uppercase tracking-[0.4em] text-ochre">Before you go</p>
        <h1 className="text-pixel-lg mt-3 uppercase text-linen">Your household</h1>
        <p className="frame frame-parchment frame-slim text-pixel-sm mt-5">
          Five of you are leaving tonight. Name them, and choose their faces — you will be
          walking a long way together. Everyone in this family is invented for the game.
          The people you meet from Scripture are not.
        </p>
      </header>

      <form
        className="flex flex-col gap-8"
        onSubmit={(event) => {
          event.preventDefault();
          begin();
        }}
      >
        <section className="flex flex-col gap-4" aria-label="Your household">
          {roster.map((member) => {
            const figure = PARTY.find((candidate) => candidate.id === member.id);
            const identity = identities[member.id];
            const named = Boolean(identity?.name.trim());

            return (
              <div
                key={member.id}
                className="frame frame-panel flex flex-wrap items-center gap-x-5 gap-y-3"
              >
                {figure && (
                  <div className="flex shrink-0 items-end gap-2">
                    <button
                      type="button"
                      onClick={() => cycleLook(member.id, -1)}
                      aria-label={`Previous face for ${member.name}`}
                      className="text-pixel-sm border-2 border-ochre/40 px-2 py-1 text-linen transition-colors hover:border-terracotta hover:bg-terracotta/20"
                    >
                      &lt;
                    </button>
                    <img
                      src={lookAsset(figure.kind, identity?.look ?? 0)}
                      alt=""
                      className="[image-rendering:pixelated]"
                      style={{ height: figure.height * 2 }}
                    />
                    <button
                      type="button"
                      onClick={() => cycleLook(member.id, 1)}
                      aria-label={`Next face for ${member.name}`}
                      className="text-pixel-sm border-2 border-ochre/40 px-2 py-1 text-linen transition-colors hover:border-terracotta hover:bg-terracotta/20"
                    >
                      &gt;
                    </button>
                  </div>
                )}

                <div className="flex min-w-0 grow flex-col gap-2">
                  <label
                    htmlFor={`name-${member.id}`}
                    className="text-pixel-sm uppercase tracking-widest text-ochre"
                  >
                    {ROLE_LABEL[member.role] ?? member.role}
                    {member.role !== "head" && (
                      <span className="ml-2 text-linen/40">age {member.age}</span>
                    )}
                  </label>
                  <input
                    id={`name-${member.id}`}
                    value={identity?.name ?? ""}
                    maxLength={MAX_NAME}
                    autoComplete="off"
                    aria-invalid={!named}
                    onChange={(event) => set(member.id, { name: event.target.value })}
                    className="text-pixel w-full border-2 border-ochre/50 bg-ink px-3 py-2 text-linen outline-none focus:border-terracotta"
                  />
                  <p className="text-pixel-sm text-linen/45">{member.description}</p>
                </div>
              </div>
            );
          })}
        </section>

        <div className="flex flex-col gap-2">
          <label htmlFor="head-age" className="text-pixel-sm uppercase tracking-widest text-ochre">
            Your age &mdash; {age}
          </label>
          <input
            id="head-age"
            type="range"
            min={MIN_AGE}
            max={MAX_AGE}
            value={age}
            onChange={(event) => setAge(Number(event.target.value))}
            className="w-full accent-[var(--color-terracotta)]"
          />
          <p className="text-pixel-sm text-linen/40">
            Old enough to remember, young enough to carry a child a long way.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-pixel-sm mb-1 uppercase tracking-widest text-ochre">
            Your trade in Egypt
          </legend>
          <div className="flex flex-col gap-2">
            {episode1.trades.map((option) => {
              const chosen = option.id === trade;
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer flex-col gap-1 border-2 p-3 transition-colors ${
                    chosen
                      ? "border-terracotta bg-terracotta/15"
                      : "border-ochre/30 hover:border-ochre/70"
                  }`}
                >
                  <span className="flex flex-wrap items-center gap-3">
                    <input
                      type="radio"
                      name="trade"
                      value={option.id}
                      checked={chosen}
                      onChange={() => setTrade(option.id)}
                      className="accent-[var(--color-terracotta)]"
                    />
                    <span className="text-pixel uppercase tracking-widest text-linen">
                      {option.label}
                    </span>
                    <span
                      className="text-pixel-sm ml-auto border border-ochre/40 px-1.5 uppercase text-ochre"
                      title={
                        option.provenance.tier === "reasoned" ? option.provenance.basis : undefined
                      }
                    >
                      {TIER_LABEL[option.provenance.tier]}
                    </span>
                  </span>
                  <span className="text-pixel-sm pl-7 text-linen/55">{option.description}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!ready}
            className="text-pixel border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:border-linen/20 disabled:bg-transparent disabled:text-linen/30"
          >
            Leave tonight
          </button>
          {!ready && (
            <span className="text-pixel-sm text-linen/45">
              {missing.length === 1
                ? "One of them still has no name."
                : `${missing.length} of them still have no names.`}
            </span>
          )}
          <Link
            href="/"
            className="text-pixel-sm uppercase tracking-widest text-linen/50 hover:text-linen"
          >
            Back
          </Link>
        </div>
      </form>
    </main>
  );
}
