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
    unlocks: ["how-far-was-it", "the-rearmost"],
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
    camp: ["camp-under-the-palms"],
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
];
