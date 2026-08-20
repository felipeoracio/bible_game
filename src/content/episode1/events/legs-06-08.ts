import { invented, recorded, reasoned, ref, type GameEvent } from "../../types";

/**
 * Legs 6 to 8 — Marah to Elim, Elim to the Red Sea, and on to the wilderness of Sin.
 *
 * Three legs with very different amounts of text behind them, and the game does not
 * pretend otherwise:
 *
 *   - **Elim** gets one recorded detail and it is a generous one — twelve springs
 *     and seventy palm trees.
 *   - **The Red Sea camp** gets a single line in Numbers 33 and nothing else at all.
 *     That leg is deliberately almost entirely invented household life, and its
 *     Codex entry says so outright.
 *   - **The wilderness of Sin** gets a date, a complaint, and the beginning of the
 *     manna, which is the largest mechanical event in the episode.
 */
export const legs0608Events: GameEvent[] = [
  // --- Leg 6: Marah to Elim --------------------------------------------------
  {
    id: "word-from-the-pool",
    title: "A statute and an ordinance",
    body: "The water is sweet and everyone has drunk and the camp is a different camp. Then word comes round that something was said at the pool afterwards — a statute, a testing. If you listen to his voice and do what is right in his eyes, the diseases of Egypt will not come on you.",
    provenance: recorded(ref("exodus", 15, "25"), ref("exodus", 15, "26")),
    choices: [
      {
        id: "repeat-it-to-them",
        label: "Repeat it to your household until they have it",
        provenance: invented(),
        outcome:
          "You make them say it back. {elon} has it word-perfect by the second attempt and {milcah} has most of it and an improvement of her own.",
        effects: { morale: 4, trust: 5 },
      },
      {
        id: "think-about-it",
        label: "Turn it over privately",
        provenance: invented(),
        outcome:
          "You notice it came immediately after the water, not before it. The water was not payment for anything. You are still working out what to do with that.",
        effects: { trust: 6 },
      },
    ],
    unlocks: ["the-statute-at-marah"],
  },
  {
    id: "twelve-springs-and-seventy-palms",
    title: "Elim",
    body: "You can smell it before you see it. Twelve springs and seventy palm trees, and after Marah the arithmetic of that is almost offensive — twelve, for a nation, and yet there is enough. The column stops here and does not want to start again.",
    provenance: recorded(ref("exodus", 15, "27"), ref("numbers", 33, "9")),
    choices: [
      {
        id: "fill-everything-elim",
        label: "Fill every skin you own and then some",
        provenance: invented(),
        outcome:
          "You fill, and then you go and find something else that will hold water and fill that too. Nobody who has just had three dry days needs telling twice.",
        effects: { condition: -4 },
        provisions: { water: 999, waterCapacity: 10 },
      },
      {
        id: "rest-at-elim",
        label: "Sit down under the palms and do nothing at all",
        provenance: invented(),
        outcome:
          "You do nothing, for a whole afternoon, in shade, near water. It is the first time since Rameses that nobody in your household is carrying anything.",
        effects: { condition: 14, morale: 10 },
        provisions: { water: 999 },
      },
    ],
    unlocks: ["elim"],
  },

  // --- Leg 7: Elim to the Red Sea --------------------------------------------
  {
    id: "the-quiet-leg",
    title: "A day with nothing in it",
    body: "Nothing happens. You walk from water toward water along a coast, and the most interesting thing all day is a bird nobody can name. After the fortnight you have had, a day with nothing in it is not nothing.",
    provenance: reasoned(
      "Numbers 33:10 records that they travelled from Elim and camped by the Red Sea, and says nothing else whatever about it. An uneventful stage is the honest reading of that silence.",
      ref("numbers", 33, "10"),
    ),
    choices: [
      {
        id: "teach-them-something",
        label: "Spend it teaching the children something",
        provenance: invented(),
        outcome:
          "You teach {elon} to walk a straight line by a fixed point on the horizon, which is a brickmaker's trick and useless out here, and he is delighted with it.",
        effects: { morale: 6, trust: 4 },
      },
      {
        id: "make-ground",
        label: "Spend it making up ground",
        provenance: invented(),
        outcome:
          "You use an easy day to get back in among the column, which is the correct use for an easy day and not a popular one.",
        effects: { condition: -7, morale: -3 },
      },
      {
        id: "just-walk",
        label: "Just walk",
        provenance: invented(),
        outcome:
          "You walk. Nobody talks much. It is the most rested any of you have been since the brickfields, and it came from a day that contained nothing at all.",
        effects: { condition: 6, morale: 4 },
      },
    ],
    unlocks: ["the-red-sea-camp"],
  },
  {
    id: "counting-the-days",
    title: "{tirzah} has been counting",
    body: "She has been keeping the days on a strip of cloth since the night you left, a mark for each one, and she shows it to you without saying anything. It is a surprisingly small number of marks.",
    provenance: reasoned(
      "Exodus 16:1 dates the arrival in the wilderness of Sin to the fifteenth day of the second month, so the account is keeping count; a household keeping its own tally is invented.",
      ref("exodus", 16, "1"),
    ),
    choices: [
      {
        id: "count-them-together",
        label: "Count them with her",
        provenance: invented(),
        outcome:
          "A month, near enough. It feels like considerably longer and it also feels like it happened in an afternoon, and both of those are true at once.",
        effects: { morale: 5, trust: 3 },
      },
      {
        id: "tell-her-to-stop",
        label: "Tell her counting will not help",
        provenance: invented(),
        outcome:
          "She folds the cloth up and puts it away. She does not stop counting. She just stops showing you.",
        effects: { trust: -6 },
      },
    ],
  },

  // --- Leg 8: the Red Sea to the wilderness of Sin ----------------------------
  {
    id: "the-flesh-pots-of-egypt",
    title: "The meat pots",
    body: "It starts near the front and comes down the column like weather. Better to have died in Egypt by God's own hand, sitting by the meat pots, eating bread until we had had enough — better that than to be brought out here to kill the whole assembly with hunger. By the time it reaches your part of the line, people are saying it as though it is simply true.",
    provenance: recorded(ref("exodus", 16, "2-3")),
    choices: [
      {
        id: "join-the-complaint",
        label: "Say it too",
        provenance: invented(),
        outcome:
          "You hear your own voice saying it and you are not sure you believe it. It is a relief to say. It costs you something with the four people listening.",
        effects: { morale: 6, trust: -8 },
      },
      {
        id: "contradict-it",
        label: "Say out loud that it is not true",
        provenance: invented(),
        outcome:
          "You point out that you had straw quotas and dead sons and no meat pots worth the name. Nobody thanks you for the correction. {tirzah} takes your arm.",
        effects: { morale: -4, trust: 8 },
      },
      {
        id: "stay-out-of-it",
        label: "Keep out of it and keep walking",
        provenance: invented(),
        outcome:
          "You let it go past you like weather, which is what it is, and you get your household another four kilometres down the road while it is raining.",
        effects: { condition: -3, morale: -2, trust: 2 },
      },
    ],
    unlocks: ["the-murmuring"],
  },
  {
    id: "bread-from-the-sky",
    title: "A day's portion, every day",
    body: "The answer comes back down the column and it is stranger than the complaint. Bread will be rained from the sky. The people are to go out and gather a day's portion every day — and that is stated as the test. Not the hunger. The gathering.",
    provenance: recorded(ref("exodus", 16, "4-5")),
    choices: [
      {
        id: "ask-what-the-test-is",
        label: "Ask what there is to fail about picking food up",
        provenance: invented(),
        outcome:
          "Nobody has a good answer for you yet. You will find out in about a week, along with everybody else, and you will not enjoy the answer.",
        effects: { morale: 3 },
      },
      {
        id: "take-it-at-face-value",
        label: "Take it exactly as given: a day's worth, daily",
        provenance: invented(),
        outcome:
          "A day's portion every day. You repeat it to your household twice so that nobody can later say they were unclear on it.",
        effects: { trust: 6 },
      },
    ],
    unlocks: ["a-days-portion"],
  },

  // --- Pool: ordinary life ---------------------------------------------------
  {
    id: "the-sandal-that-will-not-last",
    title: "{eliab}'s sandal",
    body: "The strap has been mended twice and the sole is going at the ball of the foot, and there is nowhere between here and Sinai to get another one.",
    provenance: invented(),
    choices: [
      {
        id: "mend-it-again",
        label: "Mend it again",
        provenance: invented(),
        outcome:
          "You mend it again, worse than last time, out of a strip of something that was recently a bag. It will hold for a while.",
        effects: { condition: -3, morale: 2 },
      },
      {
        id: "walk-barefoot",
        label: "Go barefoot and save it",
        provenance: invented(),
        outcome:
          "You carry the sandals and walk on the stone, and by evening you have a very clear opinion about that decision.",
        effects: { condition: -8, morale: -3 },
      },
    ],
  },
  {
    id: "a-child-asks-where-you-are-going",
    title: "{milcah} asks where you are going",
    body: "Not in a complaining way. She genuinely wants to know the name of the place, so that she can think about it while she walks, and you realise you have no idea what to tell her.",
    provenance: invented(),
    choices: [
      {
        id: "say-a-mountain",
        label: "Tell her there is a mountain",
        provenance: invented(),
        outcome:
          "It is the truth as far as you have it. She spends the rest of the afternoon looking at the horizon for it, and asks you twice whether that one is it.",
        effects: { morale: 5, trust: 3 },
      },
      {
        id: "admit-you-dont-know",
        label: "Tell her you do not know",
        provenance: invented(),
        outcome:
          "She takes this extremely well, which somehow makes it worse, and then holds your hand for the next hour without being asked.",
        effects: { trust: 5, morale: -2 },
      },
    ],
  },
];
