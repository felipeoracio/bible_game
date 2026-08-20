import { recorded, reasoned, ref, type CodexEntry } from "../../types";

/**
 * Codex entries for legs 5 to 8 — the far shore to the wilderness of Sin.
 *
 * Two of these are doing a job the earlier entries did not have to. "A day's
 * portion" is the manna explainer that F10 could not ship, because an entry has to
 * be unlockable and there was no leg to unlock it from. And "By the Red Sea" is the
 * first entry in the episode whose honest subject is how little the text says.
 */
export const legs0508Codex: CodexEntry[] = [
  {
    id: "the-song-of-the-sea",
    title: "The song at the sea",
    kind: "event",
    note: "The first thing Israel does on the far shore is sing, and the account gives the whole song — it is one of the oldest pieces of poetry in the Bible. Then it adds a detail that is easy to walk past: Miriam, called a prophetess and Aaron's sister, takes a tambourine, and all the women go out after her with tambourines and with dancing. She sings them the first line back. Four days earlier these people were slaves. Read what comes four verses later, though: three days in the wilderness, and no water.",
    provenance: recorded(ref("exodus", 15, "1"), ref("exodus", 15, "20-21")),
    passages: [ref("exodus", 15, "1-2"), ref("exodus", 15, "20-21")],
    related: ["the-crossing-note", "marah-note"],
  },
  {
    id: "the-statute-at-marah",
    title: "The statute at Marah",
    kind: "note",
    note: "After the water is made sweet, and only after, something is set down at Marah — a statute and an ordinance, and a testing. If you will listen to God's voice and do what is right in his eyes, the diseases put on Egypt will not be put on you. The order matters and is worth noticing. The water came first. It was not payment for keeping anything, because there was nothing to keep yet.",
    provenance: recorded(ref("exodus", 15, "25"), ref("exodus", 15, "26")),
    passages: [ref("exodus", 15, "25-26")],
    related: ["marah-note", "elim"],
  },
  {
    id: "elim",
    title: "Elim",
    kind: "waypoint",
    note: "Twelve springs of water and seventy palm trees. Both Exodus and Numbers give the same two numbers, which is unusual — the itinerary is normally content to name a place and move on. Coming immediately after three waterless days and a pool nobody could drink from, the detail reads less like geography and more like someone counting their blessings very precisely. Where Elim stood is not certain.",
    provenance: recorded(ref("exodus", 15, "27"), ref("numbers", 33, "9")),
    passages: [ref("exodus", 15, "27"), ref("numbers", 33, "9")],
    related: ["marah-note", "the-red-sea-camp", "how-far-was-it"],
  },
  {
    id: "the-red-sea-camp",
    title: "By the Red Sea",
    kind: "waypoint",
    note: "This camp gets one line in the whole Bible: they travelled from Elim and camped by the Red Sea. That is all of it. No event, no complaint, no miracle, no date. Most of the stages in Numbers 33 are like this, and it is worth saying plainly what the game does about it — almost everything that happens to your household on this leg is invented, because there is nothing recorded to build it out of. A quiet stage is the honest reading of a silent verse, and not every day of the Exodus was a crisis.",
    provenance: recorded(ref("numbers", 33, "10")),
    passages: [ref("numbers", 33, "10")],
    related: ["elim", "how-far-was-it", "wilderness-of-sin"],
  },
  {
    id: "wilderness-of-sin",
    title: "The wilderness of Sin",
    kind: "waypoint",
    note: "Between Elim and Sinai, on the fifteenth day of the second month after leaving Egypt. That date is one of the few in the whole journey, and it puts the household exactly a month on the road. It is also where the food runs out. Nothing to do with the place called Sinai, and nothing to do with the English word — it is simply the name of the desert.",
    provenance: recorded(ref("exodus", 16, "1"), ref("numbers", 33, "11")),
    passages: [ref("exodus", 16, "1"), ref("numbers", 33, "11")],
    related: ["the-murmuring", "a-days-portion", "the-red-sea-camp"],
  },
  {
    id: "the-murmuring",
    title: "The meat pots of Egypt",
    kind: "event",
    note: "A month out, the whole congregation complains against Moses and Aaron, and what they say is worth reading closely: better to have died by God's hand in Egypt, where we sat by the meat pots and ate bread until we had had enough, than to be brought into this wilderness to kill this assembly with hunger. It is not really a memory. These were slaves under a straw quota whose sons were being killed. Hunger has rewritten Egypt into somewhere with enough to eat, which is a thing hunger does, and the account records it without comment.",
    provenance: recorded(ref("exodus", 16, "2-3")),
    passages: [ref("exodus", 16, "2-3")],
    related: ["wilderness-of-sin", "a-days-portion"],
  },
  {
    id: "a-days-portion",
    title: "A day's portion, every day",
    kind: "note",
    note: "The rules for the manna are unusually exact, and the game follows them rather than inventing any. An omer a head, gathered morning by morning. Whoever gathered much had nothing over and whoever gathered little had no lack, so there is nothing here to be good at. Anything kept until morning bred worms and stank — except on the sixth day, when twice as much fell and the second portion kept overnight, because the seventh was a Sabbath and none fell on it. Some people went out on the seventh anyway and found none. The account says outright that this was the test: not the hunger, the gathering.",
    provenance: recorded(
      ref("exodus", 16, "4-5"),
      ref("exodus", 16, "16-21"),
      ref("exodus", 16, "22-27"),
    ),
    passages: [ref("exodus", 16, "14-21"), ref("exodus", 16, "22-27")],
    related: ["the-murmuring", "wilderness-of-sin", "what-the-player-cannot-change"],
  },
  {
    id: "how-long-a-day",
    title: "How long was a day's march?",
    kind: "note",
    note: "Exodus 15:22 says three days' journey in the wilderness of Shur, and Exodus 16:1 dates the arrival in the wilderness of Sin to a month out of Egypt. Those are the only two measures of time the route gives, and there is nothing anywhere about distance. So the game reasons the rest: a large mixed column with children, livestock and everything it owns, doing something like twenty kilometres on a good day and considerably less on a bad one. One thing to be straight about — your own day counter will reach the wilderness of Sin well before day thirty, because the game walks the stages back to back and the real journey plainly did not. There were days of rest this account does not describe, and the distances between these camps are almost certainly longer than any map we can draw with confidence. The date in the text is right. The number at the top of your screen is the game's, and it is short.",
    provenance: reasoned(
      "Exodus 15:22 gives three days' journey and Exodus 16:1 gives a date one month out; no distance appears anywhere in the route, so every kilometre figure in the game is derived from those two time markers and an estimated pace.",
      ref("exodus", 15, "22"),
      ref("exodus", 16, "1"),
    ),
    passages: [ref("exodus", 15, "22"), ref("exodus", 16, "1")],
    related: ["how-far-was-it", "wilderness-of-sin"],
  },
];
