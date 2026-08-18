"use client";

import Link from "next/link";
import { useState } from "react";
import { episode1 } from "@/content/episode1";
import type { QuizOption, QuizQuestion } from "@/content/types";
import { accuracy, firstTryCount } from "@/sim/systems/quiz";
import { useGame } from "@/state/store";
import Passage from "./Passage";

/**
 * The checkpoint.
 *
 * The rule from §6.2, and the reason this screen looks the way it does: a wrong
 * answer is never a punishment. It opens the passage that settles the question and
 * lets the player try again. Nothing is taken away and nothing is locked out — the
 * only cost is that the question stops counting as known.
 *
 * Not trivia either. The questions are about what just happened on this leg, and
 * the last one is about the difference between what the text records and what the
 * game reasoned, which is the thing worth remembering.
 */
export default function QuizScreen() {
  const quizId = useGame((s) => s.state.quizPending);
  const arrivedAt = useGame((s) => s.state.arrivedAt);
  const progress = useGame((s) => s.state.quiz);
  const dispatch = useGame((s) => s.dispatch);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<QuizOption | undefined>();

  // The arrival entry is read first; the checkpoint follows it.
  const quiz = quizId && arrivedAt === undefined ? episode1.quizzes[quizId] : undefined;
  if (!quiz) return null;

  const question: QuizQuestion | undefined = quiz.questions[index];
  const finished = question === undefined;

  const choose = (option: QuizOption) => {
    if (picked) return;
    setPicked(option);
    dispatch({ type: "ANSWER", questionId: question!.id, correct: option.correct });
  };

  const advance = () => {
    setPicked(undefined);
    if (picked?.correct) setIndex((i) => i + 1);
  };

  const answeredHere = quiz.questions.filter((q) => progress.correct.includes(q.id));
  const knownHere = answeredHere.filter((q) => progress.attempts[q.id] === 1).length;
  const runAccuracy = accuracy(progress);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/94 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Checkpoint"
    >
      <div className="mx-auto flex min-w-[288px] max-w-3xl flex-col gap-5">
        <header className="text-pixel-sm flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 uppercase tracking-widest">
          <h2 className="text-ochre">Checkpoint</h2>
          {!finished && (
            <span className="text-linen/50">
              Question {index + 1} of {quiz.questions.length}
            </span>
          )}
        </header>

        {finished ? (
          <section className="frame frame-panel flex flex-col gap-4" aria-label="Checkpoint result">
            <h3 className="text-pixel uppercase tracking-widest text-linen">
              You reached the camp
            </h3>
            <p className="text-pixel-sm text-linen/85">
              You knew {knownHere} of {quiz.questions.length} without opening the passage.
            </p>
            {runAccuracy !== undefined && (
              <p className="text-pixel-sm text-linen/60">
                Across the journey so far: {Math.round(runAccuracy * 100)}% known first
                time, over {progress.correct.length}{" "}
                {progress.correct.length === 1 ? "question" : "questions"}.
              </p>
            )}
            <p className="text-pixel-sm text-linen/45">
              Looking a passage up is not a wrong turn. It only means that question does
              not count as known yet.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => dispatch({ type: "FINISH_QUIZ" })}
                className="text-pixel border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
              >
                Make camp
              </button>
              <Link
                href="/codex"
                className="text-pixel-sm uppercase tracking-widest text-linen/50 hover:text-linen"
              >
                Open the Codex
              </Link>
            </div>
          </section>
        ) : (
          <section className="frame frame-panel flex flex-col gap-4" aria-label={question.prompt}>
            <h3 className="text-pixel-sm leading-relaxed text-linen">{question.prompt}</h3>

            <ul className="flex flex-col gap-2">
              {question.options.map((option, n) => {
                const chosen = picked?.id === option.id;
                const reveal = picked !== undefined;
                const tone = !reveal
                  ? "border-ochre/40 text-linen hover:border-terracotta hover:bg-terracotta/20"
                  : option.correct
                    ? "border-olive bg-olive/25 text-linen"
                    : chosen
                      ? "border-terracotta bg-terracotta/20 text-linen"
                      : "border-linen/15 text-linen/35";

                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => choose(option)}
                      disabled={reveal}
                      className={`text-pixel-sm flex w-full items-center gap-3 border-2 px-3 py-2 text-left transition-colors disabled:cursor-default ${tone}`}
                    >
                      <span className="shrink-0 border border-current px-1.5 opacity-70">
                        {n + 1}
                      </span>
                      <span className="min-w-0">{option.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {picked && (
              <div className="flex flex-col gap-3">
                <p className="text-pixel-sm text-linen/85">
                  {picked.correct ? "That is it. " : "Not quite. "}
                  {question.explanation}
                </p>

                {/* The passage that settles it — shown on a wrong answer, which is
                    the whole point: the miss is what opens the text. */}
                {!picked.correct && <Passage refs={[question.teaches]} />}

                <button
                  type="button"
                  onClick={advance}
                  className="text-pixel w-fit border-2 border-terracotta bg-terracotta px-6 py-2 uppercase tracking-widest text-linen transition-opacity hover:opacity-90"
                >
                  {picked.correct ? "Next" : "Try again"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
