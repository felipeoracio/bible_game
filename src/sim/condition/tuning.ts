import type { AgeBand, HeatBand, Pace } from "./types";

/**
 * Every number the model uses, in one place.
 *
 * All of these are starting placeholders to be balanced in playtest, not final
 * values. Nothing outside this object should contain a magic number — if a rule
 * needs tuning later, it needs to be tunable from here.
 */
export const TUNING = {
  waterDrainPerHour: 4.0,
  paceMultiplier: { steady: 1.0, pressing: 1.4, forced: 1.9 } satisfies Record<Pace, number>,
  heatMultiplier: {
    dawn: 0.6,
    morning: 0.9,
    midday: 1.8,
    afternoon: 1.5,
    evening: 0.8,
    night: 0.4,
  } satisfies Record<HeatBand, number>,
  ageMultiplier: { child: 1.3, adult: 1.0, elder: 1.35 } satisfies Record<AgeBand, number>,
  carryingWaterMultiplier: 1.8,

  bodyDrainPerHour: { basePressing: 1.2, lowWater: 2.0, collapsed: 5.0, carrying: 1.5 },
  nightWithoutRestBodyLoss: 15,

  spiritPerUneventfulLeg: -6,
  spiritPerHouseholdZeroEvent: -10,
  spiritPerDayThirsty: -4,
  contagionPerMurmurer: -3,
  spiritCommunalEvent: 20,
  spiritCampConversation: 25,
  spiritPeerSupport: { recipient: 10, helper: -5 },

  trustStragglingPressOn: -15,

  scarPenalty: 10,
  scarFloor: 40,

  defiantLegsToDeparture: 2,
  returnTrustThreshold: 50,
  returnMinimumLegs: 3,

  // --- Thresholds the spec states in prose ----------------------------------
  /** Water at which a collapsed member can stand again. */
  collapseExitWater: 20,
  /** Body at which a straggler can rejoin the column. */
  stragglingExitBody: 30,
  /** Trust at which a defiant member starts taking instruction again. */
  defiantExitTrust: 25,
  /** Below this, `body` drains at the low-water rate. */
  lowWaterThreshold: 25,
  /** Movement penalty while weakened. */
  weakenedSpeedMultiplier: 0.75,
  /** A peer needs this much spirit of their own to lift somebody else. */
  peerSupportMinimumSpirit: 70,
  /** What one night of rest returns to body. */
  restBodyGain: 20,
  /** Body cap imposed by an untreated persistent condition. */
  persistentConditionBodyCap: 60,
  /** Nights of treatment each persistent condition needs. */
  persistentConditionNights: { limp: 3, fever: 2, sunstruck: 2 },
} as const;
