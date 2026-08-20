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
];
