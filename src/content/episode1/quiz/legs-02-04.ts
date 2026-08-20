import { ref, type Quiz } from "../../types";

/**
 * Checkpoints for legs 2 to 4.
 *
 * Same rule as Leg 1: never trivia, always about what the player has just walked
 * through, and a wrong answer opens the passage instead of taking something away.
 * Each quiz keeps one question that turns on the difference between what the text
 * records and what the game has reasoned.
 */

export const leg02Quiz: Quiz = {
  id: "quiz-leg-02",
  legId: "leg-02-succoth-etham",
  questions: [
    {
      id: "q-why-the-long-way",
      prompt: "There was a quicker road to Canaan. Why did Israel not take it?",
      options: [
        {
          id: "war",
          label: "It led through Philistine country, and seeing war might have sent them back to Egypt",
          correct: true,
        },
        { id: "flooded", label: "It was flooded at that time of year", correct: false },
        { id: "too-narrow", label: "It was too narrow for that many people", correct: false },
        { id: "no-water", label: "There was no water on it", correct: false },
      ],
      teaches: ref("exodus", 13, "17"),
      explanation:
        "The text gives the reason directly, which it does not often do: God did not lead them by the way of the land of the Philistines, although that was near, in case the people changed their minds when they saw war and returned to Egypt.",
    },
    {
      id: "q-josephs-bones",
      prompt: "Whose bones did Moses carry out of Egypt?",
      options: [
        { id: "joseph", label: "Joseph's", correct: true },
        { id: "jacob", label: "Jacob's", correct: false },
        { id: "levi", label: "Levi's", correct: false },
      ],
      teaches: ref("exodus", 13, "19"),
      explanation:
        "Joseph made the children of Israel swear to it long before: God will surely visit you, and you shall carry up my bones from here. Moses took them with him.",
    },
    {
      id: "q-pillar",
      prompt: "What went in front of the column, and when?",
      options: [
        {
          id: "both",
          label: "A pillar of cloud by day and a pillar of fire by night",
          correct: true,
        },
        { id: "cloud-only", label: "A pillar of cloud, only in daylight", correct: false },
        { id: "fire-only", label: "A pillar of fire, only after dark", correct: false },
      ],
      teaches: ref("exodus", 13, "21"),
      explanation:
        "Both, so that they could travel by day and by night. The account adds that neither one departed from before the people — it stayed with them for the whole wilderness, not just this leg.",
    },
  ],
};

export const leg03Quiz: Quiz = {
  id: "quiz-leg-03",
  legId: "leg-03-etham-pi-hahiroth",
  questions: [
    {
      id: "q-turn-back",
      prompt: "At Etham the column was told to turn back and camp by the sea. Why?",
      options: [
        {
          id: "bait",
          label: "So Pharaoh would think they were trapped and come after them",
          correct: true,
        },
        { id: "water", label: "Because there was no water ahead", correct: false },
        { id: "lost", label: "Because Moses had taken a wrong turn", correct: false },
        { id: "rest", label: "So the people could rest by the water", correct: false },
      ],
      teaches: ref("exodus", 14, "3-4"),
      explanation:
        "Exodus says Pharaoh would look at their position and say they were entangled in the land, shut in by the wilderness — and that he would follow them. The camp was bait, and the people camping in it were not told.",
    },
    {
      id: "q-chariots",
      prompt: "How many chosen chariots did Pharaoh take after Israel?",
      options: [
        { id: "600", label: "Six hundred", correct: true },
        { id: "60", label: "Sixty", correct: false },
        { id: "6000", label: "Six thousand", correct: false },
      ],
      teaches: ref("exodus", 14, "7"),
      explanation:
        "Six hundred chosen chariots, and all the other chariots of Egypt besides, with captains over all of them.",
    },
    {
      id: "q-recorded-or-reasoned-camps",
      prompt: "The game says Etham to Pi-hahiroth is a particular number of kilometres. Where does that number come from?",
      options: [
        {
          id: "reasoned",
          label: "It is the game's estimate — the text names the camps but gives no distances",
          correct: true,
        },
        { id: "numbers", label: "Numbers 33 lists the distance between each camp", correct: false },
        { id: "exodus", label: "Exodus gives it in days of travel", correct: false },
      ],
      teaches: ref("numbers", 33, "7"),
      explanation:
        "Numbers 33 is a list of camps in order and nothing else — no distances anywhere in it. Every leg length in this game is reasoned from proposed locations and a day's march, and is labelled that way.",
    },
  ],
};

export const leg04Quiz: Quiz = {
  id: "quiz-leg-04",
  legId: "leg-04-the-crossing",
  questions: [
    {
      id: "q-how-the-sea-opened",
      prompt: "How does the account say the sea was driven back?",
      options: [
        { id: "east-wind", label: "By a strong east wind, blowing all night", correct: true },
        { id: "instantly", label: "Instantly, the moment Moses lifted his rod", correct: false },
        { id: "tide", label: "By an unusually low tide", correct: false },
      ],
      teaches: ref("exodus", 14, "21"),
      explanation:
        "Moses stretched out his hand over the sea, and God caused it to go back by a strong east wind all night, and made the sea dry land. The wind and the whole night are both in the verse.",
    },
    {
      id: "q-walls",
      prompt: "What does the text say the water did while Israel crossed?",
      options: [
        {
          id: "walls",
          label: "It stood as a wall on their right hand and on their left",
          correct: true,
        },
        { id: "shallow", label: "It became shallow enough to wade", correct: false },
        { id: "froze", label: "It froze over", correct: false },
      ],
      teaches: ref("exodus", 14, "22"),
      explanation:
        "The children of Israel went into the middle of the sea on dry ground, and the waters were a wall to them on their right hand and on their left. The account repeats the same phrase again at verse 29.",
    },
    {
      id: "q-who-crossed",
      prompt: "In this game, could your household have failed to cross?",
      options: [
        {
          id: "no",
          label: "No — the text says Israel crossed, so your choices change how it went, not whether",
          correct: true,
        },
        { id: "yes-drowned", label: "Yes, if you chose badly enough", correct: false },
        { id: "yes-left", label: "Yes, you could have turned back to Egypt", correct: false },
      ],
      teaches: ref("exodus", 14, "29"),
      explanation:
        "This is the rule the whole game is built on. Your household is invented, so its decisions are real; the crossing is recorded, so it happens. At the sea you choose when to go in and who you carry, and Israel walks through on dry ground either way.",
    },
  ],
};
