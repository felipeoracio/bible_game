import { invented, recorded, reasoned, ref, type GameEvent } from "../../types";

/**
 * Legs 9 to 12 — Dophkah, Alush, Rephidim, and Sinai.
 *
 * Dophkah and Alush are the emptiest stages in the itinerary: Numbers 33 gives each
 * of them a name and not one other word, and nothing anywhere else in the Bible
 * mentions either place. Leg 7 met that silence by being quiet. These two meet it
 * differently, and more usefully — **the place is silent but the calendar is not.**
 * Manna began in the wilderness of Sin, so the first sixth day and the first Sabbath
 * fall on these legs. There is plenty recorded happening; it simply is not happening
 * to the ground.
 *
 * Rephidim is the opposite problem. Two recorded crises land on one stage — no water
 * (Numbers 33:14 says so outright, and Exodus 17:1-7 gives the quarrel and the rock)
 * and then Amalek. A leg may hold only one set piece, so Amalek is the set piece and
 * the rock is scripted. See `the-rock-at-horeb` below for how the relief is kept out
 * of the player's hands anyway.
 */
export const legs0912Events: GameEvent[] = [
  // --- Leg 9: the wilderness of Sin to Dophkah -------------------------------
  {
    id: "the-sixth-day",
    title: "Twice as much",
    body: "It is the sixth morning and there is visibly more of it on the ground — you can see it before anyone says anything. The word going round is that this is deliberate, that tomorrow is a solemn rest and nothing will fall on it, and that what is gathered today is meant to keep.",
    provenance: recorded(ref("exodus", 16, "22-23")),
    choices: [
      {
        id: "lay-it-aside",
        label: "Set the second portion aside, as instructed",
        provenance: invented(),
        outcome:
          "You put half of it by and do not touch it, which requires more nerve than you expected given what happened to the last family that kept food overnight.",
        effects: { trust: 6 },
      },
      {
        id: "eat-the-lot",
        label: "Eat well tonight and gather again tomorrow",
        provenance: invented(),
        outcome:
          "You eat properly for the first time in a week and everyone sleeps heavily. Tomorrow is going to be a long day and you have not worked that out yet.",
        effects: { condition: 6, morale: 5, trust: -5 },
      },
    ],
    unlocks: ["the-sabbath-in-the-wilderness"],
  },
  {
    id: "the-seventh-day",
    title: "Some went out anyway",
    body: "There is nothing on the ground. Not less — none. And you can see people out on the flat all the same, walking in wider and wider circles with their baskets, not finding anything, and not stopping.",
    provenance: recorded(ref("exodus", 16, "27")),
    choices: [
      {
        id: "stay-in-camp",
        label: "Keep your household in camp",
        provenance: invented(),
        outcome:
          "You sit down in your own place and do not go out. It is a strange thing to have to decide on purpose, and stranger to watch other people deciding the other way.",
        effects: { morale: 4, trust: 6 },
      },
      {
        id: "go-out-and-look",
        label: "Go out and look anyway",
        provenance: invented(),
        outcome:
          "You walk a long way over open ground and find exactly what you were told you would find, which is nothing at all, and then you walk back.",
        effects: { condition: -8, trust: -4 },
      },
    ],
  },

  // --- Leg 10: Dophkah to Alush ----------------------------------------------
  {
    id: "a-place-with-only-a-name",
    title: "Alush",
    body: "Somebody at the front has a name for where you are going and that is the entire sum of what anybody knows about it. No water mentioned, no landmark, nothing. Just a word, and a direction, and another day of walking toward it.",
    provenance: reasoned(
      "Numbers 33:13 records the stage from Dophkah to Alush and gives no other detail; neither place is mentioned anywhere else in the Bible, so a household knowing nothing but the name is the honest reading.",
      ref("numbers", 33, "13"),
    ),
    choices: [
      {
        id: "make-it-a-game",
        label: "Let the children invent what is there",
        provenance: invented(),
        outcome:
          "By the afternoon {milcah} has decided Alush has a well and a market and a man who sells honey. It does not, and the walk goes faster.",
        effects: { morale: 6 },
      },
      {
        id: "expect-nothing",
        label: "Tell them to expect nothing and be pleased if there is anything",
        provenance: invented(),
        outcome:
          "It is sound advice for a wilderness and it lands like cold water. Nobody is disappointed when you get there, which was the object.",
        effects: { morale: -3, trust: 4 },
      },
    ],
    unlocks: ["alush"],
  },
  {
    id: "the-second-week",
    title: "Into the second week of it",
    body: "The bread is not a miracle any more. It is breakfast. {elon} said this morning that he was tired of it and then looked at you to see whether he was allowed to have said that.",
    provenance: reasoned(
      "Exodus 16:35 says Israel ate the manna for forty years, so it became ordinary long before it stopped; a household's first taste of that is invented.",
      ref("exodus", 16, "35"),
    ),
    choices: [
      {
        id: "let-him-say-it",
        label: "Tell him he is allowed to be tired of it",
        provenance: invented(),
        outcome:
          "You tell him that being fed and being pleased about it are two different things, and that he is permitted both and required only the first.",
        effects: { trust: 6, morale: 3 },
      },
      {
        id: "correct-him",
        label: "Remind him where the alternative was",
        provenance: invented(),
        outcome:
          "You mention the meat pots and what was actually in them. He does not say anything of the sort again, to you, where you can hear it.",
        effects: { trust: -5, morale: -2 },
      },
    ],
  },

  // --- Leg 11: Alush to Rephidim ---------------------------------------------
  {
    id: "no-water-at-rephidim",
    title: "There is no water here",
    body: "Rephidim, and the itinerary itself records the thing everybody finds out within an hour of arriving: there is no water here for the people to drink. The quarrelling starts before the tents are up. Why did you bring us out of Egypt to kill us and our children and our livestock with thirst.",
    provenance: recorded(ref("numbers", 33, "14"), ref("exodus", 17, "1-3")),
    choices: [
      {
        id: "keep-your-household-out-of-it",
        label: "Keep your household away from the quarrelling",
        provenance: invented(),
        outcome:
          "You take them to the edge of the camp and sit them down and do not let them join in. You can hear all of it from there anyway.",
        effects: { morale: -4, trust: 5 },
      },
      {
        id: "say-it-with-them",
        label: "Say it with them",
        provenance: invented(),
        outcome:
          "You have a dry-mouthed child on either side of you and you find you have a great deal to say about it. It is the second time you have done this. You notice that.",
        effects: { morale: 5, trust: -7 },
      },
      {
        id: "go-and-look-for-water",
        label: "Go and look for water yourself",
        provenance: invented(),
        outcome:
          "You search the wadi bed until it is too dark to see and come back with nothing, which is what everyone else came back with.",
        effects: { condition: -9, trust: 3 },
      },
    ],
    unlocks: ["massah-and-meribah"],
  },
  {
    /*
     * The rock. One choice, deliberately.
     *
     * This is Marah's shape again — scarcity resolved entirely outside the player —
     * but Amalek is already this leg's set piece, so it cannot be one too. A single
     * option is how the same guarantee is kept with the ordinary event system:
     * there is nothing to choose, so the water cannot be a reward for choosing well.
     * If a second choice is ever added here, the provisions must move onto both.
     */
    id: "the-rock-at-horeb",
    title: "Water out of the rock",
    body: "He takes the elders and the rod he struck the river with and goes out ahead of the camp, to a rock, and he strikes it. There is no argument about what happens next because the whole camp is running with jars before the shouting has finished.",
    provenance: recorded(ref("exodus", 17, "5-6")),
    choices: [
      {
        id: "drink",
        label: "Drink, and fill everything you own",
        provenance: invented(),
        outcome:
          "{naamah} gets there before you do. You fill every skin twice because the first fill went straight down the four of them, and nobody says anything sensible for about an hour.",
        effects: { morale: 12, trust: 8 },
        provisions: { water: 999 },
      },
    ],
  },

  // --- Leg 12: Rephidim to the wilderness of Sinai ----------------------------
  {
    id: "jethro-arrives",
    title: "Someone has come out to meet them",
    body: "A small party comes in from the east, which is the wrong direction for anybody who has walked what you have walked. It is Moses' father-in-law, and he has brought Moses' wife and his two sons with him, and the camp watches Moses go out and bow to an old man and kiss him.",
    provenance: recorded(ref("exodus", 18, "5"), ref("exodus", 18, "7")),
    choices: [
      {
        id: "watch-the-greeting",
        label: "Watch",
        provenance: invented(),
        outcome:
          "You had not thought of him as a man with a father-in-law. You had not really thought of him as a man with a wife. It rearranges something you had not noticed you were carrying.",
        effects: { morale: 5, trust: 4 },
      },
      {
        id: "get-on-with-it",
        label: "Get on with pitching your tent",
        provenance: invented(),
        outcome:
          "You have a household to house before dark and somebody else's family reunion does not put a roof over it. You are finished before anybody else and you watch the end of it sitting down.",
        effects: { condition: 4, morale: 2 },
      },
    ],
    unlocks: ["jethro-note"],
  },
  {
    id: "the-mountain",
    title: "The mountain",
    body: "You see it a long time before you reach it. There is nothing else out here to give it scale, so it simply gets larger all afternoon, and the column stops talking in stages the way a room does. Israel camps in the wilderness, in front of the mountain.",
    provenance: recorded(ref("exodus", 19, "1-2")),
    choices: [
      {
        id: "look-at-it",
        label: "Stand and look at it",
        provenance: invented(),
        outcome:
          "Three months ago you were counting bricks. You put your bundle down in the sand in front of a mountain and you cannot think of one single thing to say to your household about it.",
        effects: { morale: 10, trust: 6 },
      },
      {
        id: "count-your-household",
        label: "Count your household instead",
        provenance: invented(),
        outcome:
          "You turn away from it and count them, the way you have counted them every night since Rameses, and they are all there. You find that is the part you needed.",
        effects: { morale: 8, trust: 8 },
      },
    ],
    unlocks: ["the-wilderness-of-sinai"],
  },

  // --- Pool: ordinary life ---------------------------------------------------
  {
    id: "the-baskets-wear-out",
    title: "The baskets are going",
    body: "Everything you own has been carried every day for two months and it is beginning to show. The gathering baskets are the worst of it — they were not made for this and they are coming apart at the rim.",
    provenance: invented(),
    choices: [
      {
        id: "reweave-them",
        label: "Sit up and mend them",
        provenance: invented(),
        outcome:
          "You and {tirzah} rebuild two baskets out of three by firelight, badly, and they hold. You are short of sleep for it.",
        effects: { condition: -6, morale: 3, trust: 3 },
      },
      {
        id: "carry-it-in-cloth",
        label: "Use a folded cloth instead",
        provenance: invented(),
        outcome:
          "It works and it is undignified and you drop a portion of it twice on the way back. Nobody starves over it.",
        effects: { morale: -2 },
      },
    ],
  },
  {
    id: "hotep-at-the-mountain",
    title: "Hotep asks whether he belongs here",
    body: "The Egyptian who has walked with your fire since Succoth wants to know whether whatever is about to happen at that mountain is for him as well, or only for Israel, and he asks it as though he has been holding the question for weeks.",
    provenance: reasoned(
      "Exodus 12:38 records that a mixed multitude went up with Israel and says nothing further about them; Hotep and this question are invented.",
      ref("exodus", 12, "38"),
    ),
    choices: [
      {
        id: "say-he-walked-it",
        label: "Tell him he walked every step of it too",
        provenance: invented(),
        outcome:
          "You point out that he was at the sea and at Marah and at the rock, same as you, and that you are not the person who decides. He seems to find the last part more comforting than the first.",
        effects: { morale: 4, trust: 5 },
      },
      {
        id: "admit-you-dont-know-hotep",
        label: "Tell him you genuinely do not know",
        provenance: invented(),
        outcome:
          "It is the truth. He nods, and stays at your fire, and that is the whole of the answer either of you gets tonight.",
        effects: { trust: 4 },
      },
    ],
  },
];
