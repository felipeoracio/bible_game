/**
 * Household name tokens.
 *
 * Content refers to the family by id — `{tirzah}` — never by name, because the
 * player names them. Writing "Tirzah" into a line means that line goes on saying
 * Tirzah after the player has called her Shiphrah, which is exactly the kind of
 * detail that tells someone the game is not really listening.
 *
 * The ids are the *default* names from the roster, so a token stays readable in
 * the source without a lookup: `{naamah}` obviously means the grandmother.
 *
 * This lives with the content rather than the UI because it describes a rule about
 * how content is written, and the validator has to enforce it.
 */
const TOKEN = /\{([a-z0-9-]+)\}/gi;

/** Anything with a name; deliberately not tied to the simulation's state shape. */
export interface Named {
  name: string;
}

export function withNames(text: string, named: Record<string, Named>): string {
  return text.replace(TOKEN, (whole, id: string) => named[id]?.name ?? whole);
}

/** Every id referenced by a piece of text, for validation. */
export function tokensIn(text: string): string[] {
  return [...text.matchAll(TOKEN)].map((match) => match[1] as string);
}
