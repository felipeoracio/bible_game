import { recorded, reasoned, ref, type CodexEntry } from "../../types";

/**
 * Codex entries opened by the four set pieces.
 *
 * Each one does the same job: says what the text records, and then says plainly
 * where the game has put the player inside it. The set pieces are the places where
 * a Bible game is most tempted to let the player change what happened, so these
 * entries are the place to be most explicit that it has not.
 */
export const setPieceCodex: CodexEntry[] = [
  {
    id: "the-crossing-note",
    title: "Standing still, and going forward",
    kind: "event",
    note: "Two instructions arrive almost on top of each other at the sea, and they seem to contradict. Moses tells the people to stand still and see what God will do. Then God tells Moses to stop crying out and tell the people to go forward. Both are in the account, a verse apart. The game puts your household in the gap between them, because that gap is where an ordinary family actually stood — being told not to be afraid while a chariot army closes, and then being told to walk into a sea. What Scripture settles is that they crossed, and that they crossed on dry ground. What it leaves open is what it was like, and that is the only part you play.",
    provenance: recorded(ref("exodus", 14, "13-16"), ref("exodus", 14, "21-22")),
    passages: [ref("exodus", 14, "13-16"), ref("exodus", 14, "21-22")],
    related: ["succoth", "how-far-was-it"],
  },
  {
    id: "marah-note",
    title: "Marah",
    kind: "waypoint",
    note: "Three days in the wilderness of Shur without water, and then water they could not drink. The place is named for it: Marah means bitter. The people complained, Moses cried out, and God showed him a tree which he threw into the water, and it was made sweet. Notice who does what in that sentence. Nobody solves this by digging in a better spot or by rationing more carefully. That is why the game will not let you solve it either — at Marah every option you are offered is a way of enduring it, and the water changes because the text says it changed.",
    provenance: recorded(ref("exodus", 15, "22-25")),
    passages: [ref("exodus", 15, "22-25")],
    related: ["water-in-the-wilderness"],
  },
  {
    id: "rulers-of-tens",
    title: "Rulers of thousands, hundreds, fifties and tens",
    kind: "note",
    note: "Jethro, Moses' father-in-law, watches him judge the whole nation single-handed from morning to evening and tells him flatly that it is not good and that he will wear away. His advice is to appoint able men over groups of a thousand, a hundred, fifty and ten, and let them handle everything except the hard cases. Moses does it. For an ordinary household this is the moment the Exodus acquires a chain of command: from here on you take your disputes to a ruler of ten. The ranks are recorded. The particular man your family ends up under is invented — the text names none of them — and the game says so on his card.",
    provenance: recorded(ref("exodus", 18, "17-18"), ref("exodus", 18, "21"), ref("exodus", 18, "25")),
    passages: [ref("exodus", 18, "21-26")],
    related: ["succoth"],
  },
  {
    id: "hands-on-the-hill",
    title: "Whose hands the battle was in",
    kind: "note",
    note: "At Rephidim, Joshua fights Amalek in the valley while Moses stands on the hill above with the rod in his hand. When his hands are up, Israel prevails; when they drop, Amalek does. His arms grow heavy, so Aaron and Hur put a stone under him to sit on and hold his hands up, one on each side, until sunset. It is one of the strangest pictures in the book and it is oddly specific about the mechanism. The game keeps you in the valley for it. You can see the hill. You cannot get to it, and nothing you do down where you are standing changes what is happening up there.",
    provenance: recorded(ref("exodus", 17, "10-13")),
    passages: [ref("exodus", 17, "10-13")],
    related: ["the-rearmost"],
  },
  {
    id: "what-the-player-cannot-change",
    title: "What this game will not let you do",
    kind: "note",
    note: "You are not Moses, and the game is built that way on purpose. Your household is invented, so it can make real decisions; the events around it are recorded, so they happen the way they happen. At the sea you decide when to walk in and who you carry, and Israel crosses. At Marah you decide how to endure three days without water, and the water is made sweet by a tree and not by you. At Rephidim you decide where your family stands, and Joshua wins. This is the one rule the whole design rests on, and if you ever catch the game breaking it, the game is wrong and the text is not.",
    provenance: reasoned(
      "Not a claim about Scripture but a statement of how this game is built: the player's household is invented and its choices are real, while the recorded events are fixed and cannot be altered by those choices.",
      ref("exodus", 14, "29"),
    ),
    passages: [ref("exodus", 14, "29")],
    related: ["the-crossing-note", "marah-note", "hands-on-the-hill"],
  },
];
