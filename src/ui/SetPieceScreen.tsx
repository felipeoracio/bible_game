"use client";

import { episode1 } from "@/content/episode1";
import { withNames } from "@/content/names";
import type { SetPiece, SetPieceChoice } from "@/content/types";
import { atOutcome, isFutile } from "@/sim/systems/setpiece";
import { exposure, viewOfTheHill } from "@/sim/systems/rephidim";
import { describe as describeAssignment } from "@/sim/systems/jethro";
import { useGame } from "@/state/store";
import { TierTag } from "./EventCard";

/**
 * A set piece, full screen (§5.7).
 *
 * Takes over completely rather than sitting in the travel view, because the whole
 * point of these four is that the march has stopped and something is happening to
 * you. The reducer refuses to move the household while one is open, so there is no
 * way past this except through it.
 *
 * The interface is doing one careful thing throughout: it never offers to solve
 * what cannot be solved. A phase marked futile says so plainly rather than dressing
 * three helpless options up as a puzzle — the honesty is the experience.
 */

function Phase({ piece }: { piece: SetPiece }) {
  const state = useGame((s) => s.state.setPiece);
  const identities = useGame((s) => s.state.identities);
  const dispatch = useGame((s) => s.dispatch);
  if (!state) return null;

  const named = (text: string) => withNames(text, identities);
  /*
   * Indexed straight off the content rather than through the simulation's
   * `currentPhase`, which deliberately returns only the narrow shape the rules
   * need. The sim owns sequencing; the interface owns the prose.
   */
  const phase = piece.phases[state.phaseIndex];
  if (!phase) return null;

  const takenId = state.taken[phase.id];
  const taken = phase.choices.find((choice) => choice.id === takenId);

  const choose = (choice: SetPieceChoice) =>
    dispatch({ type: "SET_PIECE_CHOOSE", piece, choiceId: choice.id });

  return (
    <section className="frame frame-dark flex flex-col gap-3" aria-label={phase.id}>
      <div className="flex flex-wrap items-center gap-3">
        <TierTag provenance={phase.provenance} />
      </div>

      <p className="frame frame-parchment frame-slim text-pixel-sm">{named(phase.body)}</p>

      {/*
        Said out loud, before the player picks. Offering three options and quietly
        making them all fail would be a trick; saying none of them will work, and
        letting the player choose how to meet it anyway, is the actual subject.
      */}
      {isFutile(piece, state) && !taken && (
        <p className="text-pixel-sm text-ochre">
          Nothing you choose here changes what happens next. Choose how your household
          meets it.
        </p>
      )}

      {taken ? (
        <div className="flex flex-col gap-2">
          <p className="text-pixel-sm text-linen/85">{named(taken.outcome)}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-pixel-sm text-linen/40">Your household&rsquo;s choice:</span>
            <TierTag provenance={taken.provenance} />
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_PIECE_ADVANCE", piece })}
            className="text-pixel mt-1 w-fit border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
          >
            Go on
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {phase.choices.map((choice, index) => (
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
                <TierTag provenance={choice.provenance} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Outcome({ piece }: { piece: SetPiece }) {
  const identities = useGame((s) => s.state.identities);
  const finished = useGame((s) => s.state.setPiece?.finished ?? false);
  const judgeId = useGame((s) => s.state.judgeId);
  const dispatch = useGame((s) => s.dispatch);

  const named = (text: string) => withNames(text, identities);
  const judge = judgeId ? episode1.judges.find((j) => j.id === judgeId) : undefined;

  return (
    <section className="frame frame-dark flex flex-col gap-3" aria-label="What happened">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-pixel uppercase tracking-widest text-linen">What happened</h3>
        <TierTag provenance={piece.outcome.provenance} />
      </div>

      <p className="frame frame-parchment frame-slim text-pixel-sm">
        {named(piece.outcome.text)}
      </p>

      {/*
        Jethro's set piece ends with a named person attached to the household for
        the rest of the run. He is invented and his card says so; the office he
        holds is not.
      */}
      {finished && judge && (
        <div className="flex flex-col gap-1">
          <p className="text-pixel-sm text-linen/85">{describeAssignment(judge.name)}</p>
          <p className="text-pixel-sm text-linen/55">{judge.description}</p>
          <TierTag provenance={judge.provenance} />
        </div>
      )}

      {!finished ? (
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "FINISH_SET_PIECE",
              piece,
              judgeIds: episode1.judges.map((j) => j.id),
            })
          }
          className="text-pixel w-fit border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
        >
          Read it
        </button>
      ) : (
        <p className="text-pixel-sm text-linen/60">
          The column is moving again. Take up the road when you are ready.
        </p>
      )}
    </section>
  );
}

export default function SetPieceScreen() {
  const state = useGame((s) => s.state.setPiece);
  const identities = useGame((s) => s.state.identities);
  const lagKm = useGame((s) => s.state.lagKm);
  const household = useGame((s) => s.state.household);

  if (!state) return null;
  const piece = episode1.setPieces[state.id];
  if (!piece) return null;

  const named = (text: string) => withNames(text, identities);
  const done = atOutcome(piece, state);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/95 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={piece.title}
    >
      <div className="mx-auto flex min-w-[288px] max-w-3xl flex-col gap-5">
        <header className="flex flex-wrap items-center gap-3">
          <h2 className="text-pixel uppercase tracking-widest text-ochre">{piece.title}</h2>
          <TierTag provenance={piece.provenance} />
        </header>

        <p className="text-pixel-sm text-linen/80">{named(piece.intro)}</p>

        {/*
          Rephidim only. What you can make out of the hill depends on how far back
          you are walking — which is the verb of that set piece, and the payoff for
          every pace decision made on the legs before it.
        */}
        {piece.mechanic === "amalek-at-the-rear" && (
          <p className="text-pixel-sm text-linen/60">
            {viewOfTheHill(exposure(lagKm, household))}
          </p>
        )}

        {done ? <Outcome piece={piece} /> : <Phase piece={piece} />}
      </div>
    </div>
  );
}
