import { describe, expect, it } from "vitest";
import { episode1 } from "./episode1";
import { validateEpisode, type ValidationIssue } from "./validate";
import { getPassage, parseVerses } from "./scripture";
import { recorded, ref, reasoned, type Episode, type Provenance } from "./types";

const errors = (issues: ValidationIssue[]) => issues.filter((i) => i.level === "error");
const messagesFor = (issues: ValidationIssue[], where: string) =>
  issues.filter((i) => i.where.startsWith(where)).map((i) => i.message);

/** Episode 1 with one thing broken, so each check is exercised in isolation. */
const broken = (mutate: (episode: Episode) => void): ValidationIssue[] => {
  const clone = structuredClone(episode1) as Episode;
  mutate(clone);
  return validateEpisode(clone);
};

describe("the shipped content", () => {
  it("has no errors", () => {
    const issues = validateEpisode(episode1);
    const failures = errors(issues);
    expect(failures, failures.map((f) => `${f.where}: ${f.message}`).join("\n")).toHaveLength(0);
  });

  /**
   * Three set pieces are authored and not yet reachable, because the legs that
   * reach them (5, 11 and 12) are still to be written. That is a true and useful
   * warning, so it is allowed by name rather than silenced — any *other* warning
   * still fails, and these three go away as F14 lands the remaining legs.
   */
  it("warns about nothing except the set pieces still waiting for their legs", () => {
    const pending = ["setpiece:marah", "setpiece:rephidim", "setpiece:jethro"];
    const warnings = validateEpisode(episode1).filter((i) => i.level === "warning");
    const unexpected = warnings.filter((w) => !pending.includes(w.where));
    expect(unexpected, unexpected.map((w) => `${w.where}: ${w.message}`).join("\n")).toHaveLength(
      0,
    );
    for (const w of warnings) expect(w.message).toMatch(/never reachable/);
  });

  it("resolves every citation to real bundled text", () => {
    const passage = getPassage(ref("exodus", 12, "37-38"));
    expect(passage).not.toBeNull();
    expect(passage?.verses).toHaveLength(2);
    expect(passage?.verses[0]?.text).toContain("Rameses to Succoth");
    expect(passage?.label).toBe("Exodus 12:37-38");
  });
});

describe("the validator rejects mis-tagged content", () => {
  it("catches a recorded claim that cites nothing", () => {
    const issues = broken((episode) => {
      // What a content author would produce by deleting a citation. The compiler
      // stops this in TypeScript; this covers content arriving any other way.
      episode.events["the-asking"]!.provenance = {
        tier: "recorded",
        refs: [],
      } as unknown as Provenance;
    });
    expect(messagesFor(issues, "event:the-asking").join(" ")).toContain("cites nothing");
  });

  it("catches a citation to a verse that is not in the translation", () => {
    const issues = broken((episode) => {
      episode.events["the-asking"]!.provenance = recorded(ref("exodus", 12, "35-99"));
    });
    expect(messagesFor(issues, "event:the-asking").join(" ")).toContain("does not resolve");
  });

  it("catches a reasoned tag with no reasoning", () => {
    const issues = broken((episode) => {
      episode.events["hotep-asks-to-walk"]!.provenance = reasoned("");
    });
    expect(messagesFor(issues, "event:hotep-asks-to-walk").join(" ")).toContain("states no basis");
  });

  it("catches a reasoned tag whose basis is a placeholder", () => {
    const issues = broken((episode) => {
      episode.events["hotep-asks-to-walk"]!.provenance = reasoned("obvious");
    });
    expect(messagesFor(issues, "event:hotep-asks-to-walk").join(" ")).toContain("too short");
  });

  it("catches a leg claiming its distance is recorded", () => {
    const issues = broken((episode) => {
      episode.legs[0]!.distance = recorded(ref("numbers", 33, "5"));
    });
    expect(messagesFor(issues, "leg:leg-01-rameses-succoth").join(" ")).toContain(
      "Numbers 33 names the camps but gives no distances",
    );
  });

  it("catches a leg pointing at an event that does not exist", () => {
    const issues = broken((episode) => {
      episode.legs[0]!.scripted[0]!.eventId = "the-plague-of-frogs";
    });
    expect(messagesFor(issues, "leg:leg-01-rameses-succoth > scripted").join(" ")).toContain(
      "unknown event",
    );
  });

  it("catches a Codex entry linking to nothing", () => {
    const issues = broken((episode) => {
      // Deliberately not a real id. "etham" used to serve here and became a real
      // Codex entry when leg 2 was written, which quietly emptied this test out.
      episode.codex["succoth"]!.related = ["a-camp-that-does-not-exist"];
    });
    expect(messagesFor(issues, "codex:succoth").join(" ")).toContain("unknown Codex entry");
  });

  it("catches a quiz question with no single correct answer", () => {
    const issues = broken((episode) => {
      episode.quizzes["quiz-leg-01"]!.questions[0]!.options.forEach((o) => (o.correct = true));
    });
    expect(messagesFor(issues, "quiz:quiz-leg-01 > question:q-first-camp").join(" ")).toContain(
      "exactly one",
    );
  });

  it("catches a question that teaches a passage the game does not carry", () => {
    const issues = broken((episode) => {
      episode.quizzes["quiz-leg-01"]!.questions[0]!.teaches = ref("exodus", 40, "1");
    });
    expect(messagesFor(issues, "quiz:quiz-leg-01 > question:q-first-camp").join(" ")).toContain(
      "does not resolve",
    );
  });

  it("catches a recorded figure placed inside the player's household", () => {
    const issues = broken((episode) => {
      episode.household[1]!.provenance = recorded(ref("exodus", 12, "31"));
    });
    expect(messagesFor(issues, "household:tirzah").join(" ")).toContain("must be invented");
  });

  it("catches a household with no head, or more than one", () => {
    const none = broken((episode) => {
      episode.household[0]!.role = "spouse";
    });
    expect(messagesFor(none, "household").join(" ")).toContain("exactly one");

    const two = broken((episode) => {
      episode.household[1]!.role = "head";
    });
    expect(messagesFor(two, "household").join(" ")).toContain("exactly one");
  });

  it("catches a leg backdrop that is not a public asset path", () => {
    const issues = broken((episode) => {
      episode.legs[0]!.backdrop = "art/leg-01.webp";
    });
    expect(messagesFor(issues, "leg:leg-01-rameses-succoth").join(" ")).toContain(
      "must be an absolute path",
    );
  });

  it("catches a trade citing a verse the game does not carry", () => {
    const issues = broken((episode) => {
      episode.trades[0]!.provenance = recorded(ref("exodus", 1, "1"));
    });
    expect(messagesFor(issues, "trade:brickmaker").join(" ")).toContain("does not resolve");
  });

  it("catches an event unlocking a Codex entry that does not exist", () => {
    const issues = broken((episode) => {
      episode.events["the-asking"]!.unlocks = ["the-golden-calf"];
    });
    expect(messagesFor(issues, "event:the-asking").join(" ")).toContain(
      "unlocks unknown Codex entry",
    );
  });

  /**
   * The worst kind of missing content: an entry that reads perfectly in the source
   * and can never be seen in play.
   */
  it("catches a Codex entry nothing can ever unlock", () => {
    const issues = broken((episode) => {
      episode.events["the-dough-unrisen"]!.unlocks = [];
    });
    expect(messagesFor(issues, "codex:kneading-troughs").join(" ")).toContain(
      "can never be opened",
    );
  });

  it("catches an opening beat citing a passage the game does not carry", () => {
    const issues = broken((episode) => {
      episode.opening[0]!.passages = [ref("exodus", 3, "14")];
    });
    expect(messagesFor(issues, "opening:in-egypt").join(" ")).toContain("does not resolve");
  });

  it("catches an opening beat with nothing to say", () => {
    const issues = broken((episode) => {
      episode.opening[1]!.lines = [];
    });
    expect(messagesFor(issues, "opening:the-night").join(" ")).toContain("has no text");
  });

  it("catches prose that writes a household name instead of a token", () => {
    const issues = broken((episode) => {
      episode.events["the-asking"]!.body = "Tirzah counts what you were given.";
    });
    expect(messagesFor(issues, "event:the-asking").join(" ")).toContain(
      'writes the name "Tirzah" directly',
    );
  });

  it("catches a name token pointing at nobody", () => {
    const issues = broken((episode) => {
      episode.campLines[0]!.text = "{jethro} is waiting by the fire.";
    });
    expect(messagesFor(issues, "camp-line:eliab").join(" ")).toContain(
      "is not in the household",
    );
  });

  /**
   * The player picks each member's face from several looks, so a description that
   * says "she" can contradict what is on screen.
   */
  it("catches a roster description that assumes a sex", () => {
    const issues = broken((episode) => {
      episode.household[1]!.description = "She will tell you plainly when you are wrong.";
    });
    expect(messagesFor(issues, "household:tirzah").join(" ")).toContain("sex-neutral");
  });

  it("warns about an event no leg can reach", () => {
    const issues = broken((episode) => {
      episode.legs[0]!.pool = [];
    });
    const warnings = issues.filter((i) => i.level === "warning").map((i) => i.message);
    expect(warnings.join(" ")).toContain("never reachable");
  });
});

describe("verse specs", () => {
  it("reads single verses, ranges, and lists", () => {
    expect(parseVerses("34")).toEqual([34]);
    expect(parseVerses("37-38")).toEqual([37, 38]);
    expect(parseVerses("3,5-6")).toEqual([3, 5, 6]);
  });

  it("rejects malformed and backwards specs rather than guessing", () => {
    expect(parseVerses("38-37")).toEqual([]);
    expect(parseVerses("twelve")).toEqual([]);
    expect(parseVerses("")).toEqual([]);
  });

  it("refuses a range where any verse is missing, rather than rendering a gap", () => {
    // Exodus 12:29-42 is bundled; 43 is not.
    expect(getPassage(ref("exodus", 12, "42"))).not.toBeNull();
    expect(getPassage(ref("exodus", 12, "42-43"))).toBeNull();
  });
});

/**
 * The set pieces are where a Bible game is most tempted to let the player change
 * what happened, so the validator is stricter here than anywhere else.
 */
describe("the validator guards the set pieces", () => {
  it("catches a set piece that does not cite anything", () => {
    const issues = broken((episode) => {
      episode.setPieces["marah"]!.provenance = reasoned(
        "A basis long enough to pass the length check but still not a citation.",
      );
    });
    expect(errors(issues).some((i) => /must cite chapter and verse/i.test(i.message))).toBe(true);
  });

  /** Presenting an invented outcome as what Scripture records is the worst failure here. */
  it("catches an outcome that is not recorded", () => {
    const issues = broken((episode) => {
      episode.setPieces["marah"]!.outcome.provenance = reasoned(
        "Plausible enough, but this is the part of a set piece that is not ours to reason about.",
      );
    });
    expect(
      errors(issues).some((i) => /What happens at a set piece is recorded/i.test(i.message)),
    ).toBe(true);
  });

  /** The household is invented, so its decisions cannot be tagged as Scripture. */
  it("catches a choice claiming to be recorded", () => {
    const issues = broken((episode) => {
      episode.setPieces["marah"]!.phases[0]!.choices[0]!.provenance = recorded(
        ref("exodus", 15, "22"),
      );
    });
    expect(
      errors(issues).some((i) => /what your invented household did/i.test(i.message)),
    ).toBe(true);
  });

  it("catches a set piece unlocking a Codex entry that does not exist", () => {
    const issues = broken((episode) => {
      episode.setPieces["marah"]!.unlocks = ["no-such-entry"];
    });
    expect(errors(issues).some((i) => /unlocks unknown Codex entry/i.test(i.message))).toBe(true);
  });

  it("catches two phases sharing an id", () => {
    const issues = broken((episode) => {
      const piece = episode.setPieces["marah"]!;
      piece.phases[1]!.id = piece.phases[0]!.id;
    });
    expect(errors(issues).some((i) => /duplicate id/i.test(i.message))).toBe(true);
  });

  it("catches an empty set piece", () => {
    const issues = broken((episode) => {
      episode.setPieces["marah"]!.phases = [];
    });
    expect(errors(issues).some((i) => /has no phases/i.test(i.message))).toBe(true);
  });

  /** Exodus 18 records the ranks and names none of the men who held them. */
  it("catches a judge presented as a real named person", () => {
    const issues = broken((episode) => {
      episode.judges[0]!.provenance = recorded(ref("exodus", 18, "25"));
    });
    expect(errors(issues).some((i) => /every judge here is invented/i.test(i.message))).toBe(true);
  });
});

/**
 * A structural guarantee rather than a spot check: no authored choice anywhere in
 * the set pieces can hand the household supplies. Relief comes from the recorded
 * outcome or not at all, which is what makes the water at Marah land.
 */
describe("relief cannot be earned by choosing well", () => {
  it("gives no set-piece choice anywhere a way to hand out provisions", () => {
    for (const piece of Object.values(episode1.setPieces)) {
      for (const phase of piece.phases) {
        for (const choice of phase.choices) {
          expect(choice, `${piece.id} > ${phase.id} > ${choice.id}`).not.toHaveProperty(
            "provisions",
          );
        }
      }
    }
  });

  it("puts Marah's water on the outcome, where the player cannot reach it", () => {
    const marah = episode1.setPieces["marah"]!;
    expect(marah.outcome.provisions?.water).toBeGreaterThan(0);
    expect(marah.phases.every((phase) => phase.futile)).toBe(true);
  });
});
