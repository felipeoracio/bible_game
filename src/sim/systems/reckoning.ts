import { averageMorale, type MemberState } from "./household";
import { estranged, isWhole } from "./fracture";
import { isStraggling, positionAt, type ColumnPosition } from "./column";

/**
 * How the journey is judged — the third of the failure states (§5.5).
 *
 * There is no losing screen, because the Exodus does not fail. Israel reaches Sinai
 * whether your household kept up or not. What varies is what you arrive *with*, and
 * the game says that plainly rather than scoring it out of a hundred.
 *
 * This deliberately does not grade the player's obedience or their theology. It
 * reads three things they actually controlled: whether their family still walks
 * with them, whether they are worn to nothing, and where in the column they ended
 * up. Everything else is between the player and the text.
 */

export type Standing = "whole" | "worn" | "divided" | "scattered";

export interface Reckoning {
  standing: Standing;
  position: ColumnPosition;
  /** How many of the household still walk with the player. */
  following: number;
  total: number;
  averageTrust: number;
  averageMorale: number;
  /** One line, written for a child to read aloud. */
  summary: string;
}

function average(household: readonly MemberState[], axis: "trust" | "morale"): number {
  if (household.length === 0) return 0;
  return household.reduce((sum, member) => sum + member[axis], 0) / household.length;
}

/**
 * Said in terms of the actual people, because `scattered` has two quite different
 * causes — half the household gone, or one gone while you finished at the very back
 * — and one sentence cannot honestly cover both. Getting this wrong is how a game
 * ends up telling a player that "most" of their family left when one person did.
 */
function summarise(
  standing: Standing,
  lost: number,
  total: number,
  straggling: boolean,
): string {
  const them = lost === 1 ? "One of your household" : `${lost} of your household`;

  switch (standing) {
    case "whole":
      return "Your household arrived together, and they are still listening to you. Whatever else the road cost, it did not cost you them.";
    case "worn":
      return "Your household arrived together, and worn down to the bone. They followed you the whole way, but there is very little left of them.";
    case "divided":
      return `${them} stopped walking with you. They are safe, and they are still with Israel — they are just no longer at your fire.`;
    case "scattered":
      return lost * 2 >= total
        ? `Your household came apart on the road. ${them} walk with other families now.`
        : `${them} stopped walking with you, and you finished at the very back of the column — among the feeble and the worn out that the text warns about.`;
  }
}

/**
 * Read the household as it stands.
 *
 * Called at the end of the episode, and safe to call at any point before it — the
 * slice uses it to tell the player where they currently stand rather than making
 * them wait until Sinai to find out.
 */
export function reckon(household: readonly MemberState[], lagKm: number): Reckoning {
  const following = household.filter((member) => member.following).length;
  const total = household.length;
  const averageTrust = average(household, "trust");
  const moraleNow = averageMorale([...household]);
  const position = positionAt(lagKm);

  const lost = estranged(household).length;
  const whole = isWhole(household);

  /*
   * Ordering matters: losing people outranks being tired, and losing most of them
   * outranks losing one. A household that is merely exhausted has not failed at the
   * thing this game is about.
   */
  const standing: Standing = !whole
    ? lost * 2 >= total || isStraggling(lagKm)
      ? "scattered"
      : "divided"
    : moraleNow < 35 || averageTrust < 35
      ? "worn"
      : "whole";

  return {
    standing,
    position,
    following,
    total,
    averageTrust,
    averageMorale: moraleNow,
    summary: summarise(standing, lost, total, isStraggling(lagKm)),
  };
}
