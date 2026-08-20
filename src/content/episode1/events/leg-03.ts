import { invented, recorded, reasoned, ref, type GameEvent } from "../../types";

/**
 * Leg 3 — Etham to Pi-hahiroth. The leg where the column turns back.
 *
 * The strangest order in the whole route, and the text gives the reason outright:
 * Pharaoh is meant to think they are lost. Numbers 33:7 says they turned back;
 * Exodus 14:2-4 says why. So the household spends this leg walking the wrong
 * direction on purpose, without being told, and then watches an army arrive.
 *
 * Everything the player is offered here is a way of being wrong in good faith. That
 * is deliberate: it is the last leg before the sea, and the point of it is that no
 * amount of sensible reasoning gets you to the right conclusion from inside it.
 */
export const leg03Events: GameEvent[] = [
  {
    id: "the-order-to-turn-back",
    title: "Back the way you came",
    body: "The order comes down the line and nobody believes it the first time. Turn back. Camp by the sea, in front of Pi-hahiroth, with Migdol at your shoulder and Baal Zephon across the water. You have spent two days walking away from Egypt and you are being told to walk toward it.",
    provenance: recorded(ref("numbers", 33, "7"), ref("exodus", 14, "2")),
    choices: [
      {
        id: "turn-without-argument",
        label: "Turn your household around and say nothing",
        provenance: invented(),
        outcome:
          "You turn. {tirzah} looks at you once and then turns too, and the pair of you walk back past a rock you both recognise from this morning.",
        effects: { trust: 5, morale: -4 },
      },
      {
        id: "argue-it",
        label: "Say out loud that this is madness",
        provenance: invented(),
        outcome:
          "You are not the only one saying it and you are not the loudest. It changes nothing at all, and you feel better for about an hour.",
        effects: { morale: 5, trust: -5 },
      },
      {
        id: "explain-it-away",
        label: "Find a reason for it and tell it to your household",
        provenance: invented(),
        outcome:
          "You come up with something about water and about grazing. It is a good enough reason. It is not the reason, and you will find that out at the shore.",
        effects: { morale: 4, trust: -2 },
      },
    ],
    unlocks: ["pi-hahiroth"],
  },
  {
    id: "shut-in-by-the-wilderness",
    title: "The map anyone could draw",
    body: "By evening the camp has worked out its own position and does not care for it. Water in front. A fort at Migdol behind the shoulder of the hill. Desert on the other side. Somebody says the word trapped and it goes through the camp faster than any order has all week.",
    provenance: recorded(ref("exodus", 14, "3")),
    choices: [
      {
        id: "check-the-ground",
        label: "Walk the edge of the camp yourself and see",
        provenance: invented(),
        outcome:
          "You go and look, because you would rather know. It is exactly as bad as they say. You come back and you are careful about your face.",
        effects: { condition: -4, trust: 4, morale: -3 },
      },
      {
        id: "keep-it-from-them",
        label: "Keep the word away from your household",
        provenance: invented(),
        outcome:
          "You steer the conversation for an entire evening. {milcah} asks you outright at the end of it and you do not lie, quite.",
        effects: { morale: 3, trust: -3 },
      },
      {
        id: "say-it-plainly",
        label: "Tell them where you are and let them sit with it",
        provenance: invented(),
        outcome:
          "You lay it out — water, fort, desert — and then you sit down with them and none of you says anything for a while. It is not comfort. It is company.",
        effects: { morale: -5, trust: 7 },
      },
    ],
  },
  {
    id: "six-hundred-chariots",
    title: "Dust on the road behind",
    body: "It is the wrong colour for weather and it is coming from the west and it is moving far too quickly to be people walking. By the time anyone says the word chariots you can already count them, and counting them is worse.",
    provenance: recorded(ref("exodus", 14, "6-7"), ref("exodus", 14, "9")),
    choices: [
      {
        id: "get-them-moving",
        label: "Get your household up and toward the water",
        provenance: invented(),
        outcome:
          "You have them on their feet with everything carryable carried before most families have finished arguing about it. Then you stand there, because there is nowhere further to go.",
        effects: { condition: -6, trust: 5 },
      },
      {
        id: "hold-position",
        label: "Stay exactly where you are",
        provenance: invented(),
        outcome:
          "You keep them still and low and together. Around you the camp comes apart into running and shouting, and none of the running goes anywhere.",
        effects: { morale: -4, trust: 3 },
      },
      {
        id: "look-for-moses",
        label: "Go and find out what Moses is doing",
        provenance: invented(),
        outcome:
          "You get near enough to see him and no nearer. He is not running. That is the single most useful thing you learn all evening.",
        effects: { condition: -5, morale: 6 },
      },
    ],
    unlocks: ["pharaohs-change-of-mind"],
  },

  // --- Pool: ordinary life ---------------------------------------------------
  {
    id: "the-child-who-will-not-walk",
    title: "{milcah} sits down",
    body: "She does not announce it or make a scene. She simply sits down in the road with her arms round her knees and stops, in the middle of a column of several hundred thousand people who are all going the other way from where they went this morning.",
    provenance: invented(),
    choices: [
      {
        id: "carry-her",
        label: "Pick her up and carry her",
        provenance: invented(),
        outcome:
          "She is heavier than she was a week ago or you are lighter. She falls asleep on your shoulder within a quarter of a mile.",
        effects: { condition: -9, trust: 6, morale: 3 },
      },
      {
        id: "wait-her-out",
        label: "Sit down beside her until she is ready",
        provenance: invented(),
        outcome:
          "You sit in the road and let the column go past. It costs you the best part of an hour and she gets up on her own, which she needed to do.",
        effects: { morale: 5 },
      },
      {
        id: "make-her-walk",
        label: "Tell her to get up",
        provenance: invented(),
        outcome:
          "She gets up. She walks the rest of the afternoon a little way apart from you and does not take your hand at the camp.",
        effects: { trust: -7, condition: 3 },
      },
    ],
  },
  {
    id: "hotep-at-the-back",
    title: "Hotep asks a question",
    body: "The Egyptian who has been walking near your fire since Succoth catches you up. He wants to know, quietly, what happens to a man like him if that dust behind you turns out to be his own people coming to take everybody home.",
    provenance: reasoned(
      "Exodus 12:38 records that a mixed multitude went up with Israel. Hotep is invented to stand in that line; what such a man feared when Pharaoh's army appeared is not recorded anywhere.",
      ref("exodus", 12, "38"),
    ),
    choices: [
      {
        id: "tell-him-he-is-ours",
        label: "Tell him he walks with your household",
        provenance: invented(),
        outcome:
          "He does not say anything to that. He walks beside {eliab} for the rest of the day, a half-step back, the way somebody walks when they have been given something they cannot pay for.",
        effects: { morale: 5, trust: 4 },
      },
      {
        id: "tell-him-you-dont-know",
        label: "Tell him you have no idea",
        provenance: invented(),
        outcome:
          "It is the truth and he takes it as the truth, and it costs him something to hear. He thanks you for not making it up.",
        effects: { trust: 3, morale: -2 },
      },
    ],
    unlocks: ["mixed-multitude"],
  },
];
