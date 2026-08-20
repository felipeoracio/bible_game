/**
 * Content gate. Run with `npm run validate:content`.
 *
 * Exits non-zero if any content claims Scripture it cannot cite, cites a verse
 * that is not there, reasons without stating a basis, or points at an id that
 * does not exist. Wire this into CI ahead of the build.
 */
import { episode1 } from "../src/content/episode1";
import { validateEpisode, formatIssues } from "../src/content/validate";

const episodes = [episode1];

let errorCount = 0;
let warningCount = 0;

for (const episode of episodes) {
  const issues = validateEpisode(episode);
  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warning");
  errorCount += errors.length;
  warningCount += warnings.length;

  const counts = `${episode.legs.length} legs, ${Object.keys(episode.events).length} events, ${Object.keys(episode.codex).length} Codex entries, ${Object.keys(episode.quizzes).length} quizzes, ${Object.keys(episode.setPieces).length} set pieces`;

  if (issues.length === 0) {
    console.log(`ok  ${episode.id} — ${counts}`);
  } else {
    console.log(`    ${episode.id} — ${counts}`);
    console.log(formatIssues(issues));
  }
}

if (errorCount > 0) {
  console.error(`\n${errorCount} error${errorCount === 1 ? "" : "s"}, ${warningCount} warning${warningCount === 1 ? "" : "s"}.`);
  process.exit(1);
}

if (warningCount > 0) {
  console.log(`\n${warningCount} warning${warningCount === 1 ? "" : "s"}, no errors.`);
}
