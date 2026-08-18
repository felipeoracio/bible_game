import { recorded, reasoned, ref, type CodexEntry } from "../../types";

/**
 * Leg 1 Codex entries.
 *
 * These are readable outside of play, which makes them the part of the product a
 * parent or a teacher actually evaluates before buying. Written plainly enough to
 * be read aloud, without talking down.
 */
export const leg01Codex: CodexEntry[] = [
  {
    id: "succoth",
    title: "Succoth",
    kind: "waypoint",
    note: "The first camp. The itinerary in Numbers records it in one short sentence: they set out from Rameses and camped at Succoth. Exodus adds who was walking — about six hundred thousand men on foot, besides children, and everything they owned on four legs. Where exactly Succoth stood is not certain, and faithful readers place it differently.",
    provenance: recorded(ref("numbers", 33, "5"), ref("exodus", 12, "37")),
    passages: [ref("numbers", 33, "3-5"), ref("exodus", 12, "37")],
    related: ["how-far-was-it", "mixed-multitude"],
  },
  {
    id: "mixed-multitude",
    title: "The mixed multitude",
    kind: "note",
    note: "One line in the departure account says that a mixed multitude went up with Israel. That is all it says. It does not say who they were, why they came, or how they were treated on the road. The game invents a man named Hotep to stand in that gap, and marks him as invented wherever he appears — but the fact that people who were not Israelites walked out of Egypt with Israel is in the text.",
    provenance: recorded(ref("exodus", 12, "38")),
    passages: [ref("exodus", 12, "38")],
    related: ["succoth"],
  },
  {
    id: "kneading-troughs",
    title: "The kneading trough on the shoulder",
    kind: "object",
    note: "A kneading trough is a shallow wooden bowl for working dough. The account says the people took their dough before it was leavened, with their kneading troughs bound up in their clothes on their shoulders — and later explains why the bread was flat: they were thrust out of Egypt and could not wait, and had prepared no food for the road. The unleavened bread is not a ritual detail here. It is what happens when you leave in a hurry.",
    provenance: recorded(ref("exodus", 12, "34"), ref("exodus", 12, "39")),
    passages: [ref("exodus", 12, "34"), ref("exodus", 12, "39")],
    related: ["succoth"],
  },
  {
    id: "asking-of-the-egyptians",
    title: "Silver, gold, and clothing",
    kind: "event",
    note: "On the way out, Israel asked their Egyptian neighbours for articles of silver and gold and for clothing, and were given them. This is why an ordinary Hebrew household in this story can be carrying Egyptian-made jewellery it could never have afforded — a detail worth noticing on the characters, because it comes straight from here.",
    provenance: recorded(ref("exodus", 12, "35-36")),
    passages: [ref("exodus", 12, "35-36")],
    related: ["succoth"],
  },
  {
    id: "how-far-was-it",
    title: "How far was it?",
    kind: "note",
    note: "Numbers 33 is an itinerary: it names the camps in order, one after another, all the way from Egypt. What it does not do is say how far apart they were. Every distance in this game is therefore an estimate, worked out from where the places are thought to have stood and how far a large group with children and livestock can walk in a day. The camps are recorded. The distances are our reasoning, and we would rather tell you than let you assume.",
    provenance: reasoned(
      "Numbers 33 lists the stages by name with no distances attached; the figures used in the game are derived from proposed site identifications and a day's march for a large mixed group.",
      ref("numbers", 33, "1-2"),
    ),
    passages: [ref("numbers", 33, "1-2")],
    related: ["succoth"],
  },
];
