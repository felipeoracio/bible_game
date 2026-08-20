import { invented, recorded, reasoned, ref, type Judge, type SetPiece } from "../types";

/**
 * The four set pieces (§5.7).
 *
 * Each one has a different verb, and the difference is the point:
 *
 *   - **The crossing** — go forward. The one thing the household is told to do is
 *     the one thing every instinct says not to.
 *   - **Marah** — endure. Nothing the player picks changes bitter water into sweet.
 *   - **Rephidim** — hold on, and watch. The battle turns on a hill you can see and
 *     cannot reach.
 *   - **Jethro** — be placed. The quietest of the four, and the only one that ends
 *     with a named person attached to your household for good.
 *
 * Every phase below is written so that its choices say what *your family* did.
 * None of them say what the event did — that is the `outcome`, it is `recorded`,
 * and the content model gives no route from a choice to it.
 *
 * These are reached from legs 4, 5, 11 and 12, which F14 authors.
 */

export const judges: Judge[] = [
  {
    id: "shelumiel-of-the-tens",
    name: "Shelumiel",
    description:
      "A ruler of ten. Slow to speak, and writes down every complaint before he answers it.",
    provenance: invented(),
  },
  {
    id: "ahira-of-the-tens",
    name: "Ahira",
    description:
      "A ruler of ten. Was a foreman in Egypt and has not entirely stopped talking like one.",
    provenance: invented(),
  },
  {
    id: "hodiah-of-the-tens",
    name: "Hodiah",
    description:
      "A ruler of ten. Young for it, and painfully careful because of that.",
    provenance: invented(),
  },
];

const crossing: SetPiece = {
  id: "the-crossing",
  title: "The sea",
  provenance: recorded(ref("exodus", 14, "21-22")),
  intro:
    "The wind has been blowing out of the east all night, hard enough to lean on. Where the water was, there is a road. On either side of it the sea stands up like a wall, and nobody in the column can look at it for long.",
  phases: [
    {
      id: "the-army-behind",
      body: "Pharaoh's chariots are close enough now to hear. The people around you are crying out — some to God, some at Moses, one man near you saying over and over that there were graves enough in Egypt. Word comes back down the line: stand still and see what God will do. Then, almost at once, a second word. Go forward.",
      provenance: recorded(ref("exodus", 14, "10-12"), ref("exodus", 14, "13-16")),
      choices: [
        {
          id: "go-first",
          label: "Take your household in among the first",
          provenance: invented(),
          outcome:
            "You go while the order is still being passed back, before you have time to think about it properly. The ground under your feet is dry. That is somehow the worst part.",
          effects: { trust: 6, morale: -4 },
        },
        {
          id: "wait-for-others",
          label: "Let others go ahead and watch that the ground holds",
          provenance: invented(),
          outcome:
            "You stand at the edge and count families in until you are satisfied. It holds. It holds for all of them. Then you go, and you are nearer the back than you meant to be.",
          effects: { morale: 3 },
        },
        {
          id: "carry-the-young",
          label: "Get the children up onto your shoulders and move",
          provenance: invented(),
          outcome:
            "You go in carrying more than you can comfortably carry, because you would rather feel the weight than look down and find nobody holding your hand.",
          effects: { condition: -7, trust: 4 },
        },
      ],
    },
    {
      id: "between-the-walls",
      body: "It is louder in here than outside. The walls of water do not sound like the sea; they sound like something holding its breath. Somebody ahead has stopped walking and is simply standing, looking up, and the line is bending around him.",
      provenance: recorded(ref("exodus", 14, "22")),
      choices: [
        {
          id: "keep-them-moving",
          label: "Keep your household moving and do not let them stop",
          provenance: invented(),
          outcome:
            "You put a hand between the shoulders of whoever slows and you push, gently, and you do not let anybody look up for long.",
          effects: { condition: -4, trust: 3 },
        },
        {
          id: "let-them-look",
          label: "Let them stop and look at it",
          provenance: invented(),
          outcome:
            "You stop with them. It costs you ground you will not get back tonight, and none of you will ever forget it.",
          effects: { morale: 7, condition: -3 },
        },
        {
          id: "help-the-stalled",
          label: "Go back for the man who has stopped",
          provenance: invented(),
          outcome:
            "You take his arm and walk him out of it. He does not thank you and you do not think he can. His family is somewhere ahead, and you hand him to them on the far shore.",
          effects: { condition: -8, trust: 7, morale: 3 },
        },
      ],
    },
  ],
  outcome: {
    text: "The children of Israel walked on dry land in the middle of the sea, and the waters were a wall to them on their right hand and on their left. When morning came the sea returned to its strength, and the army that had followed them into it did not come out. Israel saw the Egyptians dead on the shore, and the people feared God and believed him, and his servant Moses.",
    provenance: recorded(
      ref("exodus", 14, "27-31"),
      ref("exodus", 14, "29"),
    ),
    // Exodus 14:31 is explicit that the people believed. This is the one moment in
    // the episode that can bring an estranged household back on its own.
    effects: { trust: 18, morale: 10 },
  },
  unlocks: ["the-crossing-note", "what-the-player-cannot-change"],
};

const marah: SetPiece = {
  id: "marah",
  title: "Bitter water",
  provenance: recorded(ref("exodus", 15, "22-23")),
  intro:
    "Three days into the wilderness of Shur and there has been no water in any of them. Not little water. None. The skins went flat yesterday and the column has been walking on what people had the sense to hoard.",
  phases: [
    {
      id: "the-third-day",
      // Nothing here works, and the game does not pretend otherwise.
      futile: true,
      body: "Your household is asking you what the plan is. There is no plan. There is a direction, and a man at the front of it, and three days of no water behind you.",
      provenance: recorded(ref("exodus", 15, "22")),
      choices: [
        {
          id: "promise-them",
          label: "Tell them there will be water today",
          provenance: invented(),
          outcome:
            "You say it as though you know. They believe you, which is worse, because you do not.",
          effects: { morale: 5, trust: -6 },
        },
        {
          id: "tell-them-plainly",
          label: "Tell them you do not know",
          provenance: invented(),
          outcome:
            "It lands badly and it lands honestly. Nobody argues with you about it later.",
          effects: { morale: -5, trust: 6 },
        },
        {
          id: "ration-what-is-left",
          label: "Give what is left to the children and the old",
          provenance: invented(),
          outcome:
            "You and the other adults go without. It buys the young ones most of a day, and it costs you the strength you were going to walk on.",
          effects: { condition: -9, trust: 5 },
        },
      ],
    },
    {
      id: "the-pool",
      futile: true,
      body: "There is water at Marah. The front of the column reaches it well before you do, and you can tell from a long way back that something is wrong, because nobody who reaches it is drinking. It is bitter. You cannot swallow it.",
      provenance: recorded(ref("exodus", 15, "23")),
      choices: [
        {
          id: "try-it-anyway",
          label: "Try it anyway",
          provenance: invented(),
          outcome:
            "You get a mouthful down and bring it straight back up. Your household watches you do it. You wish they had not.",
          effects: { condition: -7, morale: -6 },
        },
        {
          id: "dig-beside-it",
          label: "Dig beside the pool and hope for something cleaner",
          provenance: invented(),
          outcome:
            "You dig until your hands are raw and the hole fills with the same bitter water. Of course it does. It is the same water.",
          effects: { condition: -8, morale: -3 },
        },
        {
          id: "keep-them-back",
          label: "Keep your household away from it",
          provenance: invented(),
          outcome:
            "You will not let them near it, and you take the shouting that comes with that. None of them are sick tonight. Several other families are.",
          effects: { morale: -4, trust: 5 },
        },
      ],
    },
  ],
  outcome: {
    text: "The people complained against Moses, saying, what shall we drink? And he cried to God, and God showed him a tree; and he threw it into the waters, and the waters were made sweet.",
    provenance: recorded(ref("exodus", 15, "24-25")),
    // The whole of F9's water system exists so that this line lands as relief.
    provisions: { water: 999 },
    effects: { morale: 12, trust: 6 },
  },
  unlocks: ["marah-note"],
};

const rephidim: SetPiece = {
  id: "rephidim",
  title: "Amalek",
  mechanic: "amalek-at-the-rear",
  provenance: recorded(ref("exodus", 17, "8")),
  intro:
    "They come at the back of the column, where the walking is slowest. Joshua is choosing men out of the camp. Moses has gone up the hill with Aaron and Hur, and he has the rod in his hand.",
  phases: [
    {
      id: "the-line",
      body: "You are not one of the men Joshua chose. What you are is a household standing in the open with a fight happening at the edge of it, and the only question anyone is asking you is where your family should be.",
      provenance: reasoned(
        "Exodus 17 records Joshua choosing men to fight and Moses on the hill; it says nothing about what everybody else did, which is the gap the player's household stands in.",
        ref("exodus", 17, "9-10"),
      ),
      choices: [
        {
          id: "close-up",
          label: "Get your household forward, in among the crowd",
          provenance: invented(),
          outcome:
            "You push up into the thick of the column where there are bodies on every side of you. It is not safety. It is closer to safety than the edge is.",
          effects: { condition: -5, morale: 3 },
        },
        {
          id: "stand-with-the-slow",
          label: "Stay at the back with the families who cannot move fast",
          provenance: invented(),
          outcome:
            "There are people back here who genuinely cannot go any quicker, and now there is somebody standing with them who could have.",
          effects: { condition: -9, trust: 8, morale: -3 },
        },
        {
          id: "hide-them",
          label: "Put your household down among the rocks and cover them",
          provenance: invented(),
          outcome:
            "You get them low and out of sight and you crouch over the top of them, and you spend the whole afternoon listening to a battle you cannot see.",
          effects: { morale: -6, condition: -2 },
        },
      ],
    },
    {
      id: "the-hill",
      /*
       * The verb of this set piece. Every option here is a way of looking at the
       * hill, because looking at the hill is genuinely all the player can do about
       * the thing that is deciding the afternoon.
       */
      futile: true,
      body: "The fighting goes one way and then the other, and it does it in time with something. It takes a while for anyone to say out loud what they have all noticed: when the man on the hill has his arms up, the line holds. When they come down, it does not.",
      provenance: recorded(ref("exodus", 17, "11")),
      choices: [
        {
          id: "watch-the-hill",
          label: "Watch the hill",
          provenance: invented(),
          outcome:
            "You watch two men take his arms and hold them up, one on each side, and you understand that this is what the day is resting on and that none of it is in your hands.",
          effects: { trust: 6, morale: 2 },
        },
        {
          id: "watch-the-line",
          label: "Watch the fighting instead",
          provenance: invented(),
          outcome:
            "You keep your eyes on the near edge of it, where you would be able to see trouble coming. You see a great deal of trouble and none of it comes to you.",
          effects: { morale: -5, condition: -2 },
        },
        {
          id: "keep-them-calm",
          label: "Keep your household's eyes off both",
          provenance: invented(),
          outcome:
            "You give them things to do. Count the waterskins. Sort the bundles. Anything but look up. It works about as well as it ever does.",
          effects: { morale: 4, trust: -2 },
        },
      ],
    },
  ],
  outcome: {
    text: "Moses' hands were heavy, so they put a stone under him and he sat on it, and Aaron and Hur held up his hands, one on the one side and the other on the other side; and his hands were steady until sunset. And Joshua defeated Amalek and his people with the edge of the sword.",
    provenance: recorded(ref("exodus", 17, "12-13")),
    // Deliberately no effects here: what Rephidim costs a household is worked out
    // from where it was standing, by `sim/systems/rephidim.ts`.
  },
  unlocks: ["hands-on-the-hill"],
};

const jethro: SetPiece = {
  id: "jethro",
  title: "Rulers of tens",
  mechanic: "appointed-to-a-judge",
  provenance: recorded(ref("exodus", 18, "13-14")),
  intro:
    "Moses has been sitting from morning to evening with the whole camp queueing in front of him, and his wife's father has been watching it for a day and a half with an expression on his face.",
  phases: [
    {
      id: "the-queue",
      body: "You have been in this queue since first light over a dispute about a goat that is not even mainly your dispute. There are perhaps four hundred people ahead of you. At the front of it, one man is trying to settle every quarrel in Israel personally.",
      provenance: recorded(ref("exodus", 18, "13")),
      choices: [
        {
          id: "wait-it-out",
          label: "Wait your turn",
          provenance: invented(),
          outcome:
            "You wait. You are still waiting when they call the end of the day, and you will be back tomorrow, further forward and no nearer.",
          effects: { condition: -4, morale: -4 },
        },
        {
          id: "settle-it-yourselves",
          label: "Go and settle it with the other household yourself",
          provenance: invented(),
          outcome:
            "You take him aside and the two of you sort it out in about the time it takes to boil water. Neither of you is entirely happy, which is roughly what a settlement is.",
          effects: { morale: 4, trust: 3 },
        },
        {
          id: "give-it-up",
          label: "Drop it",
          provenance: invented(),
          outcome:
            "You let the goat go. It is a goat. You have walked out of Egypt and across a sea, and you find you have less appetite for being right than you used to.",
          effects: { morale: 2 },
        },
      ],
    },
  ],
  outcome: {
    text: "Jethro told Moses the thing he was doing was not good — that he would wear away, and the people with him, because it was too heavy to carry alone. He was to choose able men out of all the people, men of truth, and set them over the congregation as rulers of thousands, of hundreds, of fifties and of tens; and let them judge at all times, bringing only the hard matters to Moses. Moses listened to his father-in-law, and did everything he said.",
    provenance: recorded(ref("exodus", 18, "17-18"), ref("exodus", 18, "21"), ref("exodus", 18, "24-26")),
    effects: { morale: 6, trust: 4 },
  },
  unlocks: ["rulers-of-tens"],
};

export const setPieces: SetPiece[] = [crossing, marah, rephidim, jethro];
