import { describe, expect, it } from "vitest";
import {
  dawn,
  dayInWeek,
  eat,
  freshManna,
  gather,
  isProvidedFor,
  layAside,
  omersHeld,
  portionFor,
  SABBATH,
  SIXTH_DAY,
} from "./manna";
import { freshMember, type MemberState } from "./household";

const family = (): MemberState[] => [
  freshMember("eliab", "head"),
  freshMember("tirzah", "spouse"),
  freshMember("elon", "child"),
  freshMember("milcah", "child"),
  freshMember("naamah", "elder"),
];

/** Gather, then eat — the ordinary weekday, done in one line. */
const aDay = (manna: ReturnType<typeof freshManna>, day: number, inTime = true) => {
  const g = gather(manna, family(), day, inTime);
  return eat(g.manna, family());
};

describe("the week", () => {
  it("runs one through seven from the first morning manna fell", () => {
    expect(dayInWeek(1)).toBe(1);
    expect(dayInWeek(6)).toBe(SIXTH_DAY);
    expect(dayInWeek(7)).toBe(SABBATH);
    expect(dayInWeek(8)).toBe(1);
    expect(dayInWeek(13)).toBe(SIXTH_DAY);
  });
});

describe("what falls", () => {
  /** "an omer a head, according to the number of your persons" — v16. */
  it("is an omer a head", () => {
    expect(portionFor(family(), 1)).toBe(5);
  });

  it("follows the size of the household and nothing else", () => {
    const smaller = family().slice(0, 3);
    expect(portionFor(smaller, 1)).toBe(3);
  });

  /** "On the sixth day, they gathered twice as much bread, two omers for each one" — v22. */
  it("falls double on the sixth day", () => {
    expect(portionFor(family(), 6)).toBe(10);
  });

  /** "Six days you shall gather it, but on the seventh day is the Sabbath. In it there shall be none." — v26. */
  it("does not fall at all on the seventh", () => {
    expect(portionFor(family(), 7)).toBe(0);
  });
});

describe("gathering", () => {
  /**
   * "he who gathered much had nothing over, and he who gathered little had no lack" — v18.
   * The verse this whole system is arranged around: effort changes nothing.
   */
  it("yields the same portion however the morning is worked", () => {
    const a = gather(freshManna(), family(), 1, true);
    const b = gather(freshManna(), family(), 1, true);
    expect(a.gathered).toBe(b.gathered);
    expect(a.gathered).toBe(portionFor(family(), 1));
  });

  /** "When the sun grew hot, it melted." — v21. */
  it("finds nothing left once the morning is missed", () => {
    const result = gather(freshManna(), family(), 1, false);
    expect(result.outcome).toBe("melted");
    expect(result.gathered).toBe(0);
    expect(omersHeld(result.manna)).toBe(0);
  });

  /** "On the seventh day, some of the people went out to gather, and they found none." — v27. */
  it("lets the household go out on the seventh and find none", () => {
    const result = gather(freshManna(), family(), 7, true);
    expect(result.outcome).toBe("none-fell");
    expect(result.gathered).toBe(0);
  });

  /**
   * A household that prepared still has food in hand on the Sabbath morning. If it
   * goes out anyway it must hear that none fell — not that it already has some.
   */
  it("says none fell on the seventh even to a household that prepared", () => {
    const prepared = { fresh: 5, laidAside: 0, laidAsideOn: 0, gatheredToday: false };
    expect(gather(prepared, family(), 7, true).outcome).toBe("none-fell");
  });

  it("cannot be worked twice in one morning", () => {
    const once = gather(freshManna(), family(), 1, true);
    const twice = gather(once.manna, family(), 1, true);
    expect(twice.outcome).toBe("already-gathered");
    expect(omersHeld(twice.manna)).toBe(once.gathered);
  });

  /**
   * Emptying the basket does not un-walk the morning. Without this, a household
   * could gather, set the lot aside, and go straight back out — farming as much
   * manna as it liked, which is the exact opposite of what v18 describes.
   */
  it("cannot be worked again by laying the basket aside first", () => {
    const gathered = gather(freshManna(), family(), 1, true).manna;
    const emptied = layAside(gathered, 1, 999);
    expect(emptied.fresh).toBe(0);

    const again = gather(emptied, family(), 1, true);
    expect(again.outcome).toBe("already-gathered");
    expect(omersHeld(again.manna)).toBe(5);
  });
});

describe("eating", () => {
  it("takes an omer a head and leaves the basket empty on an ordinary day", () => {
    const { manna, satisfaction, eaten } = aDay(freshManna(), 1);
    expect(eaten).toBe(5);
    expect(satisfaction).toBe(1);
    expect(omersHeld(manna)).toBe(0);
  });

  it("leaves the household fed, so a day eaten costs nothing", () => {
    const { household } = aDay(freshManna(), 1);
    for (const member of household) expect(member.condition).toBe(100);
  });

  it("costs body and spirit both when there is nothing to eat", () => {
    const { household, satisfaction } = eat(freshManna(), family());
    expect(satisfaction).toBe(0);
    for (const member of household) {
      expect(member.condition).toBeLessThan(100);
      expect(member.morale).toBeLessThan(100);
    }
  });

  /**
   * Laying food aside has to cost something tonight, or it is a free hedge and the
   * sixth-day command stops being an act of trust.
   */
  it("will not touch what has been laid aside, however hungry the household", () => {
    const store = { fresh: 0, laidAside: 5, laidAsideOn: SIXTH_DAY, gatheredToday: true };
    const { manna, satisfaction, eaten } = eat(store, family());
    expect(eaten).toBe(0);
    expect(satisfaction).toBe(0);
    expect(manna.laidAside).toBe(5);
  });

  it("goes short tonight by exactly what was held back", () => {
    const gathered = gather(freshManna(), family(), 1, true).manna;
    const held = layAside(gathered, 1, 2);
    const { satisfaction } = eat(held, family());
    expect(satisfaction).toBeCloseTo(3 / 5);
  });

  it("half a portion is better than none and worse than a meal", () => {
    const half = eat({ fresh: 2, laidAside: 0, laidAsideOn: 0, gatheredToday: true }, family());
    const none = eat(freshManna(), family());
    expect(half.satisfaction).toBeGreaterThan(none.satisfaction);
    expect(half.household[0]!.condition).toBeGreaterThan(none.household[0]!.condition);
    expect(half.household[0]!.condition).toBeLessThan(100);
  });
});

describe("keeping it overnight", () => {
  /** "it bred worms, and became foul: and Moses was angry with them" — v19-20. */
  it("breeds worms in anything held back on an ordinary day", () => {
    const gathered = gather(freshManna(), family(), 1, true).manna;
    const hoarded = layAside(gathered, 1, 5);
    const morning = dawn(hoarded);
    expect(morning.spoiled).toBe(5);
    expect(morning.kept).toBe(0);
    expect(omersHeld(morning.manna)).toBe(0);
  });

  it("spoils an untouched basket just the same, laid aside or not", () => {
    const gathered = gather(freshManna(), family(), 1, true).manna;
    const morning = dawn(gathered);
    expect(morning.spoiled).toBe(5);
    expect(omersHeld(morning.manna)).toBe(0);
  });

  /** "They laid it up until the morning ... and it didn't become foul" — v24. */
  it("keeps what was laid aside on the sixth day", () => {
    // Twice as much falls; half is set aside, and the household still eats its fill.
    const sixth = gather(freshManna(), family(), SIXTH_DAY, true).manna;
    expect(sixth.fresh).toBe(10);
    const prepared = layAside(sixth, SIXTH_DAY, 5);
    const supper = eat(prepared, family());
    expect(supper.satisfaction).toBe(1);

    const morning = dawn(supper.manna);
    expect(morning.spoiled).toBe(0);
    expect(morning.kept).toBe(5);
    // What kept is today's food, ready to eat without going out.
    expect(morning.manna.fresh).toBe(5);
  });

  it("never lays aside more than is actually in the basket", () => {
    const gathered = gather(freshManna(), family(), 1, true).manna;
    const kept = layAside(gathered, 1, 999);
    expect(kept.laidAside).toBe(5);
    expect(kept.fresh).toBe(0);
  });

  it("ignores laying aside nothing", () => {
    const gathered = gather(freshManna(), family(), 1, true).manna;
    expect(layAside(gathered, 1, 0)).toBe(gathered);
  });
});

describe("a week of it", () => {
  /**
   * The pattern the sixth-day command exists to produce: prepare on the sixth and
   * the Sabbath feeds you without going out.
   */
  it("feeds a household through the Sabbath when it prepares on the sixth day", () => {
    let manna = freshManna();
    // Days one to five: gather, eat, nothing kept back.
    for (let day = 1; day <= 5; day++) {
      manna = aDay(manna, day).manna;
      manna = dawn(manna).manna;
    }
    // The sixth day: twice as much falls, half goes aside, and they still eat their fill.
    const sixth = gather(manna, family(), SIXTH_DAY, true);
    expect(sixth.gathered).toBe(10);
    const set = layAside(sixth.manna, SIXTH_DAY, 5);
    const supper = eat(set, family());
    expect(supper.satisfaction).toBe(1);
    manna = supper.manna;

    const sabbathMorning = dawn(manna);
    expect(sabbathMorning.spoiled).toBe(0);
    expect(isProvidedFor(sabbathMorning.manna, family())).toBe(true);

    const sabbath = eat(sabbathMorning.manna, family());
    expect(sabbath.satisfaction).toBe(1);
    for (const member of sabbath.household) expect(member.condition).toBe(100);
  });

  /** The same week, by a household that did not prepare. */
  it("leaves a household that ignored the sixth day hungry on the Sabbath", () => {
    let manna = freshManna();
    for (let day = 1; day <= 5; day++) {
      manna = aDay(manna, day).manna;
      manna = dawn(manna).manna;
    }
    // The sixth day: they gather the double portion but keep none of it back.
    manna = aDay(manna, SIXTH_DAY).manna;
    const sabbathMorning = dawn(manna);
    // The uneaten half of the double portion rotted, exactly as v20 says.
    expect(sabbathMorning.spoiled).toBe(5);

    const wentOut = gather(sabbathMorning.manna, family(), SABBATH, true);
    expect(wentOut.outcome).toBe("none-fell");

    const sabbath = eat(wentOut.manna, family());
    expect(sabbath.satisfaction).toBe(0);
    for (const member of sabbath.household) expect(member.condition).toBeLessThan(100);
  });

  it("holds a disciplined household steady for a fortnight", () => {
    let manna = freshManna();
    let household = family();

    for (let day = 1; day <= 14; day++) {
      const week = dayInWeek(day);
      if (week !== SABBATH) {
        manna = gather(manna, household, day, true).manna;
      }
      // Set the second omer aside before supper, which is the only order that works.
      if (week === SIXTH_DAY) manna = layAside(manna, SIXTH_DAY, household.length);
      const meal = eat(manna, household);
      manna = meal.manna;
      household = meal.household;
      manna = dawn(manna).manna;
    }

    for (const member of household) expect(member.condition).toBe(100);
  });
});
