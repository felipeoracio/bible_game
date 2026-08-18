import { invented, reasoned, ref, type CampLine, type GameEvent } from "../types";

/**
 * The evening beat.
 *
 * What each member says is chosen by their most pressing state, so the camp screen
 * reports the household back to the player in their own words rather than as five
 * more numbers. A player who never reads a bar should still be able to tell that
 * Naamah is finished and that Elon has stopped believing them.
 *
 * These lines carry no tier tags: they are speech by invented people, and the
 * validator already refuses to let a recorded figure into the player's household.
 */
export const leg01CampLines: CampLine[] = [
  // The head of the household. Speaking as much to themselves as to you.
  {
    memberId: "eliab",
    mood: "weary",
    text: "I have carried brick all my life and never felt anything like this. Let me sit a moment before you ask me anything.",
  },
  {
    memberId: "eliab",
    mood: "low-spirit",
    text: "I keep counting the people around our fire. I do it three or four times a night. I do not know what I am afraid of.",
  },
  {
    memberId: "eliab",
    mood: "distrustful",
    text: "You set the pace. I have not said anything in front of the children. I am saying it now.",
  },
  {
    memberId: "eliab",
    mood: "content",
    text: "The dust here is different. I noticed it this evening. It does not smell of the brickfields.",
  },

  // The spouse — practical, and the first to say a hard thing plainly.
  {
    memberId: "tirzah",
    mood: "weary",
    text: "My feet are bleeding and I have nothing clean to bind them with. Do not make a face. Tomorrow will be the same or worse.",
  },
  {
    memberId: "tirzah",
    mood: "low-spirit",
    text: "{milcah} asked me tonight whether we are going home after. I did not have an answer.",
  },
  {
    memberId: "tirzah",
    mood: "distrustful",
    text: "You have been driving us past what this family can carry. I will follow you. But you should know I am doing it with my eyes open.",
  },
  {
    memberId: "tirzah",
    mood: "content",
    text: "The bread came out flat as a stone and the children ate every crumb of it. I will take that as a good sign.",
  },

  // The older child — ten, and asking the questions the player is also asking.
  {
    memberId: "elon",
    mood: "weary",
    text: "I can still walk. I can. I just want to sit down first for a bit.",
  },
  {
    memberId: "elon",
    mood: "low-spirit",
    text: "Nobody will tell me where we are going. Not the number of days. Not the name of the place. Do you know it?",
  },
  {
    memberId: "elon",
    mood: "distrustful",
    text: "You said we would stop when {naamah} got tired. That was a long way back.",
  },
  {
    memberId: "elon",
    mood: "content",
    text: "There was a cloud ahead of the whole column all day. Everyone saw it and nobody would say what it was. Did you see it?",
  },

  // The younger child — six. Short sentences, and notices the wrong things.
  {
    memberId: "milcah",
    mood: "weary",
    text: "Carry me. Just to the fire. Not all the way.",
  },
  {
    memberId: "milcah",
    mood: "low-spirit",
    text: "I left my doll's blanket in the house. I did not know we were not coming back.",
  },
  {
    memberId: "milcah",
    mood: "distrustful",
    text: "You did not wait for me. I called and you did not turn round.",
  },
  {
    memberId: "milcah",
    mood: "content",
    text: "There are more stars out here than at home. I counted to thirty and then I lost it.",
  },

  // The elder — seventy, and the only one who remembers before it got worse.
  {
    memberId: "naamah",
    mood: "weary",
    text: "Do not look at me like that. I have buried people younger than you and I am still walking. Slower. But walking.",
  },
  {
    memberId: "naamah",
    mood: "low-spirit",
    text: "My mother told me her grandfather said we would not stay in Egypt for ever. I thought she was comforting a child. Perhaps she was.",
  },
  {
    memberId: "naamah",
    mood: "distrustful",
    text: "I have followed men out of one hard place into a harder one before. Do not make me sorry I came with you.",
  },
  {
    memberId: "naamah",
    mood: "content",
    text: "Sit with me. You have been walking at the front all day and you have not once looked behind you at your own family.",
  },
];

/**
 * The decision the household carries out of the first camp.
 *
 * Straight out of Exodus 12:39 — they were thrust out of Egypt and could not wait,
 * and they had prepared no food for themselves. That is a recorded fact about the
 * whole column, which means the family at the next fire is genuinely hungry. What
 * your household does about it is invented, and the game says so.
 */
export const leg01CampEvents: GameEvent[] = [
  {
    id: "camp-first-night",
    title: "The first night out of Egypt",
    body: "Succoth, and the fires are lit. Nobody packed food — there was no time to prepare any, and half the camp is finding that out tonight. The household at the next fire has three children and nothing to give them. {tirzah} has already seen them, and is waiting to see what you do.",
    provenance: reasoned(
      "That the column left without provisions is recorded; this particular family and this particular fire are invented to put the player inside it.",
      ref("exodus", 12, "39"),
    ),
    choices: [
      {
        id: "share-the-bread",
        label: "Share what you carried out",
        provenance: invented(),
        outcome:
          "You break the flat loaves and send half across. Their mother does not thank you out loud, which is somehow worse. Your own family eats less and says nothing about it.",
        effects: { condition: -6, morale: 5, trust: 6 },
      },
      {
        id: "keep-it-for-your-own",
        label: "Keep it for your own",
        provenance: invented(),
        outcome:
          "You keep the bread. Your children sleep with something in them. {tirzah} banks the fire without a word, and the silence goes on a little longer than it needs to.",
        effects: { condition: 4, morale: -3, trust: -5 },
      },
      {
        id: "ask-what-they-have",
        label: "Ask what they have, and put it together",
        provenance: invented(),
        outcome:
          "It comes to less than you hoped: a little grain, a skin of water, your flat bread. Split five ways it is a poor meal. But two households ate, and the counting was done in the open.",
        effects: { condition: -2, morale: 4, trust: 3 },
      },
    ],
  },
];
