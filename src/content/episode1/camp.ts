import { invented, reasoned, recorded, ref, type CampLine, type GameEvent } from "../types";

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

/**
 * Camp decisions for legs 2 to 4.
 *
 * One per leg, and each one is about something the leg has just done to the
 * household rather than a generic evening. The camp before the sea is the hardest
 * of the three, and it deliberately offers no good option.
 */
export const legs0204CampEvents: GameEvent[] = [
  {
    id: "camp-edge-of-the-wilderness",
    title: "The edge of it",
    body: "Etham. You can see where the green gives out — it is not a gradual thing, it is a line, and the camp is pitched on the last of the good side of it. {naamah} has been looking at that line since you arrived and has not said anything about it.",
    provenance: reasoned(
      "Exodus 13:20 and Numbers 33:6 both place Etham at the edge of the wilderness; what a household did on that last evening is invented.",
      ref("exodus", 13, "20"),
    ),
    choices: [
      {
        id: "sit-with-naamah",
        label: "Go and sit with {naamah}",
        provenance: invented(),
        outcome:
          "She tells you she was born in Egypt and has never in her life been further from a river than she is tonight. Then she tells you she is glad, and you cannot tell whether she means it.",
        effects: { morale: 5, trust: 5 },
      },
      {
        id: "check-the-loads",
        label: "Go through everything you are carrying, one more time",
        provenance: invented(),
        outcome:
          "You repack the whole household by firelight and throw out two things you will miss. Everything left is something you can justify carrying into that.",
        effects: { condition: -4, morale: 3 },
      },
      {
        id: "sleep-early",
        label: "Get everyone down early",
        provenance: invented(),
        outcome:
          "You put the fire out before anyone is ready and make them lie down. They grumble. They are also the only family near you that wakes up rested.",
        effects: { condition: 8, morale: -3 },
      },
    ],
  },
  {
    id: "camp-in-front-of-migdol",
    title: "Camped where you can be seen",
    body: "The fires are lit in a long line along the shore because that is where the order put them, in the open, in front of the water, with the fort up on the shoulder of the hill behind. Anyone standing at Migdol tonight can count you.",
    provenance: reasoned(
      "Exodus 14:2 places the camp before Pi-hahiroth between Migdol and the sea; how it felt to camp visibly in the open is invented.",
      ref("exodus", 14, "2"),
    ),
    choices: [
      {
        id: "small-fire",
        label: "Keep your fire small",
        provenance: invented(),
        outcome:
          "You bank it down until it is barely worth having. It does nothing for anybody's safety and a great deal for your own peace of mind, which you decide is a fair trade.",
        effects: { condition: -3, morale: 3 },
      },
      {
        id: "big-fire",
        label: "Build it up and let them see it",
        provenance: invented(),
        outcome:
          "You put everything burnable on it. {elon} asks whether that is wise and you tell him you are done creeping about, and he sits a little straighter for the rest of the evening.",
        effects: { morale: 6, trust: 4, condition: -2 },
      },
    ],
  },
  {
    id: "camp-the-night-of-the-wind",
    title: "The last night on this side",
    body: "The wind has been up for an hour and it is not dropping. There is an army camped behind a cloud at one end of the shore and a sea at the other, and your household is looking at you as though you have somewhere to put them.",
    provenance: reasoned(
      "The east wind blowing all night is recorded; a household's last evening on the Egyptian shore is invented around it.",
      ref("exodus", 14, "21"),
    ),
    choices: [
      {
        id: "tell-them-a-story",
        label: "Tell them about Joseph",
        provenance: invented(),
        outcome:
          "You tell the whole thing badly, over the wind, and get half of it wrong. {milcah} falls asleep before the good part. {tirzah} does not, and looks at you differently afterwards.",
        effects: { morale: 7, trust: 4 },
      },
      {
        id: "keep-watch",
        label: "Stay awake and watch the shore",
        provenance: invented(),
        outcome:
          "You sit up the whole night with your back to your sleeping family and your eyes on the dark. Nothing comes. You are ruined in the morning.",
        effects: { condition: -12, trust: 7 },
      },
      {
        id: "say-nothing",
        label: "Admit you have nothing to tell them",
        provenance: invented(),
        outcome:
          "You say it straight out — that you do not know what happens tomorrow and that you are frightened too. Nobody thanks you. Nobody has to ask you again either.",
        effects: { morale: -4, trust: 9 },
      },
    ],
  },
];

/**
 * Camp decisions for legs 5 to 8.
 *
 * The evening at Marah is deliberately the emptiest of these — the household has
 * just been through the set piece and there is nothing left to decide except who
 * gets looked after. The evening in the wilderness of Sin is the opposite: it is
 * the first manna morning, and the camp screen has a basket on it from here on.
 */
export const legs0508CampEvents: GameEvent[] = [
  {
    id: "camp-after-the-sweet-water",
    title: "The night after Marah",
    body: "Everyone has drunk and nobody is talking much. {naamah} is asleep sitting up. There is a taste of something in the water still, not bitterness exactly, and nobody mentions it.",
    provenance: reasoned(
      "The water at Marah being made sweet is recorded; the evening after it inside one household is invented.",
      ref("exodus", 15, "25"),
    ),
    choices: [
      {
        id: "let-her-sleep",
        label: "Leave {naamah} where she is",
        provenance: invented(),
        outcome:
          "You put something under her head and leave her sitting up by the fire, because moving her would wake her and she has earned the sleep more than she has earned a better position.",
        effects: { morale: 4, trust: 4 },
      },
      {
        id: "wake-her-to-drink",
        label: "Wake her and make her drink more",
        provenance: invented(),
        outcome:
          "She is furious about it for as long as it takes to drink, and considerably better in the morning than the people who were left alone.",
        effects: { condition: 9, trust: -3 },
      },
    ],
  },
  {
    id: "camp-under-the-palms",
    title: "Elim, and nobody wants to leave",
    body: "Second night under the palms. The column is meant to move tomorrow and the camp has quietly decided it is not certain about that. {elon} asks, reasonably, why anyone would leave somewhere with water to go somewhere without it.",
    provenance: reasoned(
      "Elim's twelve springs and seventy palms are recorded, and the column does move on; the reluctance to leave is invented.",
      ref("exodus", 15, "27"),
    ),
    choices: [
      {
        id: "answer-him-straight",
        label: "Tell him this was never where you were going",
        provenance: invented(),
        outcome:
          "He does not like the answer. He does understand it, which is different, and he is packed before you are in the morning.",
        effects: { trust: 6, morale: -3 },
      },
      {
        id: "let-it-lie",
        label: "Tell him to enjoy the water while it is here",
        provenance: invented(),
        outcome:
          "It is good advice for tonight and it is not an answer, and the pair of you both know which of those it was.",
        effects: { morale: 5, trust: -2 },
      },
    ],
  },
  {
    id: "camp-first-manna-night",
    title: "The evening before the bread",
    body: "The wilderness of Sin, a month out of Egypt, and the food is gone. Word has come round that something will fall in the morning and that everyone is to go out and gather a day's worth of it. Nobody in this camp has ever heard of such a thing and everybody intends to be up early.",
    provenance: recorded(ref("exodus", 16, "1"), ref("exodus", 16, "4")),
    choices: [
      {
        id: "set-them-to-wake-early",
        label: "Tell your household you are all going out at first light",
        provenance: invented(),
        outcome:
          "You say it twice, and you say what a day's portion means, and you can see at least one of them deciding privately to gather more than that.",
        effects: { trust: 5 },
      },
      {
        id: "believe-it-when-you-see-it",
        label: "Say you will believe it when you see it",
        provenance: invented(),
        outcome:
          "It is an honest position and it gets a laugh, and it will look considerably less clever from about halfway through tomorrow morning.",
        effects: { morale: 4, trust: -4 },
      },
    ],
  },
];

/**
 * Camp decisions for legs 9 to 12 — the last of the itinerary.
 *
 * The night before the mountain is the one that has to carry the ending. It asks
 * the player to look at the household they arrived with rather than at Sinai, which
 * is what the whole episode has actually been about.
 */
export const legs0912CampEvents: GameEvent[] = [
  {
    id: "camp-the-first-sabbath",
    title: "A day with nothing to do in it",
    body: "Nobody gathers, nobody packs, nobody walks. The camp is enormous and completely still, and after seven weeks of moving every single day your household has no idea what to do with itself.",
    provenance: recorded(ref("exodus", 16, "29-30")),
    choices: [
      {
        id: "sit-still",
        label: "Sit still and let it be strange",
        provenance: invented(),
        outcome:
          "You do nothing, badly, for a whole day. By the evening you have stopped listening for the order to move and something in your shoulders has come down.",
        effects: { condition: 12, morale: 8 },
      },
      {
        id: "find-work",
        label: "Find something useful to do anyway",
        provenance: invented(),
        outcome:
          "You mend and sort and repack and are the most rested-looking exhausted person in the camp. {tirzah} watches you do it and does not say anything, which is its own comment.",
        effects: { condition: 3, trust: -4 },
      },
    ],
  },
  {
    id: "camp-after-the-rock",
    title: "The night after the rock",
    body: "Everyone has drunk twice over and there is water standing in every vessel your household owns. {elon} wants to know whether that is going to happen every time. It is a fair question and you notice you do not want to answer it.",
    provenance: reasoned(
      "The water from the rock at Horeb is recorded; a household's evening afterwards, and this question, are invented.",
      ref("exodus", 17, "6"),
    ),
    choices: [
      {
        id: "promise-nothing",
        label: "Tell him you cannot promise that",
        provenance: invented(),
        outcome:
          "You say that it has happened twice and that twice is not a rule. He accepts it. He also drinks a great deal more before bed than he needs to.",
        effects: { trust: 7, morale: -3 },
      },
      {
        id: "tell-him-yes",
        label: "Tell him yes",
        provenance: invented(),
        outcome:
          "You say it because he is a child at the end of a frightening day and because you would like it to be true, and you lie awake for a while afterwards.",
        effects: { morale: 6, trust: -5 },
      },
    ],
  },
  {
    id: "camp-before-the-mountain",
    title: "The last night of the journey",
    body: "The tents are up in front of the mountain and there is nowhere else to walk to. Three months ago you were counting bricks against a quota. {tirzah} asks you, in the ordinary voice she uses for ordinary questions, whether you would do it again.",
    provenance: reasoned(
      "Israel camping before the mountain is recorded; the household's last evening of the journey is invented, and is the game's ending rather than the text's.",
      ref("exodus", 19, "2"),
    ),
    choices: [
      {
        id: "yes-again",
        label: "Say yes",
        provenance: invented(),
        outcome:
          "You say it without having to think, and then you spend a while afterwards checking whether you meant it. You did.",
        effects: { morale: 8, trust: 6 },
      },
      {
        id: "not-sure",
        label: "Say you do not know",
        provenance: invented(),
        outcome:
          "You count what it cost — the road, the thirst, the people at the back — and you tell her honestly that you cannot answer. She says that is fair, and stays sitting with you.",
        effects: { trust: 8, morale: -2 },
      },
      {
        id: "ask-her-back",
        label: "Ask her the same question",
        provenance: invented(),
        outcome:
          "She thinks about it for a long time, which frightens you, and then she says that she would, and that she is glad it was with you. You do not sleep much and you do not mind.",
        effects: { morale: 10, trust: 10 },
      },
    ],
  },
];

/**
 * Two more camps, so that no leg has to borrow another leg's evening.
 *
 * A camp decision is only offered once per run — the record of it is what carries
 * forward — so two legs sharing one leaves the second with a silent camp screen.
 */
export const sharedCampFixes: GameEvent[] = [
  {
    id: "camp-by-the-sea-again",
    title: "Back beside water, and nothing to do about it",
    body: "Camped by the sea, which after Marah ought to feel like something and does not, because it is the wrong kind of water and everybody knows it. {milcah} asks why you cannot drink this one either.",
    provenance: reasoned(
      "Numbers 33:10 records the camp by the Red Sea and nothing else about it; a household's evening there is invented.",
      ref("numbers", 33, "10"),
    ),
    choices: [
      {
        id: "explain-the-salt",
        label: "Explain about salt water",
        provenance: invented(),
        outcome:
          "You explain it twice and she believes you the second time. {elon} tries a mouthful behind your back to check, and then believes you as well.",
        effects: { morale: 4, trust: 3 },
      },
      {
        id: "let-them-swim",
        label: "Let them go in",
        provenance: invented(),
        outcome:
          "You let all three of them into the shallows and they come out salted and filthy and happier than they have been since Elim. It costs you the last of the fresh water rinsing them.",
        effects: { morale: 9, condition: -5 },
      },
    ],
  },
  {
    id: "camp-a-place-with-only-a-name",
    title: "Camped at Alush",
    body: "You arrive, and it is a place, and there is nothing here that anybody will ever write down. The tents go up in the same order they have gone up for a month. {naamah} says that she has stopped asking what anywhere is called.",
    provenance: reasoned(
      "Numbers 33:13 names Alush and records nothing else about it; a household's unremarkable evening there is invented, which is the honest response to a silent verse.",
      ref("numbers", 33, "13"),
    ),
    choices: [
      {
        id: "learn-the-name-anyway",
        label: "Make sure your household knows where they slept",
        provenance: invented(),
        outcome:
          "You make all four of them say it, because one day somebody is going to ask them where they went and you would like them to be able to answer properly.",
        effects: { morale: 4, trust: 4 },
      },
      {
        id: "let-it-go",
        label: "Let it be another night",
        provenance: invented(),
        outcome:
          "Nobody learns the name and nobody needs it. It is a night's sleep in a place, and there have been a great many of those, and they have all counted.",
        effects: { condition: 5 },
      },
    ],
  },
];
