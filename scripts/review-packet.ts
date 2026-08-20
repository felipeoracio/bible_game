import { writeFileSync } from "node:fs";
import { episode1 } from "../src/content/episode1";
import { formatRef, getPassage } from "../src/content/scripture";
import type { Provenance, ScriptureRef } from "../src/content/types";

/**
 * Builds the Scripture reviewer's packet.
 *
 * The provenance system is only worth as much as the person checking it, and until
 * now checking it meant reading TypeScript across a dozen files. This puts every
 * claim the game makes about Scripture in front of a reviewer in one document, in
 * reading order, with the cited verses printed underneath it — so the question
 * "does the text actually say this?" can be answered without opening an editor or
 * a Bible.
 *
 * Two sections, because they ask the reviewer different questions:
 *
 *   - **Recorded** — the game is asserting the text says this. Reviewer decides:
 *     does the citation support the claim, or should it be downgraded?
 *   - **Reasoned** — the game is asserting this is a fair inference and says so to
 *     the player. Reviewer decides: is the inference sound, and is the stated basis
 *     honest about what it rests on?
 *
 * `invented` content is listed only as a count. It makes no claim about Scripture,
 * and the validator already refuses to let a recorded figure into the household.
 *
 * Regenerate with `npm run review:packet`.
 */

interface Claim {
  where: string;
  /** What the player actually reads. */
  text: string;
  provenance: Provenance;
}

const claims: Claim[] = [];
const add = (where: string, text: string, provenance: Provenance) =>
  claims.push({ where, text, provenance });

// --- Gather, in the order a player meets them --------------------------------

for (const leg of episode1.legs) {
  const where = `Leg ${leg.index} · ${leg.from} to ${leg.to}`;
  add(`${where} · distance`, `${leg.distanceKm} km`, leg.distance);
}

for (const piece of Object.values(episode1.setPieces)) {
  const where = `Set piece · ${piece.title}`;
  add(`${where} · intro`, piece.intro, piece.provenance);
  for (const phase of piece.phases) {
    add(`${where} · ${phase.id}`, phase.body, phase.provenance);
    for (const choice of phase.choices) {
      add(`${where} · ${phase.id} · ${choice.id}`, `${choice.label} — ${choice.outcome}`, choice.provenance);
    }
  }
  add(`${where} · OUTCOME`, piece.outcome.text, piece.outcome.provenance);
}

for (const event of Object.values(episode1.events)) {
  const where = `Event · ${event.title}`;
  add(where, event.body, event.provenance);
  for (const choice of event.choices) {
    add(`${where} · ${choice.id}`, `${choice.label} — ${choice.outcome}`, choice.provenance);
  }
}

for (const entry of Object.values(episode1.codex)) {
  add(`Codex · ${entry.title}`, entry.note, entry.provenance);
}

for (const quiz of Object.values(episode1.quizzes)) {
  for (const question of quiz.questions) {
    /*
     * A quiz explanation is the game teaching, so it is reviewed like a recorded
     * claim even though the model does not tag questions with a tier: `teaches`
     * points at the verse the explanation rests on.
     */
    add(
      `Quiz · ${quiz.id} · ${question.id}`,
      `${question.prompt}\n    ANSWER: ${question.options.find((o) => o.correct)?.label}\n    EXPLANATION: ${question.explanation}`,
      { tier: "recorded", refs: [question.teaches] },
    );
  }
}

for (const member of episode1.household) {
  add(`Household · ${member.name}`, member.description, member.provenance);
}
for (const trade of episode1.trades) {
  add(`Trade · ${trade.label}`, trade.description, trade.provenance);
}
for (const judge of episode1.judges) {
  add(`Judge · ${judge.name}`, judge.description, judge.provenance);
}
for (const beat of episode1.opening) {
  add(`Opening · ${beat.heading}`, beat.lines.join("\n"), beat.provenance);
}

// --- Render ------------------------------------------------------------------

const wrap = (text: string, indent = "  ") =>
  text
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");

function passageBlock(ref: ScriptureRef): string {
  const passage = getPassage(ref);
  if (!passage) return `    ${formatRef(ref)} — NOT IN THE BUNDLED TEXT`;
  const verses = passage.verses.map((v) => `      ${v.number}. ${v.text}`).join("\n");
  return `    ${passage.label}\n${verses}`;
}

const recorded = claims.filter((c) => c.provenance.tier === "recorded");
const reasoned = claims.filter((c) => c.provenance.tier === "reasoned");
const invented = claims.filter((c) => c.provenance.tier === "invented");

const lines: string[] = [];
lines.push("# Scripture review packet — By Way of the Wilderness, Episode 1");
lines.push("");
lines.push(`Generated from the shipped content. Translation: ${getPassage({ book: "exodus", chapter: 12, verses: "37" })?.translation ?? "unknown"}.`);
lines.push("");
lines.push("Every claim this game makes about Scripture is below, with the verses it cites");
lines.push("printed underneath. Two questions, one per section.");
lines.push("");
lines.push(`- **${recorded.length} recorded claims** — the game tells the player the text says this.`);
lines.push(`  *Does the citation support the claim, or should it be downgraded to reasoned?*`);
lines.push(`- **${reasoned.length} reasoned claims** — the game tells the player this is inference,`);
lines.push(`  and shows the stated basis. *Is the inference sound, and is the basis honest?*`);
lines.push(`- ${invented.length} invented items make no claim about Scripture and are not listed.`);
lines.push("");
lines.push("---");
lines.push("");
lines.push("## Open questions for the reviewer");
lines.push("");
lines.push("Four decisions the build cannot make for itself. They are policy, not defects,");
lines.push("and the answers should come back as rules the content is then held to.");
lines.push("");
lines.push("**1. The tier is on the block, not the sentence.** A `recorded` event body is one");
lines.push("tagged unit, but its prose mixes the recorded fact with invented atmosphere — the");
lines.push("sea standing as a wall is Exodus 14:22; \"nobody in the column can look at it for");
lines.push("long\" is ours. Is a block tag honest enough, or does the interface need to");
lines.push("distinguish within a paragraph? Every recorded entry below has some of this.");
lines.push("");
lines.push("**2. The divine name.** The bundled translation reads *Yahweh*. Much of the");
lines.push("game's own prose paraphrases to *God* — including inside recorded outcome text,");
lines.push("where the player is reading the game's words next to the verse's. Should the");
lines.push("prose match the translation, or is paraphrase acceptable so long as the passage");
lines.push("is printed alongside?");
lines.push("");
lines.push("**3. Paraphrase in `outcome` text.** A set piece's outcome is a close retelling");
lines.push("of its verses rather than a quotation. It is tagged recorded and cites, and the");
lines.push("passage is shown. Is retelling the right register there, or should it quote?");
lines.push("");
lines.push("**4. The route is disclosed but not named.** Individual sites are flagged as");
lines.push("uncertain throughout, and the Codex entry \"Which road is this?\" now tells the");
lines.push("player the route as a whole is one reading among several. What it does *not* do");
lines.push("is say which reading — because the leg distances were reasoned from a day's");
lines.push("march rather than laid out against any named reconstruction, so claiming one");
lines.push("would be a bigger assertion than the content actually supports. Should the game");
lines.push("commit to a named route and be judged against it, or is \"we drew one line and");
lines.push("do not claim it\" the more honest position for a teaching game?");
lines.push("");
lines.push("---");
lines.push("");

lines.push("## Recorded claims");
lines.push("");
for (const claim of recorded) {
  if (claim.provenance.tier !== "recorded") continue;
  lines.push(`### ${claim.where}`);
  lines.push("");
  lines.push("```");
  lines.push(wrap(claim.text));
  lines.push("```");
  lines.push("");
  lines.push("Cites:");
  lines.push("");
  lines.push("```");
  for (const ref of claim.provenance.refs) lines.push(passageBlock(ref));
  lines.push("```");
  lines.push("");
}

lines.push("---");
lines.push("");
lines.push("## Reasoned claims");
lines.push("");
for (const claim of reasoned) {
  if (claim.provenance.tier !== "reasoned") continue;
  lines.push(`### ${claim.where}`);
  lines.push("");
  lines.push("```");
  lines.push(wrap(claim.text));
  lines.push("```");
  lines.push("");
  lines.push(`**Stated basis (the player sees this):** ${claim.provenance.basis}`);
  lines.push("");
  if (claim.provenance.refs?.length) {
    lines.push("Supporting references:");
    lines.push("");
    lines.push("```");
    for (const ref of claim.provenance.refs) lines.push(passageBlock(ref));
    lines.push("```");
    lines.push("");
  } else {
    lines.push("_No supporting reference given._");
    lines.push("");
  }
}

const out = "docs/scripture-review.md";
writeFileSync(out, lines.join("\n"), "utf8");
console.log(
  `wrote ${out} — ${recorded.length} recorded, ${reasoned.length} reasoned, ${invented.length} invented`,
);
