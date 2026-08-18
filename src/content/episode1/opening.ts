import { invented, recorded, reasoned, ref, type OpeningBeat } from "../types";

/**
 * The opening.
 *
 * Four beats, shown before the household is built, because a player needs to know
 * what they are walking out of before they are asked who is walking with them.
 *
 * Every beat is tagged like everything else in the game — the first two are the
 * text, the third is the design's central bet stated plainly, and the fourth is the
 * promise the whole product rests on. Making the last one part of the opening rather
 * than a settings note is deliberate: §6.3 says the labelling is a feature to talk
 * about, and this is where the player is told about it.
 */
export const opening: OpeningBeat[] = [
  {
    id: "in-egypt",
    heading: "Egypt",
    lines: [
      "Your family has been in Egypt longer than anyone can count. Long enough that nobody living remembers arriving.",
      "For as long as you have been alive it has meant mortar and brick, and work in the fields, and men standing over you to make sure it never stops.",
    ],
    provenance: recorded(ref("exodus", 1, "13-14")),
    passages: [ref("exodus", 1, "13-14")],
  },
  {
    id: "the-night",
    heading: "Tonight",
    lines: [
      "At midnight something went through Egypt, and there is not a house without someone dead in it. Pharaoh has called for Moses and Aaron in the dark and told them to take their people and go.",
      "The Egyptians are not waiting for morning. They are pressing everyone out of the land in haste, and the whole camp is moving before the bread has had time to rise.",
    ],
    provenance: recorded(ref("exodus", 12, "29-33")),
    passages: [ref("exodus", 12, "31-33")],
  },
  {
    id: "who-you-are",
    heading: "You",
    lines: [
      "You are not Moses. You will see him at a distance, somewhere ahead in the column, and you will hear what he decides the way everyone else does — as rumour, as an announcement, as the direction of the march changing.",
      "You are the head of one ordinary household, with a family to keep together and whatever you can carry. What happens on this road is not up to you. What your family does about it is.",
    ],
    provenance: reasoned(
      "That a mixed crowd of ordinary households walked out with Israel is recorded; this particular family is invented so that the player has somewhere to stand inside the event.",
      ref("exodus", 12, "37-38"),
    ),
  },
  {
    id: "the-promise",
    heading: "One promise",
    lines: [
      "Some of what you meet on this journey is written down in Scripture. Some of it is reasoned from what the world was like. Some of it we made up so there would be a game here at all.",
      "You will never have to guess which is which. Everything in this game carries a label, and the passage behind it is always one tap away.",
    ],
    provenance: invented(),
  },
];
