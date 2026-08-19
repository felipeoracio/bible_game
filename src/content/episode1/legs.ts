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
    unlocks: ["how-far-was-it"],
    quiz: "quiz-leg-01",
  },
];
