import { reasoned, ref, type Leg } from "../types";

/**
 * The twelve legs of Episode 1, from the itinerary in Numbers 33.
 *
 * The camps and their order are recorded. The distances are not — Numbers 33 is a
 * list of stages with no measurements attached — so every `distance` here is
 * reasoned and carries the reasoning with it. See the Codex entry "How far was it?".
 *
 * Legs 2 to 12 land in F14. Leg 1 is authored in full as the sample the artist,
 * the developer, and the reviewer all work from.
 */
export const legs: Leg[] = [
  {
    id: "leg-01-rameses-succoth",
    index: 1,
    from: "Rameses",
    to: "Succoth",
    distanceKm: 30,
    distance: reasoned(
      "Numbers 33 records the stage from Rameses to Succoth without a distance. Thirty kilometres is a long but plausible first push for a large group leaving in haste overnight, and rests on the proposed identifications of both sites — neither of which is settled.",
      ref("numbers", 33, "5"),
    ),
    terrain: "delta-marsh",
    backdrop: "/art/leg-01-rameses-succoth.webp",
    scripted: [
      { eventId: "pharaohs-summons", atProgress: 0 },
      { eventId: "the-dough-unrisen", atProgress: 0.35 },
      { eventId: "the-asking", atProgress: 0.7 },
      { eventId: "the-last-canal", atProgress: 0.88 },
    ],
    pool: ["hotep-asks-to-walk", "a-strap-gives-way"],
    camp: ["camp-first-night"],
    waypoint: "succoth",
    unlocks: ["how-far-was-it", "which-road-is-this", "the-rearmost"],
    quiz: "quiz-leg-01",
  },
  {
    id: "leg-02-succoth-etham",
    index: 2,
    from: "Succoth",
    to: "Etham",
    distanceKm: 26,
    distance: reasoned(
      "Numbers 33:6 and Exodus 13:20 both record the stage from Succoth to Etham without a distance. Twenty-six kilometres is a day's march for a column that has had one night's rest, and rests on identifications for both sites that are not settled.",
      ref("numbers", 33, "6"),
    ),
    terrain: "coastal-sand",
    scripted: [
      { eventId: "the-long-way-round", atProgress: 0.15 },
      { eventId: "josephs-bones", atProgress: 0.5 },
      { eventId: "the-pillar", atProgress: 0.82 },
    ],
    pool: ["the-last-of-the-egyptian-bread", "the-egyptian-jewellery"],
    camp: ["camp-edge-of-the-wilderness"],
    waypoint: "etham",
    unlocks: ["why-not-the-short-road"],
    quiz: "quiz-leg-02",
  },
  {
    id: "leg-03-etham-pi-hahiroth",
    index: 3,
    from: "Etham",
    to: "Pi-hahiroth",
    distanceKm: 22,
    distance: reasoned(
      "Numbers 33:7 records that they turned back from Etham to camp before Pi-hahiroth, and gives no distance. Twenty-two kilometres reflects a stage walked partly backwards over ground already covered; none of Pi-hahiroth, Migdol or Baal Zephon has been identified with confidence.",
      ref("numbers", 33, "7"),
    ),
    terrain: "coastal-sand",
    scripted: [
      { eventId: "the-order-to-turn-back", atProgress: 0.05 },
      { eventId: "shut-in-by-the-wilderness", atProgress: 0.55 },
      { eventId: "six-hundred-chariots", atProgress: 0.9 },
    ],
    pool: ["the-child-who-will-not-walk", "hotep-at-the-back"],
    camp: ["camp-in-front-of-migdol"],
    waypoint: "pi-hahiroth",
    unlocks: ["pharaohs-change-of-mind"],
    quiz: "quiz-leg-03",
  },
  {
    id: "leg-04-the-crossing",
    index: 4,
    from: "Pi-hahiroth",
    to: "the far shore",
    distanceKm: 12,
    distance: reasoned(
      "Numbers 33:8 puts the crossing, three days in the wilderness and the arrival at Marah into one stage. This game makes the crossing its own short leg so that it and Marah can each be played properly; the twelve kilometres are the game's, not the text's.",
      ref("numbers", 33, "8"),
    ),
    terrain: "coastal-sand",
    scripted: [
      { eventId: "the-cloud-moves-behind", atProgress: 0.2 },
      { eventId: "the-wind-all-night", atProgress: 0.5 },
    ],
    /*
     * The sea. Fires at three quarters, so there is a little walking on the far
     * side before the leg ends — arriving the instant the water closes would give
     * the player nowhere to put it down.
     */
    setPiece: { setPieceId: "the-crossing", atProgress: 0.75 },
    pool: ["the-neighbours-who-are-leaving"],
    camp: ["camp-the-night-of-the-wind"],
    waypoint: "the-far-shore",
    quiz: "quiz-leg-04",
  },
  {
    id: "leg-05-marah",
    index: 5,
    from: "the far shore",
    to: "Marah",
    distanceKm: 54,
    distance: reasoned(
      "Exodus 15:22 records three days' journey in the wilderness of Shur before Marah — one of only two time measures the whole route gives. Fifty-four kilometres is three short days for a column already short of water; the figure is ours, the three days are not.",
      ref("exodus", 15, "22"),
      ref("numbers", 33, "8"),
    ),
    terrain: "open-desert",
    scripted: [
      { eventId: "the-song-at-the-sea", atProgress: 0.02 },
      { eventId: "the-first-dry-day", atProgress: 0.3 },
      { eventId: "the-second-dry-day", atProgress: 0.6 },
    ],
    // Three dry days, and then the pool. The relief F9 was built for.
    setPiece: { setPieceId: "marah", atProgress: 0.9 },
    pool: ["the-taste-of-salt", "hotep-on-the-far-side"],
    camp: ["camp-after-the-sweet-water"],
    waypoint: "marah-note",
    unlocks: ["the-song-of-the-sea", "how-long-a-day"],
    quiz: "quiz-leg-05",
  },
  {
    id: "leg-06-elim",
    index: 6,
    from: "Marah",
    to: "Elim",
    distanceKm: 18,
    distance: reasoned(
      "Numbers 33:9 records the stage from Marah to Elim with no distance. Eighteen kilometres is a short stage for a column that has just been watered and is walking toward more of it.",
      ref("numbers", 33, "9"),
    ),
    terrain: "rocky-wadi",
    scripted: [
      { eventId: "word-from-the-pool", atProgress: 0.1 },
      { eventId: "twelve-springs-and-seventy-palms", atProgress: 0.85 },
    ],
    pool: ["the-sandal-that-will-not-last"],
    camp: ["camp-under-the-palms"],
    waypoint: "elim",
    unlocks: ["the-statute-at-marah"],
    quiz: "quiz-leg-06",
  },
  {
    id: "leg-07-red-sea",
    index: 7,
    from: "Elim",
    to: "the Red Sea",
    distanceKm: 24,
    distance: reasoned(
      "Numbers 33:10 is a single line — they travelled from Elim and camped by the Red Sea — with no distance and no events. Twenty-four kilometres is an ordinary day for a rested column.",
      ref("numbers", 33, "10"),
    ),
    terrain: "coastal-sand",
    scripted: [
      { eventId: "the-quiet-leg", atProgress: 0.35 },
      { eventId: "counting-the-days", atProgress: 0.75 },
    ],
    pool: ["a-child-asks-where-you-are-going"],
    camp: ["camp-by-the-sea-again"],
    waypoint: "the-red-sea-camp",
    quiz: "quiz-leg-07",
  },
  {
    id: "leg-08-wilderness-of-sin",
    index: 8,
    from: "the Red Sea",
    to: "the wilderness of Sin",
    distanceKm: 30,
    distance: reasoned(
      "Numbers 33:11 records the stage without a distance, and Exodus 16:1 dates the arrival to a month out of Egypt. Thirty kilometres fits the running total against that date; the date is recorded and the distance is ours.",
      ref("numbers", 33, "11"),
      ref("exodus", 16, "1"),
    ),
    terrain: "open-desert",
    scripted: [
      { eventId: "the-flesh-pots-of-egypt", atProgress: 0.45 },
      { eventId: "bread-from-the-sky", atProgress: 0.8 },
    ],
    /*
     * Exodus 16:1. The clock starts on arrival, so the first camp here is a manna
     * morning and the basket is on the camp screen from this leg onward.
     */
    beginsManna: true,
    pool: ["a-child-asks-where-you-are-going", "the-sandal-that-will-not-last"],
    camp: ["camp-first-manna-night"],
    waypoint: "wilderness-of-sin",
    unlocks: ["the-murmuring", "a-days-portion"],
    quiz: "quiz-leg-08",
  },
  {
    id: "leg-09-dophkah",
    index: 9,
    from: "the wilderness of Sin",
    to: "Dophkah",
    distanceKm: 22,
    distance: reasoned(
      "Numbers 33:12 gives the stage a name and nothing else — no distance, no duration, and no other mention of Dophkah anywhere in the Bible. Twenty-two kilometres is an ordinary stage; the figure is entirely ours.",
      ref("numbers", 33, "12"),
    ),
    terrain: "rocky-wadi",
    scripted: [
      { eventId: "the-sixth-day", atProgress: 0.2 },
      { eventId: "the-seventh-day", atProgress: 0.7 },
    ],
    pool: ["the-baskets-wear-out"],
    camp: ["camp-the-first-sabbath"],
    waypoint: "dophkah",
    unlocks: ["the-sabbath-in-the-wilderness"],
    quiz: "quiz-leg-09",
  },
  {
    id: "leg-10-alush",
    index: 10,
    from: "Dophkah",
    to: "Alush",
    distanceKm: 20,
    distance: reasoned(
      "Numbers 33:13 records the stage from Dophkah to Alush with no distance and no other detail; neither place appears anywhere else in Scripture. Twenty kilometres is the game's estimate of an unremarkable day.",
      ref("numbers", 33, "13"),
    ),
    terrain: "rocky-wadi",
    scripted: [
      { eventId: "a-place-with-only-a-name", atProgress: 0.25 },
      { eventId: "the-second-week", atProgress: 0.7 },
    ],
    pool: ["the-baskets-wear-out", "a-child-asks-where-you-are-going"],
    camp: ["camp-a-place-with-only-a-name"],
    waypoint: "alush",
    quiz: "quiz-leg-10",
  },
  {
    id: "leg-11-rephidim",
    index: 11,
    from: "Alush",
    to: "Rephidim",
    distanceKm: 26,
    distance: reasoned(
      "Numbers 33:14 records the stage to Rephidim and adds that there was no water there, but gives no distance. Twenty-six kilometres is the game's figure for a stage that ends thirsty.",
      ref("numbers", 33, "14"),
    ),
    terrain: "rocky-wadi",
    scripted: [
      { eventId: "no-water-at-rephidim", atProgress: 0.4 },
      // One choice only, so the water cannot be a reward for choosing well.
      { eventId: "the-rock-at-horeb", atProgress: 0.62 },
    ],
    /*
     * Two recorded crises land on this one stage. A leg may hold only one set piece,
     * so Amalek is it and the rock above is scripted — see `legs-09-12.ts`.
     */
    setPiece: { setPieceId: "rephidim", atProgress: 0.85 },
    pool: ["the-baskets-wear-out"],
    camp: ["camp-after-the-rock"],
    waypoint: "massah-and-meribah",
    quiz: "quiz-leg-11",
  },
  {
    id: "leg-12-sinai",
    index: 12,
    from: "Rephidim",
    to: "the wilderness of Sinai",
    distanceKm: 24,
    distance: reasoned(
      "Numbers 33:15 records the last stage without a distance, and Exodus 19:1 dates the arrival to the third month out of Egypt. Twenty-four kilometres is the game's figure; the month is the text's.",
      ref("numbers", 33, "15"),
      ref("exodus", 19, "1"),
    ),
    terrain: "mountain-approach",
    scripted: [
      { eventId: "jethro-arrives", atProgress: 0.25 },
      { eventId: "the-mountain", atProgress: 0.72 },
    ],
    // The last of the four, and the quietest: the household is placed under a judge.
    setPiece: { setPieceId: "jethro", atProgress: 0.9 },
    pool: ["hotep-at-the-mountain"],
    camp: ["camp-before-the-mountain"],
    waypoint: "the-wilderness-of-sinai",
    unlocks: ["jethro-note", "the-whole-itinerary"],
    quiz: "quiz-leg-12",
  },
];
