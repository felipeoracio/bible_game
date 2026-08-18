import { describe, expect, it } from "vitest";
import {
  accuracy,
  emptyQuizProgress,
  firstTryCount,
  isQuizComplete,
  recordAnswer,
  type QuizProgress,
} from "./quiz";

const answer = (progress: QuizProgress, id: string, correct: boolean) =>
  recordAnswer(progress, id, correct);

describe("recording answers", () => {
  it("counts a question known first time", () => {
    const p = answer(emptyQuizProgress, "q1", true);
    expect(p.correct).toEqual(["q1"]);
    expect(p.attempts.q1).toBe(1);
    expect(firstTryCount(p)).toBe(1);
  });

  it("counts the tries when the player has to look it up", () => {
    let p = answer(emptyQuizProgress, "q1", false);
    expect(p.correct).toEqual([]);
    p = answer(p, "q1", true);
    expect(p.correct).toEqual(["q1"]);
    expect(p.attempts.q1).toBe(2);
    expect(firstTryCount(p)).toBe(0);
  });

  /** A retry must never take anything away — it just stops counting as known. */
  it("does not punish a wrong answer beyond the score", () => {
    let p = emptyQuizProgress;
    for (let i = 0; i < 5; i++) p = answer(p, "q1", false);
    expect(p.attempts.q1).toBe(5);
    expect(p.correct).toEqual([]);
    expect(accuracy(p)).toBeUndefined();
  });

  it("stops taking answers once a question is settled", () => {
    const settled = answer(emptyQuizProgress, "q1", true);
    const poked = answer(settled, "q1", false);
    expect(poked).toBe(settled);
    expect(firstTryCount(poked)).toBe(1);
  });
});

describe("accuracy", () => {
  it("is undefined before anything has been answered", () => {
    expect(accuracy(emptyQuizProgress)).toBeUndefined();
  });

  it("is the share of questions known without being shown the verse", () => {
    let p = answer(emptyQuizProgress, "q1", true);
    p = answer(p, "q2", false);
    p = answer(p, "q2", true);
    p = answer(p, "q3", true);
    p = answer(p, "q4", true);
    // Three of four known first time.
    expect(accuracy(p)).toBe(0.75);
  });

  it("is zero when every answer needed the verse first", () => {
    let p = answer(emptyQuizProgress, "q1", false);
    p = answer(p, "q1", true);
    expect(accuracy(p)).toBe(0);
  });

  it("runs across quizzes, not just one", () => {
    let p = answer(emptyQuizProgress, "leg1-q1", true);
    p = answer(p, "leg2-q1", true);
    expect(accuracy(p)).toBe(1);
  });
});

describe("completion", () => {
  const questions = ["q1", "q2"];

  it("needs every question answered correctly", () => {
    let p = answer(emptyQuizProgress, "q1", true);
    expect(isQuizComplete(p, questions)).toBe(false);
    p = answer(p, "q2", true);
    expect(isQuizComplete(p, questions)).toBe(true);
  });

  it("is not satisfied by wrong answers alone", () => {
    let p = answer(emptyQuizProgress, "q1", false);
    p = answer(p, "q2", false);
    expect(isQuizComplete(p, questions)).toBe(false);
  });
});
