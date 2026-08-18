/**
 * Checkpoint scoring.
 *
 * The design doc is emphatic that a wrong answer must not punish (§6.2): it opens
 * the passage and lets the player try again. So "score" cannot mean lives or points
 * lost. What it means here is **first-try accuracy** — of the questions you have
 * answered, how many you knew without being shown the verse.
 *
 * That is the only number worth surfacing at the end as a real, earned result. It
 * goes up only by knowing something, and retrying costs nothing except that this
 * question no longer counts as known.
 */

export interface QuizProgress {
  /** Attempts made per question. 1 means right first time. */
  attempts: Record<string, number>;
  /** Questions eventually answered correctly. */
  correct: string[];
}

export const emptyQuizProgress: QuizProgress = { attempts: {}, correct: [] };

export function recordAnswer(
  progress: QuizProgress,
  questionId: string,
  wasCorrect: boolean,
): QuizProgress {
  // Once a question is settled it stops taking answers, so a player cannot lower
  // their own score by poking at a question they have already got right.
  if (progress.correct.includes(questionId)) return progress;

  const attempts = {
    ...progress.attempts,
    [questionId]: (progress.attempts[questionId] ?? 0) + 1,
  };

  return {
    attempts,
    correct: wasCorrect ? [...progress.correct, questionId] : progress.correct,
  };
}

/** Questions known without being shown the verse. */
export function firstTryCount(progress: QuizProgress): number {
  return progress.correct.filter((id) => progress.attempts[id] === 1).length;
}

/**
 * 0 to 1 across every question answered so far, or undefined before any have been.
 * Undefined rather than zero, because "no score yet" and "got everything wrong"
 * are very different things to show a player.
 */
export function accuracy(progress: QuizProgress): number | undefined {
  if (progress.correct.length === 0) return undefined;
  return firstTryCount(progress) / progress.correct.length;
}

/** True once every question in the given set has been answered correctly. */
export function isQuizComplete(progress: QuizProgress, questionIds: string[]): boolean {
  return questionIds.every((id) => progress.correct.includes(id));
}
