import {
  invented,
  recorded,
  reasoned,
  ref,
  type CastMember,
  type TradeOption,
} from "../types";

/**
 * The player household.
 *
 * Every one of these people is invented, and every one is tagged that way. This is
 * the design bet from §3 of the plan: you do not play as Moses, you play as an
 * ordinary household inside the event. Because the household is invented, the player
 * can have real agency without the game ever rewriting what Scripture records.
 *
 * Names are placeholders in the sense that they want checking against major figures
 * in the text before release, so a fictional grandmother does not end up sharing a
 * name with a recorded person. None of the five below is a named figure in Exodus.
 */
export const household: CastMember[] = [
  {
    id: "eliab",
    name: "Eliab",
    role: "head",
    age: 35,
    description:
      "Head of the household. Lean and weathered from hard labour, and responsible for other people.",
    provenance: invented(),
  },
  {
    id: "tirzah",
    name: "Tirzah",
    role: "spouse",
    age: 32,
    description:
      "Steady, practical, and alert, and the first to tell you plainly when you are wrong.",
    provenance: invented(),
  },
  {
    id: "elon",
    name: "Elon",
    role: "child",
    age: 10,
    description: "Curious rather than frightened. The one who keeps asking why.",
    provenance: invented(),
  },
  {
    id: "milcah",
    name: "Milcah",
    role: "child",
    age: 6,
    description:
      "Small, tired, and carrying a doll of rolled cloth that never gets put down.",
    provenance: invented(),
  },
  {
    id: "naamah",
    name: "Naamah",
    role: "elder",
    age: 70,
    description:
      "Leans on an olive-wood staff worn smooth at the grip. Remembers Egypt before it got worse.",
    provenance: invented(),
  },
];

/**
 * Trades for the head of the household.
 *
 * The first two are what the text actually says Israel was made to do in Egypt —
 * mortar and brick, and service in the field. The others are reasoned from the
 * material culture of the period rather than stated.
 */
export const trades: TradeOption[] = [
  {
    id: "brickmaker",
    label: "Brickmaker",
    description: "Mortar and brick. Your forearms still carry the clay dust.",
    provenance: recorded(ref("exodus", 1, "14")),
  },
  {
    id: "field-labourer",
    label: "Field labourer",
    description: "Service in the field, in every kind of work they could find for you.",
    provenance: recorded(ref("exodus", 1, "14")),
  },
  {
    id: "shepherd",
    label: "Shepherd",
    description: "You kept the flocks. They are walking out of Egypt with you.",
    provenance: reasoned(
      "Not stated as a trade of the enslaved generation, but Israel left with flocks and herds, so herding was being done by someone among them.",
      ref("exodus", 12, "38"),
    ),
  },
  {
    id: "weaver",
    label: "Weaver",
    description: "Wool and flax on an upright loom. You know good cloth when it is handed to you.",
    provenance: reasoned(
      "Weaving is not named as an occupation in the departure account; it is reasoned from the woven mantles and linen of Late Bronze Age Levantine material culture.",
    ),
  },
];
