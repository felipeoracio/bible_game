import { invented, recorded, reasoned, ref, type GameEvent } from "../../types";

/**
 * Leg 1 — Rameses to Succoth. The night of the departure.
 *
 * The rule this file follows: recorded events happen exactly as the text records
 * them, and the player's agency lives entirely in how their own household responds.
 * No choice offered here can change what Scripture says took place.
 */
export const leg01Events: GameEvent[] = [
  {
    id: "pharaohs-summons",
    title: "Word comes down the column",
    body: "It is still dark. The word passes from family to family faster than anyone can carry it: Pharaoh called for Moses and Aaron in the night and told them to go. The Egyptians are not waiting for morning. They are urging everyone out of the land in haste.",
    provenance: recorded(ref("exodus", 12, "31-33")),
    choices: [
      {
        id: "wake-them-now",
        label: "Wake the children and go",
        provenance: invented(),
        outcome:
          "You lift {milcah} still sleeping onto your shoulder. {elon} takes the goat's rope without being told. You are moving before most of the street is.",
        effects: { condition: 3, trust: -2 },
      },
      {
        id: "wait-for-neighbours",
        label: "Wait for the family next door",
        provenance: invented(),
        outcome:
          "You stand in the doorway until the old couple next door have their bundle tied. It costs you a place near the front of the column. They walk beside you now.",
        effects: { condition: -3, morale: 3, trust: 4 },
      },
    ],
  },
  {
    id: "the-dough-unrisen",
    title: "The dough has not risen",
    body: "{tirzah} has the dough ready but it has not risen, and there is no time to let it. There is no time for anything. Whatever leaves this house leaves on somebody's back.",
    provenance: recorded(ref("exodus", 12, "34"), ref("exodus", 12, "39")),
    choices: [
      {
        id: "bind-the-trough",
        label: "Bind the kneading trough in your cloak and carry it",
        provenance: recorded(ref("exodus", 12, "34")),
        outcome:
          "You wrap the trough in your cloak and lash it across your shoulders, the way everyone up and down the street is doing. The dough will bake flat later. It will have to.",
        effects: { morale: 4, trust: 3 },
      },
      {
        id: "leave-the-trough",
        label: "Leave the trough and carry water instead",
        provenance: invented(),
        outcome:
          "You set the trough down in the empty house. Two more skins of water go over your shoulder in its place. {naamah} watches you do it and says nothing.",
        effects: { condition: 4, morale: -4 },
      },
    ],
    unlocks: ["kneading-troughs"],
  },
  {
    id: "the-asking",
    title: "At the neighbours' door",
    body: "The Egyptians press things into your hands as you pass — silver, gold, and clothing — and they are in a hurry for you to take them and go.",
    provenance: recorded(ref("exodus", 12, "35-36")),
    choices: [
      {
        id: "ask-for-cloth",
        label: "Ask for cloth for the children",
        provenance: invented(),
        outcome:
          "You come away with a bolt of good linen and two heavy wraps. The desert nights are ahead of you, and you know it.",
        effects: { condition: 4 },
      },
      {
        id: "ask-for-silver",
        label: "Ask for silver",
        provenance: invented(),
        outcome:
          "Rings and small worked pieces, more than you have held in your life. {tirzah} ties them into a sash and does not look at them again.",
        effects: { morale: 4 },
      },
      {
        id: "ask-for-nothing",
        label: "Ask for nothing and keep walking",
        provenance: invented(),
        outcome:
          "You keep your hands on your children and your eyes ahead. Whatever is coming, you would rather carry less of Egypt into it.",
        effects: { trust: 3, morale: -2 },
      },
    ],
    unlocks: ["asking-of-the-egyptians"],
  },

  // --- Pool: ordinary life, eligible but not guaranteed ---------------------
  {
    id: "hotep-asks-to-walk",
    title: "A man with a shaved head",
    body: "He is Egyptian-born — clean-shaven, close-shorn, a craftsman's tool roll under his arm — and he is walking out with Israel. He asks, carefully, whether he might keep pace with your household. He does not seem sure he is allowed to ask.",
    provenance: reasoned(
      "The departure account records that a mixed multitude went up with Israel; who they were and how they were received is not described, so this meeting is built on that single line.",
      ref("exodus", 12, "38"),
    ),
    choices: [
      {
        id: "walk-with-us",
        label: "Tell him to walk with you",
        provenance: invented(),
        outcome:
          "He falls in a half-step behind, as though the position has to be earned. {elon} asks him three questions before the next rise.",
        effects: { morale: 3, trust: 4 },
      },
      {
        id: "point-him-on",
        label: "Point him toward another household",
        provenance: invented(),
        outcome:
          "He nods as if he expected it and moves up the column. You see the back of his head for a long time before you lose it in the crowd.",
        effects: { trust: -4 },
      },
    ],
    unlocks: ["mixed-multitude"],
  },
  {
    id: "a-strap-gives-way",
    title: "A strap gives way",
    body: "The thong of your left sandal parts where it has been rubbing for a year. You are standing on cold stone in the dark with a bundle on your back.",
    provenance: invented(),
    choices: [
      {
        id: "mend-it",
        label: "Stop and mend it",
        provenance: invented(),
        outcome:
          "It costs you a few minutes and a strip of leather. The column moves past you and you have to walk hard to get back into it.",
        effects: { condition: -2, morale: 2 },
      },
      {
        id: "walk-barefoot",
        label: "Carry the sandal and walk on",
        provenance: invented(),
        outcome:
          "Half the people around you are barefoot anyway. By first light you have stopped noticing.",
        effects: { condition: -3 },
      },
    ],
  },
];
