import { invented, recorded, reasoned, ref, type GameEvent } from "../../types";

/**
 * Leg 5 — the far shore to Marah. Three days of no water at all.
 *
 * The leg opens on the highest point in the episode and ends on the lowest, and
 * both are recorded. Exodus 15 puts the Song of the Sea and Miriam's dancing
 * immediately after the crossing, and then, four verses later, three days in the
 * wilderness of Shur without water.
 *
 * That collapse is the leg. Nothing here softens it, and no event on this leg gives
 * the household a drink, because the text does not give them one until the tree
 * goes into the pool at Marah.
 */
export const leg05Events: GameEvent[] = [
  {
    id: "the-song-at-the-sea",
    title: "Miriam with the tambourine",
    body: "Somebody starts it and everybody knows it by the second time round, which is impossible, and nobody minds. Miriam has a tambourine and the women are going out after her with tambourines and with dancing, and there are people in this column who were making bricks four days ago.",
    provenance: recorded(ref("exodus", 15, "1"), ref("exodus", 15, "20-21")),
    choices: [
      {
        id: "sing-with-them",
        label: "Sing",
        provenance: invented(),
        outcome:
          "You do not have the voice for it and it does not matter in the least. {milcah} is on your shoulders and hitting you on the head roughly in time.",
        effects: { morale: 10, trust: 4 },
      },
      {
        id: "watch-them",
        label: "Stand and watch your household do it",
        provenance: invented(),
        outcome:
          "You keep hold of the bundles and you watch the four of them dance on a beach in front of a sea that was a road this morning. You will want this later.",
        effects: { morale: 7 },
      },
      {
        id: "look-back",
        label: "Look back at the water instead",
        provenance: invented(),
        outcome:
          "There are men on the shore who were alive last night and horses in the shallows and the singing going on behind you, and you cannot make the two things sit together.",
        effects: { morale: -3, trust: 5 },
      },
    ],
    unlocks: ["the-song-of-the-sea"],
  },
  {
    id: "the-first-dry-day",
    title: "The wilderness of Shur",
    body: "The singing lasted most of a day. This does not. The country on this side is not the country on the other side — it is stone and glare and nothing standing higher than your knee, and by the middle of the afternoon the word going round the column is that nobody has found water since the shore.",
    provenance: recorded(ref("exodus", 15, "22")),
    choices: [
      {
        id: "ration-early",
        label: "Start rationing now, before you have to",
        provenance: invented(),
        outcome:
          "You cut everybody back while there is still something to cut back. It is an unpopular decision made a day early, which is the only kind worth making.",
        effects: { morale: -4, trust: 6 },
      },
      {
        id: "drink-normally",
        label: "Let them drink as they need to",
        provenance: invented(),
        outcome:
          "They drink and they walk better for it and the skins go down faster than you would like. You tell yourself there will be water tomorrow.",
        effects: { condition: 4, morale: 3 },
      },
    ],
  },
  {
    id: "the-second-dry-day",
    title: "Nobody has found any",
    body: "Two days now. The column has stopped talking about it, which is worse than when it was talking about it. {naamah} has not complained once, and that is how you know.",
    provenance: reasoned(
      "Exodus 15:22 records three days in the wilderness with no water found. What the second of those days was like inside one household is invented.",
      ref("exodus", 15, "22"),
    ),
    choices: [
      {
        id: "carry-naamah",
        label: "Take {naamah}'s load",
        provenance: invented(),
        outcome:
          "She lets you, which frightens you more than the arguing would have. You walk the rest of the day with her bundle on top of yours.",
        effects: { condition: -10, trust: 7 },
      },
      {
        id: "slow-the-pace",
        label: "Drop back and walk at her pace",
        provenance: invented(),
        outcome:
          "The column pulls away in front of you by a little more every hour. She keeps up, because you are going her speed now.",
        effects: { morale: 4, trust: 5 },
      },
      {
        id: "push-on",
        label: "Keep the pace and get to water sooner",
        provenance: invented(),
        outcome:
          "You push. It is a reasonable gamble on there being water ahead, and it is a gamble you are making with other people's legs.",
        effects: { condition: -6, trust: -4, morale: -2 },
      },
    ],
  },

  // --- Pool: ordinary life ---------------------------------------------------
  {
    id: "the-taste-of-salt",
    title: "Everything tastes of salt",
    body: "It is in the clothes and the hair and the food from the crossing, and there is no fresh water to rinse any of it out with. {elon} keeps spitting and apologising for spitting.",
    provenance: invented(),
    choices: [
      {
        id: "make-a-joke-of-it",
        label: "Make a joke of it",
        provenance: invented(),
        outcome:
          "It is not a good joke. It works anyway, and the four of them are still using it two days later.",
        effects: { morale: 5 },
      },
      {
        id: "say-nothing-about-it",
        label: "Say nothing and keep walking",
        provenance: invented(),
        outcome:
          "There is nothing to say about it. Everybody knows. Saying it out loud would only make it a thing that is being discussed.",
        effects: { condition: 2, morale: -2 },
      },
    ],
  },
  {
    id: "hotep-on-the-far-side",
    title: "Hotep looks back",
    body: "The Egyptian who has walked with your fire since Succoth has been very quiet since the shore. He tells you, without being asked, that there were men in that army he grew up two streets away from.",
    provenance: reasoned(
      "Exodus 12:38's mixed multitude went up with Israel; Hotep is invented. What a man from Egypt felt about Egypt's army drowning is not recorded anywhere.",
      ref("exodus", 12, "38"),
    ),
    choices: [
      {
        id: "sit-with-him",
        label: "Sit down with him",
        provenance: invented(),
        outcome:
          "You do not try to explain it to him or make it better. You sit on a rock next to a man who is grieving the wrong people, and you stay there a while.",
        effects: { morale: -3, trust: 7 },
      },
      {
        id: "remind-him-what-they-were",
        label: "Remind him what that army came to do",
        provenance: invented(),
        outcome:
          "He agrees with every word of it. He is still not all right, and now he is not all right on his own.",
        effects: { trust: -4, morale: 2 },
      },
    ],
  },
];
