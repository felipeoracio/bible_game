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
    id: "the-rearmost",
    title: "The back of the column",
    kind: "note",
    note: "Israel left Egypt as one enormous body of people, and a body that size does not move evenly. Some families were near the front. Some were a long way back. Moses is told to remember, much later, what Amalek did on the road out of Egypt: he came at the rear and struck the ones who were lagging, the feeble and the worn out, when everybody was faint and weary. That is why this game keeps track of where your household is walking. Falling behind is not a score going down. It is a place in the line, and the text is clear that it was a dangerous one.",
    provenance: recorded(ref("deuteronomy", 25, "17-18")),
    passages: [ref("deuteronomy", 25, "17-18")],
    related: ["how-far-was-it", "succoth"],
  },
  {
    id: "water-in-the-wilderness",
    title: "Water in the wilderness",
    kind: "note",
    note: "Three days out from the sea they found no water, and when they did find some it was bitter — so bitter the place was named for it. Later, at Rephidim, there was no water at all, and the people quarrelled with Moses over it. Thirst is not background detail in this account; it is one of the things the text keeps coming back to. That is why water in this game is something you can spend and never something you can go and fetch. How fast the skins empty is up to you — the pace you keep and the ground you cross. When they fill again is up to the story.",
    provenance: recorded(ref("exodus", 15, "22-23"), ref("exodus", 17, "1")),
    passages: [ref("exodus", 15, "22-25"), ref("exodus", 17, "1-6")],
    related: ["how-far-was-it", "succoth"],
  },
  {
    id: "which-road-is-this",
    title: "Which road is this?",
    kind: "note",
    note: "Worth saying at the start, because it affects every map in this game. Numbers 33 gives the camps and their order, and that is recorded. Where those camps actually were is not — almost none of them can be located with confidence, and readers who take the text equally seriously have placed the route in quite different parts of the map, including disagreeing about which body of water was crossed and which mountain is Sinai. This game had to draw one line in order to have anything to walk along, so it follows one of those readings. It is not put forward as the right one. If your Bible's map disagrees with ours, your Bible's map may well be closer, and nothing in the journey you are playing depends on ours being correct: the names, the order, and everything that happens at them come from the text, and only the geography between them is a choice we made.",
    provenance: reasoned(
      "Numbers 33 records the camps and their sequence but locates none of them; the identification of the crossing point, the mountain and most of the intervening camps is disputed, so the route this game draws is one reconstruction among several and is labelled as the game's own.",
      ref("numbers", 33, "1-2"),
    ),
    passages: [ref("numbers", 33, "1-2")],
    related: ["how-far-was-it", "succoth"],
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
