import { refResolves, formatRef } from "./scripture";
import { CAMP_MOODS, type Episode, type Provenance, type ScriptureRef } from "./types";
import { tokensIn } from "./names";

/**
 * Content validation.
 *
 * The type system already refuses to compile a `recorded` claim with no citation.
 * This covers what types cannot see: whether a cited verse actually exists in the
 * bundled text, whether a "reasoned" tag carries reasoning worth reading, whether
 * ids point at anything, and whether a leg claims a distance Scripture never gave.
 *
 * Errors fail the build. Warnings are for content that is valid but probably
 * unfinished — an event nothing can reach, a Codex entry nothing links to.
 */

export type IssueLevel = "error" | "warning";

export interface ValidationIssue {
  level: IssueLevel;
  /** Where it is, e.g. `event:the-asking > choice:ask-for-cloth`. */
  where: string;
  message: string;
}

/**
 * A "reasoned" tag has to state what the reasoning rests on, and that line is
 * shown to the player in the Codex. Anything this short is a placeholder.
 */
const MIN_BASIS_LENGTH = 20;

export function validateEpisode(episode: Episode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const error = (where: string, message: string) =>
    issues.push({ level: "error", where, message });
  const warn = (where: string, message: string) =>
    issues.push({ level: "warning", where, message });

  const checkRef = (where: string, ref: ScriptureRef, label = "reference") => {
    if (!refResolves(ref)) {
      error(
        where,
        `${label} ${formatRef(ref)} does not resolve — the book, chapter, or a verse in that range is not in the bundled translation.`,
      );
    }
  };

  const checkProvenance = (where: string, provenance: Provenance) => {
    switch (provenance.tier) {
      case "recorded":
        // The type is a non-empty tuple, but content can also arrive from JSON.
        if (provenance.refs.length === 0) {
          error(where, "tagged recorded but cites nothing. Cite chapter and verse, or downgrade it.");
        }
        provenance.refs.forEach((ref) => checkRef(where, ref, "citation"));
        break;
      case "reasoned": {
        const basis = provenance.basis.trim();
        if (basis.length === 0) {
          error(where, "tagged reasoned but states no basis.");
        } else if (basis.length < MIN_BASIS_LENGTH) {
          error(
            where,
            `basis is ${basis.length} characters — too short to be reasoning a player can weigh. Say what it rests on.`,
          );
        }
        provenance.refs?.forEach((ref) => checkRef(where, ref, "supporting reference"));
        break;
      }
      case "invented":
        break;
    }
  };

  const duplicates = (where: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) error(where, `duplicate id "${id}".`);
      seen.add(id);
    }
  };

  duplicates("legs", episode.legs.map((leg) => leg.id));

  const memberIdSet = new Set(episode.household.map((member) => member.id));
  const defaultNames = episode.household.map((member) => ({ id: member.id, name: member.name }));

  /**
   * Player-facing prose refers to the household by id — `{tirzah}` — because the
   * player renames them. Writing a name in literally means the line keeps saying
   * "Tirzah" after they have been called something else, and every token has to
   * point at somebody who exists.
   */
  const checkNames = (where: string, text: string) => {
    for (const token of tokensIn(text)) {
      if (!memberIdSet.has(token)) {
        error(where, `refers to "{${token}}", who is not in the household.`);
      }
    }
    for (const { id, name } of defaultNames) {
      // Double-escaped: inside a template literal a single \b is a backspace.
      if (new RegExp(`\\b${name}\\b`).test(text)) {
        error(
          where,
          `writes the name "${name}" directly. Use "{${id}}" so the line follows what the player called them.`,
        );
      }
    }
  };

  /** Every Codex entry has to be reachable by playing; see the check after the legs. */
  const unlockedSomewhere = new Set<string>();

  // --- Events ---------------------------------------------------------------
  for (const [id, event] of Object.entries(episode.events)) {
    const where = `event:${id}`;
    if (event.id !== id) error(where, `keyed as "${id}" but its id is "${event.id}".`);
    if (event.title.trim().length === 0) error(where, "has no title.");
    if (event.body.trim().length === 0) error(where, "has no body text.");
    checkNames(where, `${event.title} ${event.body}`);
    checkProvenance(where, event.provenance);
    duplicates(where, event.choices.map((choice) => choice.id));
    for (const choice of event.choices) {
      const choiceWhere = `${where} > choice:${choice.id}`;
      if (choice.label.trim().length === 0) error(choiceWhere, "has no label.");
      if (choice.outcome.trim().length === 0) error(choiceWhere, "has no outcome text.");
      checkNames(choiceWhere, `${choice.label} ${choice.outcome}`);
      checkProvenance(choiceWhere, choice.provenance);
    }
    for (const id of event.unlocks ?? []) {
      if (!episode.codex[id]) error(where, `unlocks unknown Codex entry "${id}".`);
      unlockedSomewhere.add(id);
    }
  }

  // --- Codex ----------------------------------------------------------------
  for (const [id, entry] of Object.entries(episode.codex)) {
    const where = `codex:${id}`;
    if (entry.id !== id) error(where, `keyed as "${id}" but its id is "${entry.id}".`);
    if (entry.note.trim().length === 0) error(where, "has no note.");
    checkNames(where, entry.note);
    checkProvenance(where, entry.provenance);
    entry.passages.forEach((ref) => checkRef(where, ref, "passage"));
    for (const related of entry.related) {
      if (!episode.codex[related]) error(where, `links to unknown Codex entry "${related}".`);
      if (related === id) error(where, "links to itself.");
    }
    if (entry.provenance.tier === "recorded" && entry.passages.length === 0) {
      warn(where, "is tagged recorded but presents no passage for the player to read.");
    }
  }

  // --- Quizzes --------------------------------------------------------------
  for (const [id, quiz] of Object.entries(episode.quizzes)) {
    const where = `quiz:${id}`;
    if (quiz.id !== id) error(where, `keyed as "${id}" but its id is "${quiz.id}".`);
    if (!episode.legs.some((leg) => leg.id === quiz.legId)) {
      error(where, `belongs to unknown leg "${quiz.legId}".`);
    }
    if (quiz.questions.length === 0) error(where, "has no questions.");
    duplicates(where, quiz.questions.map((question) => question.id));
    for (const question of quiz.questions) {
      const qWhere = `${where} > question:${question.id}`;
      if (question.prompt.trim().length === 0) error(qWhere, "has no prompt.");
      if (question.explanation.trim().length === 0) {
        error(qWhere, "has no explanation — a wrong answer would teach nothing.");
      }
      if (question.options.length < 2) error(qWhere, "needs at least two options.");
      duplicates(qWhere, question.options.map((option) => option.id));
      const correct = question.options.filter((option) => option.correct).length;
      if (correct !== 1) {
        error(qWhere, `has ${correct} correct options; it must have exactly one.`);
      }
      checkRef(qWhere, question.teaches, "teaching reference");
    }
  }

  // --- Legs -----------------------------------------------------------------
  const referencedEvents = new Set<string>();
  for (const leg of episode.legs) {
    const where = `leg:${leg.id}`;
    if (leg.distanceKm <= 0) error(where, `has a distance of ${leg.distanceKm} km.`);
    if (leg.distance.tier === "recorded") {
      error(
        where,
        "claims its distance is recorded. Numbers 33 names the camps but gives no distances — leg lengths are always reasoned.",
      );
    }
    checkProvenance(`${where} > distance`, leg.distance);

    if (leg.backdrop !== undefined && !leg.backdrop.startsWith("/")) {
      error(
        where,
        `backdrop "${leg.backdrop}" must be an absolute path under /public, e.g. "/art/....webp".`,
      );
    }

    duplicates(where, leg.scripted.map((slot) => slot.eventId));
    for (const slot of leg.scripted) {
      const slotWhere = `${where} > scripted:${slot.eventId}`;
      if (!episode.events[slot.eventId]) error(slotWhere, "points at an unknown event.");
      if (slot.atProgress < 0 || slot.atProgress > 1) {
        error(slotWhere, `fires at progress ${slot.atProgress}, which is outside 0 to 1.`);
      }
      referencedEvents.add(slot.eventId);
    }
    for (const eventId of leg.pool) {
      if (!episode.events[eventId]) {
        error(`${where} > pool:${eventId}`, "points at an unknown event.");
      }
      referencedEvents.add(eventId);
    }
    duplicates(`${where} > camp`, leg.camp);
    for (const eventId of leg.camp) {
      if (!episode.events[eventId]) {
        error(`${where} > camp:${eventId}`, "points at an unknown event.");
      }
      referencedEvents.add(eventId);
    }

    const waypoint = episode.codex[leg.waypoint];
    if (!waypoint) error(where, `waypoint "${leg.waypoint}" is not a Codex entry.`);
    else if (waypoint.kind !== "waypoint") {
      warn(where, `waypoint "${leg.waypoint}" is a Codex entry of kind "${waypoint.kind}".`);
    }
    unlockedSomewhere.add(leg.waypoint);
    for (const id of leg.unlocks ?? []) {
      if (!episode.codex[id]) error(where, `unlocks unknown Codex entry "${id}".`);
      unlockedSomewhere.add(id);
    }
    if (!episode.quizzes[leg.quiz]) error(where, `quiz "${leg.quiz}" does not exist.`);
  }

  for (const id of Object.keys(episode.events)) {
    if (!referencedEvents.has(id)) warn(`event:${id}`, "is never reachable — no leg references it.");
  }

  // --- Set pieces ------------------------------------------------------------
  /*
   * The four set pieces are where a Bible game is most tempted to let the player
   * change what happened, so they are checked harder than anything else. The rule
   * being enforced: the situation and its outcome are recorded and cited; the
   * household's response to them is not, and must never claim to be.
   */
  for (const [id, piece] of Object.entries(episode.setPieces)) {
    const where = `setpiece:${id}`;
    if (piece.id !== id) error(where, `keyed as "${id}" but its id is "${piece.id}".`);
    if (piece.title.trim().length === 0) error(where, "has no title.");
    if (piece.intro.trim().length === 0) error(where, "has no intro.");
    checkNames(where, `${piece.title} ${piece.intro}`);
    checkProvenance(where, piece.provenance);

    if (piece.provenance.tier !== "recorded") {
      error(
        where,
        `is tagged ${piece.provenance.tier}. A set piece is one of the four recorded moments the episode is built on and must cite chapter and verse.`,
      );
    }

    // The outcome is the part that is not ours to invent.
    const outcomeWhere = `${where} > outcome`;
    if (piece.outcome.text.trim().length === 0) error(outcomeWhere, "has no text.");
    checkNames(outcomeWhere, piece.outcome.text);
    checkProvenance(outcomeWhere, piece.outcome.provenance);
    if (piece.outcome.provenance.tier !== "recorded") {
      error(
        outcomeWhere,
        `is tagged ${piece.outcome.provenance.tier}. What happens at a set piece is recorded, or the player is being told Scripture says something it does not.`,
      );
    }

    if (piece.phases.length === 0) error(where, "has no phases.");
    duplicates(`${where} > phases`, piece.phases.map((phase) => phase.id));

    for (const phase of piece.phases) {
      const phaseWhere = `${where} > phase:${phase.id}`;
      if (phase.body.trim().length === 0) error(phaseWhere, "has no body text.");
      checkNames(phaseWhere, phase.body);
      checkProvenance(phaseWhere, phase.provenance);

      duplicates(`${phaseWhere} > choices`, phase.choices.map((choice) => choice.id));
      for (const choice of phase.choices) {
        const choiceWhere = `${phaseWhere} > ${choice.id}`;
        if (choice.label.trim().length === 0) error(choiceWhere, "has no label.");
        if (choice.outcome.trim().length === 0) error(choiceWhere, "has no outcome text.");
        checkNames(choiceWhere, `${choice.label} ${choice.outcome}`);
        checkProvenance(choiceWhere, choice.provenance);

        /*
         * What your household did is yours. Tagging it recorded would be claiming
         * Scripture describes this invented family's decision, which it does not.
         */
        if (choice.provenance.tier === "recorded") {
          error(
            choiceWhere,
            "is tagged recorded. A set-piece choice is what your invented household did, and the text says nothing about them.",
          );
        }
      }
    }

    for (const codexId of piece.unlocks ?? []) {
      if (!episode.codex[codexId]) error(where, `unlocks unknown Codex entry "${codexId}".`);
      unlockedSomewhere.add(codexId);
    }
  }

  duplicates("judges", episode.judges.map((judge) => judge.id));
  for (const judge of episode.judges) {
    const where = `judge:${judge.id}`;
    if (judge.name.trim().length === 0) error(where, "has no name.");
    checkProvenance(where, judge.provenance);
    /*
     * Exodus 18 records the offices and names nobody who held one. Presenting an
     * invented ruler of ten as a recorded person would be putting a name into the
     * text that is not in it.
     */
    if (judge.provenance.tier !== "invented") {
      error(
        where,
        `is tagged ${judge.provenance.tier}. Exodus 18 records the ranks but names none of the men, so every judge here is invented.`,
      );
    }
  }

  /*
   * An entry nothing unlocks can never be read, however well written. That is worse
   * than a missing entry, because it looks finished in the source and is invisible
   * in play.
   */
  for (const id of Object.keys(episode.codex)) {
    if (!unlockedSomewhere.has(id)) {
      error(`codex:${id}`, "can never be opened — no leg or event unlocks it.");
    }
  }

  // --- Household -------------------------------------------------------------
  duplicates("household", episode.household.map((member) => member.id));

  const heads = episode.household.filter((member) => member.role === "head");
  if (heads.length !== 1) {
    error("household", `has ${heads.length} members with the role "head"; it must have exactly one.`);
  }

  for (const member of episode.household) {
    const where = `household:${member.id}`;
    if (member.name.trim().length === 0) error(where, "has no name.");
    if (member.description.trim().length === 0) error(where, "has no description.");
    /*
     * The player chooses each member's face from several looks, so a description
     * that says "she" can contradict what is on screen. Roster descriptions stay
     * sex-neutral; the member's own speech at camp can say what it likes.
     */
    const gendered = member.description.match(/\b(she|he|her|hers|his|him|himself|herself)\b/i);
    if (gendered) {
      error(
        where,
        `description says "${gendered[0]}". The player picks this member's face, so descriptions stay sex-neutral.`,
      );
    }
    if (member.age <= 0) error(where, `has an age of ${member.age}.`);
    checkProvenance(where, member.provenance);

    /**
     * The player's household has to be invented. That is what lets the player act
     * freely without the game putting words in the mouth of someone Scripture names,
     * and it is the load-bearing assumption of the whole design (§3).
     */
    if (member.provenance.tier !== "invented") {
      error(
        where,
        `is tagged ${member.provenance.tier}. Everyone in the player's household must be invented — a recorded figure cannot be under the player's control.`,
      );
    }
  }

  // --- Opening ---------------------------------------------------------------
  duplicates("opening", episode.opening.map((beat) => beat.id));
  if (episode.opening.length === 0) error("opening", "has no beats; a new run would start cold.");

  for (const beat of episode.opening) {
    const where = `opening:${beat.id}`;
    if (beat.heading.trim().length === 0) error(where, "has no heading.");
    if (beat.lines.length === 0 || beat.lines.every((line) => line.trim().length === 0)) {
      error(where, "has no text.");
    }
    checkProvenance(where, beat.provenance);
    beat.passages?.forEach((ref) => checkRef(where, ref, "passage"));
  }

  // --- Camp lines ------------------------------------------------------------
  const memberIds = new Set(episode.household.map((member) => member.id));
  const seenLines = new Set<string>();

  for (const line of episode.campLines) {
    const where = `camp-line:${line.memberId}/${line.mood}`;
    if (!memberIds.has(line.memberId)) {
      error(where, `is spoken by "${line.memberId}", who is not in the household.`);
    }
    if (line.text.trim().length === 0) error(where, "has no text.");
    checkNames(where, line.text);
    const key = `${line.memberId}/${line.mood}`;
    if (seenLines.has(key)) error(where, "is a duplicate — that member already has this mood.");
    seenLines.add(key);
  }

  /*
   * Every member needs a line for every mood. A missing one is invisible in play —
   * the camp screen simply has nothing to show for that person on the night they
   * most need to say something.
   */
  for (const member of episode.household) {
    for (const mood of CAMP_MOODS) {
      if (!seenLines.has(`${member.id}/${mood}`)) {
        error(`camp-line:${member.id}/${mood}`, "is missing; that member falls silent in this mood.");
      }
    }
  }

  // --- Trades ----------------------------------------------------------------
  duplicates("trades", episode.trades.map((trade) => trade.id));
  if (episode.trades.length < 2) error("trades", "offers fewer than two choices.");

  for (const trade of episode.trades) {
    const where = `trade:${trade.id}`;
    if (trade.label.trim().length === 0) error(where, "has no label.");
    if (trade.description.trim().length === 0) error(where, "has no description.");
    checkProvenance(where, trade.provenance);
  }

  return issues;
}

export function formatIssues(issues: ValidationIssue[]): string {
  return issues
    .map((issue) => `${issue.level === "error" ? "ERROR" : "warn "}  ${issue.where}\n         ${issue.message}`)
    .join("\n");
}
