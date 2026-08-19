import { AXIS_MAX, type MemberState } from "./household";

/**
 * Manna — the signature mechanic (§5.4), and the one place where the game's rules
 * are simply Exodus 16's rules.
 *
 * The doc asks for a "morning gathering minigame". The text does not support the
 * obvious version of that. Exodus 16:18 is explicit that effort did not change the
 * outcome: "he who gathered much had nothing over, and he who gathered little had
 * no lack." A collect-as-many-as-you-can score would contradict the single verse it
 * exists to teach, so gathering here is not scored.
 *
 * What the text *does* record is three ways to get it wrong, and those are the game:
 *
 *   - keeping it overnight, and finding worms in it       (v19-20)
 *   - missing the morning, after the sun grew hot         (v21)
 *   - going out on the seventh day to find nothing there  (v26-27)
 *
 * So this is a system about daily discipline, not about harvesting. The player never
 * gathers *more*; they decide whether to go out, whether to trust that tomorrow's
 * portion will be there, and whether to prepare on the sixth day. Failing teaches
 * the passage far better than succeeding does, which is the whole point of putting
 * it in a game.
 */

/** An omer a head, every day, by the command in v16. */
export const OMER_PER_PERSON = 1;

/** The day the double portion falls and the only day laying food aside works. */
export const SIXTH_DAY = 6;

/** The day none falls at all. */
export const SABBATH = 7;

/**
 * Which day of the manna week it is, 1 through 7.
 *
 * Counted from the first morning manna fell rather than from the start of the
 * journey, because the seven-day pattern in the text begins there.
 */
export function dayInWeek(mannaDay: number): number {
  if (mannaDay < 1) return 0;
  return ((mannaDay - 1) % 7) + 1;
}

export interface MannaStore {
  /** Today's food. Breeds worms if it is still here at dawn. */
  fresh: number;
  /**
   * Held back from today's meal for tomorrow. Cannot be eaten today — that is what
   * laying it aside means — and only survives the night if it was set aside on the
   * sixth day.
   */
  laidAside: number;
  /** Which day of the week the laid-aside portion was set aside on. */
  laidAsideOn: number;
  /**
   * Whether the household has already been out this morning.
   *
   * Tracked separately from what is in the basket, because laying food aside
   * empties the basket without un-walking the morning — reading `fresh` here would
   * let a household gather, set it all aside, and go straight back out for more.
   */
  gatheredToday: boolean;
}

export const freshManna = (): MannaStore => ({
  fresh: 0,
  laidAside: 0,
  laidAsideOn: 0,
  gatheredToday: false,
});

const clamp = (value: number): number => Math.min(AXIS_MAX, Math.max(0, value));

/**
 * How much falls for this household today.
 *
 * An omer a head, twice that on the sixth day, and nothing on the seventh — the
 * amount is fixed by the household's size and the day, never by the player.
 */
export function portionFor(household: readonly MemberState[], mannaDay: number): number {
  const day = dayInWeek(mannaDay);
  if (day === SABBATH) return 0;
  const heads = household.length * OMER_PER_PERSON;
  return day === SIXTH_DAY ? heads * 2 : heads;
}

export interface GatherResult {
  manna: MannaStore;
  /** Omers actually taken up. */
  gathered: number;
  /** Why nothing came of it, when nothing did. */
  outcome: "gathered" | "melted" | "none-fell" | "already-gathered";
}

/**
 * Go out and gather.
 *
 * `inTime` is the only thing the player controls, and it is binary on purpose:
 * either the household was out before the sun grew hot or it was not. There is no
 * partial harvest, because v18 says there wasn't one.
 */
export function gather(
  manna: MannaStore,
  household: readonly MemberState[],
  mannaDay: number,
  inTime: boolean,
): GatherResult {
  const falling = portionFor(household, mannaDay);
  /*
   * The seventh day, checked before anything else — a household that prepared on
   * the sixth still has food in hand, and if it goes out anyway it must be told
   * that none fell rather than that it already has some. That is v27, and it is
   * the whole reason the button is not hidden on the Sabbath.
   */
  if (falling <= 0) return { manna, gathered: 0, outcome: "none-fell" };

  if (manna.gatheredToday) return { manna, gathered: 0, outcome: "already-gathered" };

  if (!inTime) return { manna, gathered: 0, outcome: "melted" };

  return {
    manna: { ...manna, fresh: falling, gatheredToday: true },
    gathered: falling,
    outcome: "gathered",
  };
}

export interface EatResult {
  manna: MannaStore;
  household: MemberState[];
  /** Omers eaten. */
  eaten: number;
  /** How much of what the household needed it actually got, 0 to 1. */
  satisfaction: number;
}

/**
 * The household eats its omer a head, from today's food only.
 *
 * What has been laid aside is deliberately out of reach. Holding food back means
 * going without tonight, which is what makes hoarding on an ordinary day a real
 * cost rather than a free hedge — and what makes the sixth-day command a genuine
 * act of trust rather than bookkeeping.
 */
export function eat(manna: MannaStore, household: readonly MemberState[]): EatResult {
  const need = household.length * OMER_PER_PERSON;
  if (need <= 0) return { manna, household: [...household], eaten: 0, satisfaction: 1 };

  const eaten = Math.min(manna.fresh, need);
  const satisfaction = eaten / need;
  const shortfall = 1 - satisfaction;

  const next = household.map((member) => {
    // Hunger is slower than thirst and shows in spirit as much as in body: the
    // complaint in v2-3 is that they would rather have died full in Egypt.
    const condition = clamp(member.condition + (shortfall > 0 ? -14 * shortfall : 2));
    const morale = clamp(member.morale + (shortfall > 0 ? -10 * shortfall : 1));
    return condition === member.condition && morale === member.morale
      ? member
      : { ...member, condition, morale };
  });

  return {
    manna: { ...manna, fresh: manna.fresh - eaten },
    household: next,
    eaten,
    satisfaction,
  };
}

/**
 * Keep some back for tomorrow, at the cost of tonight.
 *
 * Always allowed, and on any day but the sixth it is exactly the disobedience in
 * v19-20 — the household goes short this evening and finds worms in the morning
 * anyway. The system does not stop the player or warn them. `dawn` does the
 * teaching.
 */
export function layAside(manna: MannaStore, mannaDay: number, omers: number): MannaStore {
  const kept = Math.min(manna.fresh, Math.max(0, omers));
  if (kept <= 0) return manna;
  return {
    ...manna,
    fresh: manna.fresh - kept,
    laidAside: manna.laidAside + kept,
    laidAsideOn: dayInWeek(mannaDay),
  };
}

export interface DawnResult {
  manna: MannaStore;
  /** Omers that bred worms overnight. */
  spoiled: number;
  /** Omers that kept, because they were laid aside on the sixth day. */
  kept: number;
}

/**
 * Morning. Work out what survived the night.
 *
 * Anything still in the basket is foul by morning — that is the rule, and it is
 * what makes manna a discipline rather than a stockpile. The one exception is the
 * portion laid aside on the sixth day, which v24 says did not become foul and had
 * no worms in it. The exception is the whole point: it only holds when it was
 * given to hold.
 */
export function dawn(manna: MannaStore): DawnResult {
  const keeps = manna.laidAsideOn === SIXTH_DAY;
  const kept = keeps ? manna.laidAside : 0;
  const spoiled = manna.fresh + (keeps ? 0 : manna.laidAside);

  return {
    // What kept becomes today's food; the basket is otherwise empty and the
    // household has to go out again, morning by morning.
    manna: { fresh: kept, laidAside: 0, laidAsideOn: 0, gatheredToday: false },
    spoiled,
    kept,
  };
}

/** Omers in hand, for the HUD. */
export function omersHeld(manna: MannaStore): number {
  return manna.fresh + manna.laidAside;
}

/**
 * Whether the household has food for today without going out.
 *
 * True only on the Sabbath morning of a week they prepared for — which is exactly
 * the situation the sixth-day command exists to produce.
 */
export function isProvidedFor(manna: MannaStore, household: readonly MemberState[]): boolean {
  return omersHeld(manna) >= household.length * OMER_PER_PERSON;
}
