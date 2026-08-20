import { ref, type Quiz } from "../../types";

/** Checkpoints for legs 5 to 8 — the far shore to the wilderness of Sin. */

export const leg05Quiz: Quiz = {
  id: "quiz-leg-05",
  legId: "leg-05-marah",
  questions: [
    {
      id: "q-how-long-without-water",
      prompt: "How long did Israel go without finding water after the crossing?",
      options: [
        { id: "three", label: "Three days", correct: true },
        { id: "one", label: "One day", correct: false },
        { id: "seven", label: "Seven days", correct: false },
        { id: "forty", label: "Forty days", correct: false },
      ],
      teaches: ref("exodus", 15, "22"),
      explanation:
        "They went three days in the wilderness of Shur and found no water. The song on the far shore and those three days are four verses apart in the same chapter.",
    },
    {
      id: "q-why-marah",
      prompt: "Why is the place called Marah?",
      options: [
        { id: "bitter", label: "Because the water there was bitter", correct: true },
        { id: "person", label: "It was named after a woman who died there", correct: false },
        { id: "battle", label: "A battle was fought there", correct: false },
      ],
      teaches: ref("exodus", 15, "23"),
      explanation:
        "When they came to Marah they could not drink the water, because it was bitter — and the account says the place was named for exactly that.",
    },
    {
      id: "q-who-fixed-the-water",
      prompt: "How did the water at Marah become drinkable?",
      options: [
        {
          id: "tree",
          label: "Moses was shown a tree and threw it into the water",
          correct: true,
        },
        { id: "dug", label: "They dug a deeper well beside the pool", correct: false },
        { id: "boiled", label: "They boiled it", correct: false },
        { id: "rain", label: "It rained overnight", correct: false },
      ],
      teaches: ref("exodus", 15, "25"),
      explanation:
        "The people complained, Moses cried out, and God showed him a tree; he threw it into the waters and they were made sweet. Nobody solved this by working harder at it, which is why the game would not let you either.",
    },
  ],
};

export const leg06Quiz: Quiz = {
  id: "quiz-leg-06",
  legId: "leg-06-elim",
  questions: [
    {
      id: "q-elim-numbers",
      prompt: "What was at Elim?",
      options: [
        { id: "twelve-seventy", label: "Twelve springs and seventy palm trees", correct: true },
        { id: "seventy-twelve", label: "Seventy springs and twelve palm trees", correct: false },
        { id: "one-spring", label: "A single spring", correct: false },
      ],
      teaches: ref("exodus", 15, "27"),
      explanation:
        "Twelve springs of water and seventy palm trees — and both Exodus and Numbers 33 give the same two numbers, which the itinerary rarely bothers to do.",
    },
    {
      id: "q-order-at-marah",
      prompt: "At Marah, did the statute come before the water was made sweet, or after?",
      options: [
        { id: "after", label: "After — the water came first", correct: true },
        { id: "before", label: "Before, as a condition of receiving it", correct: false },
        { id: "same", label: "They were given at the same moment", correct: false },
      ],
      teaches: ref("exodus", 15, "25"),
      explanation:
        "The tree goes into the water and it is made sweet, and then a statute and an ordinance are set down. The water was not payment for keeping anything, because there was nothing to keep yet.",
    },
  ],
};

export const leg07Quiz: Quiz = {
  id: "quiz-leg-07",
  legId: "leg-07-red-sea",
  questions: [
    {
      id: "q-red-sea-camp",
      prompt: "What does the Bible record about the camp by the Red Sea?",
      options: [
        {
          id: "one-line",
          label: "Only that they travelled from Elim and camped there",
          correct: true,
        },
        { id: "battle", label: "That they were attacked there", correct: false },
        { id: "water-miracle", label: "That water was given there", correct: false },
        { id: "law", label: "That the law was given there", correct: false },
      ],
      teaches: ref("numbers", 33, "10"),
      explanation:
        "One line, and nothing else anywhere. Most of the stages in Numbers 33 are like this. Everything your household did on that leg is invented, because there is nothing recorded to build it out of — and the game says so on the entry.",
    },
    {
      id: "q-distances-again",
      prompt: "Where do this game's distances between camps come from?",
      options: [
        {
          id: "reasoned",
          label: "They are estimates — the route gives times in places, but never distances",
          correct: true,
        },
        { id: "numbers", label: "Numbers 33 lists them", correct: false },
        { id: "exodus", label: "Exodus lists them", correct: false },
      ],
      teaches: ref("exodus", 15, "22"),
      explanation:
        "The route gives two measures of time — three days' journey in Shur, and a date one month out — and no distance anywhere. Every kilometre figure in this game is reasoned from those and labelled that way.",
    },
  ],
};

export const leg08Quiz: Quiz = {
  id: "quiz-leg-08",
  legId: "leg-08-wilderness-of-sin",
  questions: [
    {
      id: "q-how-long-out",
      prompt: "How long had Israel been out of Egypt when they reached the wilderness of Sin?",
      options: [
        { id: "month", label: "About a month — the fifteenth day of the second month", correct: true },
        { id: "week", label: "About a week", correct: false },
        { id: "year", label: "About a year", correct: false },
      ],
      teaches: ref("exodus", 16, "1"),
      explanation:
        "The account dates it exactly: the fifteenth day of the second month after they came out of Egypt. It is one of the very few dates given anywhere on the route.",
    },
    {
      id: "q-what-they-said",
      prompt: "What did the people say they missed about Egypt?",
      options: [
        { id: "meat-pots", label: "Sitting by the meat pots and eating bread until they had had enough", correct: true },
        { id: "houses", label: "Their houses", correct: false },
        { id: "temples", label: "The temples", correct: false },
      ],
      teaches: ref("exodus", 16, "3"),
      explanation:
        "They said it would have been better to die in Egypt by God's hand, where they sat by the meat pots and ate their fill. They had been slaves under a straw quota. Hunger had rewritten Egypt into somewhere with enough to eat.",
    },
    {
      id: "q-the-test",
      prompt: "What does the text say the manna was testing?",
      options: [
        {
          id: "gathering",
          label: "Whether they would gather a day's portion each day, as instructed",
          correct: true,
        },
        { id: "hunger", label: "Whether they could endure being hungry", correct: false },
        { id: "sharing", label: "Whether they would share it fairly", correct: false },
      ],
      teaches: ref("exodus", 16, "4"),
      explanation:
        "God says he will rain bread from the sky, and the people shall go out and gather a day's portion every day — that I may test them, whether they will walk in my law or not. The test is the gathering, not the hunger.",
    },
  ],
};
