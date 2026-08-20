import { invented, recorded, reasoned, ref, type GameEvent } from "../../types";

/**
 * Leg 2 — Succoth to Etham, at the edge of the wilderness.
 *
 * The leg where the country stops being Egypt. Two recorded things happen on it and
 * they pull in opposite directions: the route deliberately avoids the short road,
 * and the pillar appears to lead them. One is God declining to give them the easy
 * way; the other is God going in front of them anyway.
 */
export const leg02Events: GameEvent[] = [
  {
    id: "the-long-way-round",
    title: "Not the short road",
    body: "There is a road to the north that any of you could point to. It is the way traders go, and it reaches the land of the Philistines in days rather than weeks. The column is not taking it. Word comes back that the way is around, by the wilderness, toward the sea — and nobody at the front is offering a reason.",
    provenance: recorded(ref("exodus", 13, "17-18")),
    choices: [
      {
        id: "trust-the-turn",
        label: "Say nothing and follow",
        provenance: invented(),
        outcome:
          "You keep your opinion behind your teeth. There is a man ahead of you who has been giving his freely all morning, and you notice that nobody is walking near him.",
        effects: { trust: 4 },
      },
      {
        id: "ask-why",
        label: "Ask, loudly enough that people hear you",
        provenance: invented(),
        outcome:
          "You get no answer, but several families fall in beside you as though you had said something they were glad to have said. It does not make the road any shorter.",
        effects: { morale: 4, trust: -4 },
      },
      {
        id: "reckon-it-out",
        label: "Work out for yourself what is down the short road",
        provenance: invented(),
        outcome:
          "Philistine country. Walled towns and men who fight for a living, and a column of brickmakers with children in it. You stop wondering why quite so loudly after that.",
        effects: { morale: -3, trust: 6 },
      },
    ],
    unlocks: ["why-not-the-short-road"],
  },
  {
    id: "josephs-bones",
    title: "What Moses is carrying",
    body: "The bundle goes past on a litter, carried carefully by men walking in step, and the word goes down the line with it. Joseph. He made them swear it — that when God visited them they would carry his bones up out of here. Four hundred years somebody has kept that promise, hand to hand, all the way down to this morning.",
    provenance: recorded(ref("exodus", 13, "19")),
    choices: [
      {
        id: "explain-to-the-children",
        label: "Explain to the children who is going past",
        provenance: invented(),
        outcome:
          "You tell it badly and they ask questions you cannot answer. They will remember it for the rest of their lives.",
        effects: { morale: 6, trust: 3 },
      },
      {
        id: "stand-and-watch",
        label: "Stand still until it has gone by",
        provenance: invented(),
        outcome:
          "You stop walking. So do the people around you, without arranging it. The whole column bulges and thins and closes up again behind him.",
        effects: { morale: 5 },
      },
    ],
    unlocks: ["josephs-bones-note"],
  },
  {
    id: "the-pillar",
    title: "The cloud that goes in front",
    body: "It has been ahead of the column since morning and it has not once moved the way weather moves. When the light starts to go, it does not go with it. It stands over the head of the column and burns, and there is enough light to walk by.",
    provenance: recorded(ref("exodus", 13, "21-22")),
    choices: [
      {
        id: "walk-into-the-night",
        label: "Keep walking while there is light to walk by",
        provenance: invented(),
        outcome:
          "You put more ground behind you than you thought you had left in your legs, and you pay for it in the morning.",
        effects: { condition: -8, trust: 5 },
      },
      {
        id: "stop-anyway",
        label: "Stop at dusk like a sensible household",
        provenance: invented(),
        outcome:
          "You make camp under a sky with a fire standing in it. Nobody sleeps especially well, but nobody is carried in the morning either.",
        effects: { condition: 4, morale: 3 },
      },
    ],
    unlocks: ["the-pillar-note"],
  },

  // --- Pool: ordinary life ---------------------------------------------------
  {
    id: "the-last-of-the-egyptian-bread",
    title: "The end of what you brought",
    body: "{tirzah} turns the bag out and there is nothing in it worth the turning. What came out of Egypt in a kneading trough on somebody's shoulder is gone, and what is ahead is a country with nothing growing on it.",
    provenance: reasoned(
      "Exodus 12:39 says they carried unleavened dough because they were driven out and had prepared no provisions; a household of five running through that within a couple of days is the arithmetic of it.",
      ref("exodus", 12, "39"),
    ),
    choices: [
      {
        id: "share-it-out",
        label: "Split the last of it between the children",
        provenance: invented(),
        outcome:
          "{elon} and {milcah} get a piece each and neither of them asks where yours is, which tells you they already know.",
        effects: { condition: -5, trust: 5 },
      },
      {
        id: "keep-it-back",
        label: "Keep it back for tomorrow",
        provenance: invented(),
        outcome:
          "You tie the bag shut and walk with it against your ribs all afternoon, aware of it the whole way.",
        effects: { morale: -3 },
      },
    ],
  },
  {
    id: "the-egyptian-jewellery",
    title: "What the silver is worth out here",
    body: "{naamah} has been carrying an Egyptian bracelet since the night you left, given at the door by a neighbour who could not get rid of it fast enough. Out here there is nobody to sell it to and nothing to buy. It is a lovely thing and it weighs exactly as much as it weighs.",
    provenance: reasoned(
      "Exodus 12:35-36 records Israel asking their Egyptian neighbours for silver, gold and clothing and being given it; what an ordinary family then did with jewellery in a waterless country is not recorded.",
      ref("exodus", 12, "35-36"),
    ),
    choices: [
      {
        id: "let-her-keep-it",
        label: "Let {naamah} keep it",
        provenance: invented(),
        outcome:
          "She does not put it on. She just likes knowing it is there, and you find you like her knowing it.",
        effects: { morale: 4, condition: -2 },
      },
      {
        id: "bury-the-weight",
        label: "Talk her into leaving it",
        provenance: invented(),
        outcome:
          "She sets it down at the side of the road, upright, the way you would put down something you meant to come back for.",
        effects: { condition: 3, morale: -5 },
      },
    ],
  },
];
