import { ref, type Quiz } from "../../types";

/** Checkpoints for legs 9 to 12 — Dophkah to the mountain. */

export const leg09Quiz: Quiz = {
  id: "quiz-leg-09",
  legId: "leg-09-dophkah",
  questions: [
    {
      id: "q-sixth-day",
      prompt: "What was different about the manna on the sixth day?",
      options: [
        { id: "double", label: "Twice as much fell, and it kept overnight", correct: true },
        { id: "none", label: "None fell", correct: false },
        { id: "sweeter", label: "It tasted different", correct: false },
      ],
      teaches: ref("exodus", 16, "22"),
      explanation:
        "Twice as much, two omers each — and laid up until the morning it did not become foul and had no worms in it, which is the opposite of what happened on every other night.",
    },
    {
      id: "q-seventh-day",
      prompt: "What happened to the people who went out to gather on the seventh day?",
      options: [
        { id: "found-none", label: "They found none", correct: true },
        { id: "found-double", label: "They found twice as much", correct: false },
        { id: "punished", label: "They were struck down", correct: false },
      ],
      teaches: ref("exodus", 16, "27"),
      explanation:
        "On the seventh day some of the people went out to gather, and they found none. The account records the attempt as well as the result.",
    },
  ],
};

export const leg10Quiz: Quiz = {
  id: "quiz-leg-10",
  legId: "leg-10-alush",
  questions: [
    {
      id: "q-dophkah-alush",
      prompt: "What does the Bible tell us about Dophkah and Alush?",
      options: [
        { id: "names-only", label: "Only that Israel camped at each — nothing else, anywhere", correct: true },
        { id: "water", label: "That there was water at both", correct: false },
        { id: "battle", label: "That a battle was fought at Alush", correct: false },
        { id: "law", label: "That laws were given at Dophkah", correct: false },
      ],
      teaches: ref("numbers", 33, "13"),
      explanation:
        "Two names in a list and not one other word. Neither place is mentioned anywhere else in the Bible and nobody knows where they were — and people still walked those stages.",
    },
    {
      id: "q-manna-how-long",
      prompt: "How long did Israel eat the manna?",
      options: [
        { id: "forty-years", label: "Forty years", correct: true },
        { id: "forty-days", label: "Forty days", correct: false },
        { id: "to-sinai", label: "Until they reached Sinai", correct: false },
      ],
      teaches: ref("exodus", 16, "35"),
      explanation:
        "Forty years, until they came to a land that was inhabited. Which means that long before it stopped, it had become ordinary — breakfast rather than a wonder.",
    },
  ],
};

export const leg11Quiz: Quiz = {
  id: "quiz-leg-11",
  legId: "leg-11-rephidim",
  questions: [
    {
      id: "q-rephidim-water",
      prompt: "What does Numbers 33 add about Rephidim, beyond its name?",
      options: [
        { id: "no-water", label: "That there was no water there for the people to drink", correct: true },
        { id: "amalek", label: "That Amalek attacked there", correct: false },
        { id: "twelve-springs", label: "That it had twelve springs", correct: false },
      ],
      teaches: ref("numbers", 33, "14"),
      explanation:
        "The itinerary usually just names a camp. Here it says why the camp mattered: Rephidim, where there was no water for the people to drink.",
    },
    {
      id: "q-the-rock",
      prompt: "Where did the water at Rephidim come from?",
      options: [
        { id: "rock", label: "Moses struck a rock at Horeb and water came out of it", correct: true },
        { id: "well", label: "They dug a well", correct: false },
        { id: "spring", label: "A scout found a spring", correct: false },
      ],
      teaches: ref("exodus", 17, "6"),
      explanation:
        "He took the elders and the rod he had struck the river with, and struck the rock in Horeb, and water came out for the people to drink. As at Marah, nobody in the camp solved it.",
    },
    {
      id: "q-amalek-who-was-struck",
      prompt: "Deuteronomy remembers who Amalek attacked. Who was it?",
      options: [
        {
          id: "rearmost",
          label: "The ones at the back — the feeble and the worn out",
          correct: true,
        },
        { id: "front", label: "The front of the column, where Moses was", correct: false },
        { id: "camp", label: "The camp at night", correct: false },
      ],
      teaches: ref("deuteronomy", 25, "18"),
      explanation:
        "He met you by the way and struck the rearmost of you, all who were feeble behind you, when you were faint and weary. That verse is why this game has been keeping track of where your household walks.",
    },
  ],
};

export const leg12Quiz: Quiz = {
  id: "quiz-leg-12",
  legId: "leg-12-sinai",
  questions: [
    {
      id: "q-jethro-advice",
      prompt: "What did Jethro tell Moses to do?",
      options: [
        {
          id: "appoint",
          label: "Appoint able men over thousands, hundreds, fifties and tens to judge the people",
          correct: true,
        },
        { id: "rest", label: "Take a day off each week", correct: false },
        { id: "go-back", label: "Send the people back to Egypt", correct: false },
      ],
      teaches: ref("exodus", 18, "21"),
      explanation:
        "Jethro told him plainly that judging the whole nation alone was not good and that he would wear away. Moses listened to his father-in-law and did everything he said.",
    },
    {
      id: "q-when-sinai",
      prompt: "When did Israel come into the wilderness of Sinai?",
      options: [
        { id: "third-month", label: "In the third month after leaving Egypt", correct: true },
        { id: "first-month", label: "In the first month", correct: false },
        { id: "second-year", label: "In the second year", correct: false },
      ],
      teaches: ref("exodus", 19, "1"),
      explanation:
        "In the third month after the children of Israel had gone out of Egypt, on that same day, they came into the wilderness of Sinai — and camped there before the mountain.",
    },
    {
      id: "q-what-was-ours",
      prompt: "Across this whole journey, which of these came from the game rather than the text?",
      options: [
        {
          id: "distances",
          label: "The distances between camps, and how many days each stage took",
          correct: true,
        },
        { id: "camp-names", label: "The names and order of the camps", correct: false },
        { id: "the-rock", label: "The water from the rock at Rephidim", correct: false },
        { id: "manna-rules", label: "The rules about gathering manna", correct: false },
      ],
      teaches: ref("numbers", 33, "5-15"),
      explanation:
        "Numbers 33 lists the camps in order and gives no distances and no durations at all. The names, the order, the manna rules and the rock are recorded. Every kilometre and every day counter in this game is ours, and has been labelled that way the whole way along.",
    },
  ],
};
