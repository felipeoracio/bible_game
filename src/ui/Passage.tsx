import { getPassage, translation } from "@/content/scripture";
import type { ScriptureRef } from "@/content/types";

/**
 * Scripture, presented as Scripture.
 *
 * Verse numbers are shown because a player who wants to check us should be able to
 * without counting lines, and the translation is credited on every passage rather
 * than buried in a credits screen. Parchment is the reading surface throughout.
 *
 * A reference that does not resolve renders nothing rather than a gap — the content
 * validator fails the build on one, so this is belt and braces.
 */
export default function Passage({ refs }: { refs: ScriptureRef[] }) {
  const passages = refs.map((ref) => getPassage(ref)).filter((p) => p !== null);
  if (passages.length === 0) return null;

  return (
    <div className="frame frame-parchment frame-slim flex flex-col gap-4">
      {passages.map((passage) => (
        <article key={passage.label}>
          <h4 className="text-pixel-sm mb-2 uppercase tracking-widest opacity-70">
            {passage.label}
          </h4>
          <p className="text-pixel-sm leading-relaxed">
            {passage.verses.map((verse) => (
              <span key={verse.number}>
                <sup className="mr-1 opacity-60">{verse.number}</sup>
                {verse.text}{" "}
              </span>
            ))}
          </p>
        </article>
      ))}
      <p className="text-pixel-sm opacity-55">
        {translation.name} &middot; {translation.rights}
      </p>
    </div>
  );
}
