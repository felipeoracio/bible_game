import { invented, recorded, reasoned, ref, type GameEvent } from "../../types";

/**
 * Leg 4 — Pi-hahiroth to the far shore.
 *
 * A short leg, and almost all of it is the set piece. The two events here exist to
 * put the household in the right place before the sea opens: close enough to the
 * water to see it, and close enough to the army to hear it. After that the crossing
 * takes the screen and the march does not resume until it is finished.
 *
 * Numbers 33:8 treats the crossing and the three days beyond it as one stage. The
 * game splits them across legs 4 and 5, because one leg cannot hold two set pieces —
 * a reasoned decision, and the Codex entry "How far was it?" already tells the
 * player that the stage divisions here are ours.
 */
export const leg04Events: GameEvent[] = [
  {
    id: "the-cloud-moves-behind",
    title: "The pillar changes ends",
    body: "It has gone in front of the column since Etham. Tonight it does not. It comes down the length of the camp, slowly, and settles between Israel and the road the chariots are on, and it stays there.",
    provenance: reasoned(
      "Exodus 14 records the pillar moving behind Israel to come between them and the Egyptians; the household's view of it from inside the camp is invented, as is what they said about it.",
      ref("exodus", 13, "21-22"),
    ),
    choices: [
      {
        id: "watch-it-settle",
        label: "Watch it until it stops moving",
        provenance: invented(),
        outcome:
          "You stand and watch a thing the size of a hill put itself between your family and an army, and you do not have a word for what you are feeling.",
        effects: { morale: 8, trust: 6 },
      },
      {
        id: "use-the-time",
        label: "Use the time to get your household ready",
        provenance: invented(),
        outcome:
          "You do not watch it. You spend the whole of it tying loads and finding sandals and counting heads, and you are the only family near you that is ready when the order comes.",
        effects: { condition: -5, trust: 4 },
      },
    ],
  },
  {
    id: "the-wind-all-night",
    title: "An east wind, all night",
    body: "It gets up after dark and it does not let up. It is not a gust and it is not a storm; it is one continuous shove out of the east, hard enough that you have to lean into it to stand, and it goes on for hours in the dark with the sound of water in it.",
    provenance: recorded(ref("exodus", 14, "21")),
    choices: [
      {
        id: "try-to-sleep",
        label: "Make them lie down and try to sleep",
        provenance: invented(),
        outcome:
          "Nobody sleeps. But they lie down, and lying down in the dark next to each other turns out to be worth something even without the sleep.",
        effects: { condition: 5, morale: -2 },
      },
      {
        id: "go-and-look",
        label: "Go down to the water and see what the wind is doing to it",
        provenance: invented(),
        outcome:
          "You cannot see much. You can hear a great deal, and none of it is the sound the sea was making yesterday.",
        effects: { condition: -4, morale: 4, trust: 3 },
      },
    ],
  },

  // --- Pool: ordinary life ---------------------------------------------------
  {
    id: "the-neighbours-who-are-leaving",
    title: "The family at the next fire",
    body: "They have been beside you since Succoth. Tonight the man is loading his donkey in the dark, facing west, and he will not look at you while he does it. He says his children will be alive in Egypt.",
    provenance: reasoned(
      "Exodus 14:11-12 records Israel telling Moses it would have been better to serve the Egyptians than die in the wilderness. Whether any family acted on that is not recorded; this one is invented.",
      ref("exodus", 14, "11-12"),
    ),
    choices: [
      {
        id: "let-him-go",
        label: "Let him go",
        provenance: invented(),
        outcome:
          "You help him with a strap and you do not argue, and you watch him get about two hundred paces before the dark takes him.",
        effects: { morale: -6, trust: 3 },
      },
      {
        id: "talk-him-round",
        label: "Talk him out of it",
        provenance: invented(),
        outcome:
          "It takes most of an hour and half of it is you saying things you are not sure of. He unloads the donkey. In the morning he does not mention it and neither do you.",
        effects: { condition: -4, morale: 6, trust: 4 },
      },
    ],
  },
];
