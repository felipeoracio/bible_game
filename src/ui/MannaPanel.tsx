"use client";

import {
  dayInWeek,
  OMER_PER_PERSON,
  omersHeld,
  portionFor,
  SABBATH,
  SIXTH_DAY,
} from "@/sim/systems/manna";
import { useGame } from "@/state/store";

/**
 * The basket, at camp.
 *
 * Deliberately not a minigame. Exodus 16:18 says the one who gathered much had
 * nothing over and the one who gathered little had no lack, so there is nothing
 * here to be good at — the whole decision is whether to go out, and whether to
 * hold anything back. See `sim/systems/manna.ts` for why.
 *
 * Nothing in here renders until manna begins at Leg 8.
 */
export default function MannaPanel() {
  const mannaDay = useGame((s) => s.state.mannaDay);
  const manna = useGame((s) => s.state.manna);
  const household = useGame((s) => s.state.household);
  const spoiled = useGame((s) => s.state.mannaSpoiled);
  const dispatch = useGame((s) => s.dispatch);

  if (mannaDay <= 0) return null;

  const week = dayInWeek(mannaDay);
  const need = household.length * OMER_PER_PERSON;
  const held = omersHeld(manna);
  const falling = portionFor(household, mannaDay);

  const beenOut = manna.gatheredToday;
  const sabbath = week === SABBATH;
  const sixth = week === SIXTH_DAY;
  const short = held < need;

  return (
    <section className="frame frame-panel flex flex-col gap-3" aria-label="The morning's manna">
      <div className="text-pixel-sm flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 uppercase tracking-widest">
        <h3 className="text-ochre">Manna &middot; day {week} of seven</h3>
        {/*
          A fraction only makes sense while the household is short. On the sixth day
          it holds twice what it needs, and "10 of 5 omers" reads like a shortfall.
        */}
        <span className={short ? "text-terracotta" : "text-linen/50"}>
          {short ? `${held} of ${need} omers` : `${held} omers in hand`}
        </span>
      </div>

      {/*
        The worms. Said once, the morning after, without explaining the lesson —
        the player worked out what they did wrong the moment they read it.
      */}
      {spoiled !== undefined && spoiled > 0 && (
        <p className="text-pixel-sm text-terracotta" role="status">
          What you kept back bred worms in the night. {spoiled}{" "}
          {spoiled === 1 ? "omer is" : "omers are"} foul and thrown out.
        </p>
      )}

      <p className="text-pixel-sm text-linen/70">
        {sabbath
          ? "The seventh day. Nothing lies on the ground this morning."
          : sixth
            ? "Twice as much lies on the ground today as any other morning."
            : "It lies on the ground like frost, and melts once the sun is properly up."}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {/*
          The gather button stays on the Sabbath on purpose. Going out and finding
          nothing is v27, and it is a far better teacher than a disabled button.
        */}
        <button
          type="button"
          onClick={() => dispatch({ type: "GATHER_MANNA", inTime: true })}
          disabled={beenOut}
          className="text-pixel-sm border-2 border-ochre/60 px-3 py-1.5 uppercase tracking-widest text-linen transition-colors hover:border-terracotta hover:bg-terracotta disabled:cursor-not-allowed disabled:border-linen/15 disabled:text-linen/25 disabled:hover:border-linen/15 disabled:hover:bg-transparent"
        >
          {beenOut ? "Gathered" : "Go out and gather"}
        </button>

        {/*
          Holding food back costs tonight's supper. Offered every day, because the
          sixth day only means something if the other six were also a choice.
        */}
        {manna.fresh > 0 && (
          <button
            type="button"
            onClick={() => dispatch({ type: "LAY_ASIDE_MANNA", omers: need })}
            className="text-pixel-sm border-2 border-ochre/40 px-3 py-1.5 uppercase tracking-widest text-linen/80 transition-colors hover:border-ochre hover:bg-linen/10"
          >
            Lay a day&rsquo;s worth aside
          </button>
        )}

        {manna.laidAside > 0 && (
          <span className="text-pixel-sm text-linen/50">
            {manna.laidAside} set by for tomorrow
          </span>
        )}
      </div>

      {sabbath && falling === 0 && !beenOut && held >= need && (
        <p className="text-pixel-sm text-olive">
          There is enough in the basket for today without going out.
        </p>
      )}
    </section>
  );
}
