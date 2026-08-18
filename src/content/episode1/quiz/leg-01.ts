import { ref, type Quiz } from "../../types";

/**
 * Leg 1 checkpoint.
 *
 * Not trivia. Each question is about what just happened and what the text said,
 * and a wrong answer opens the passage rather than taking anything away. The last
 * question is deliberately about the difference between what is recorded and what
 * the game has reasoned — the players who remember that are the point of this.
 */
export const leg01Quiz: Quiz = {
  id: "quiz-leg-01",
  legId: "leg-01-rameses-succoth",
  questions: [
    {
      id: "q-first-camp",
      prompt: "Israel set out from Rameses. Where did they camp first?",
      options: [
        { id: "succoth", label: "Succoth", correct: true },
        { id: "etham", label: "Etham", correct: false },
        { id: "marah", label: "Marah", correct: false },
        { id: "elim", label: "Elim", correct: false },
      ],
      teaches: ref("numbers", 33, "5"),
      explanation:
        "Numbers 33 walks the whole route camp by camp. Succoth is the first one. Etham is next, and Marah and Elim come later, after the sea.",
    },
    {
      id: "q-why-flat-bread",
      prompt: "Why was the bread they carried out of Egypt flat?",
      options: [
        {
          id: "no-time",
          label: "They left in such a hurry the dough had no time to rise",
          correct: true,
        },
        { id: "commanded-forever", label: "Flat bread was all they knew how to bake", correct: false },
        { id: "no-flour", label: "They had run out of flour", correct: false },
      ],
      teaches: ref("exodus", 12, "39"),
      explanation:
        "The text explains it plainly: they were thrust out of Egypt and could not wait, and they had prepared no food for themselves. They carried the dough unrisen, in troughs on their shoulders.",
    },
    {
      id: "q-who-else-went",
      prompt: "Israel did not walk out of Egypt alone. Who else went up with them?",
      options: [
        { id: "mixed-multitude", label: "A mixed multitude, with flocks and herds", correct: true },
        { id: "nobody", label: "No one — only the children of Israel left", correct: false },
        { id: "egyptian-guards", label: "A guard of Egyptian soldiers, sent to escort them", correct: false },
      ],
      teaches: ref("exodus", 12, "38"),
      explanation:
        "One line records it: a mixed multitude went up also with them. The text does not say who they were — so the people you meet from that crowd in this game are invented, and labelled that way.",
    },
    {
      id: "q-distance-recorded",
      prompt:
        "Numbers 33 names the camps in order. Does it also record how far apart they were?",
      options: [
        { id: "no", label: "No — it names the camps, but not the distances", correct: true },
        { id: "yes-all", label: "Yes, it gives the distance for every stage", correct: false },
        { id: "yes-some", label: "Yes, but only for the stages before the sea", correct: false },
      ],
      teaches: ref("numbers", 33, "1-2"),
      explanation:
        "It is a list of stages, not a measured map. Every distance you walk in this game is our estimate from where the places are thought to have been — which is why the game labels it reasoned rather than recorded.",
    },
  ],
};
