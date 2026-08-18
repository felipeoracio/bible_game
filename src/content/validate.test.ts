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

  it("has no warnings either", () => {
    const warnings = validateEpisode(episode1).filter((i) => i.level === "warning");
    expect(warnings, warnings.map((w) => `${w.where}: ${w.message}`).join("\n")).toHaveLength(0);
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
      episode.codex["succoth"]!.related = ["etham"];
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
