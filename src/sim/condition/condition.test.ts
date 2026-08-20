import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  abandonLoad,
  assignCarry,
  authoredDeath,
  createHousehold,
  deserialize,
  resolveCamp,
  resolveDecision,
  serialize,
  travelTick,
  TUNING,
  type CampAction,
  type ConditionEvent,
  type HeatBand,
  type HouseholdState,
  type Member,
  type Pace,
  type Result,
} from "./index";

/**
 * The twelve acceptance tests from the specification, plus the supporting cases
 * that keep the four zero-states from collapsing into one another.
 *
 * These encode design intent. A change that breaks one is a design regression,
 * not a bug, and should be argued for rather than patched around.
 */

const seeds = [
  { id: "eliab", name: "Eliab", role: "head" as const, age: "adult" as const },
  { id: "tirzah", name: "Tirzah", role: "spouse" as const, age: "adult" as const },
  { id: "elon", name: "Elon", role: "child" as const, age: "child" as const },
  { id: "naamah", name: "Naamah", role: "elder" as const, age: "elder" as const },
];

const household = (): HouseholdState => createHousehold(seeds);

const member = (state: HouseholdState, id: string): Member =>
  state.members.find((m) => m.id === id)!;

const withMeters = (
  state: HouseholdState,
  id: string,
  meters: Partial<Member["meters"]>,
): HouseholdState => ({
  ...state,
  members: state.members.map((m) =>
    m.id === id ? { ...m, meters: { ...m.meters, ...meters } } : m,
  ),
});

const has = (events: ConditionEvent[], kind: ConditionEvent["kind"]): boolean =>
  events.some((e) => e.kind === kind);

/** Walk until something happens, or give up. Returns every event seen. */
function march(
  state: HouseholdState,
  hours: number,
  ctx: { pace: Pace; heat: HeatBand; leg?: number } = { pace: "forced", heat: "midday" },
): Result {
  let next = state;
  const events: ConditionEvent[] = [];
  for (let i = 0; i < hours; i++) {
    const tick = travelTick(next, {
      hours: 1,
      pace: ctx.pace,
      heat: ctx.heat,
      leg: ctx.leg ?? 1,
    });
    next = tick.state;
    events.push(...tick.events);
  }
  return { state: next, events };
}

// --- 1 -----------------------------------------------------------------------

describe("1 · water at zero with nobody to carry them", () => {
  it("makes them straggle at leg end, and does not kill them", () => {
    const dry = withMeters(household(), "elon", { water: 0 });
    const camped = resolveCamp(dry, { leg: 1, actions: [] });
    const elon = member(camped.state, "elon");

    expect(elon.states.has("straggling")).toBe(true);
    expect(elon.dead).toBe(false);
    expect(has(camped.events, "ColumnLost")).toBe(true);
  });

  it("leaves them with the column when somebody carried them", () => {
    let state = withMeters(household(), "elon", { water: 0 });
    state = resolveCamp(state, { leg: 1, actions: [] }).state; // enters collapsed path
    state = withMeters(household(), "elon", { water: 0 });
    const carried = assignCarry(state, "eliab", { type: "person", memberId: "elon" }).state;

    const camped = resolveCamp(carried, { leg: 1, actions: [] });
    expect(member(camped.state, "elon").states.has("straggling")).toBe(false);
  });
});

// --- 2 and 3 -----------------------------------------------------------------

describe("2 · one carry slot", () => {
  it("refuses a person when an adult already has a load", () => {
    const state: HouseholdState = {
      ...household(),
      loads: [{ id: "grain", label: "Grain", abandoned: false }],
    };
    const withLoad = assignCarry(state, "eliab", { type: "load", loadId: "grain" }).state;

    const attempt = assignCarry(withLoad, "eliab", { type: "person", memberId: "elon" });
    expect(has(attempt.events, "CarryRejected")).toBe(true);
    expect(member(attempt.state, "eliab").carrying).toEqual({ type: "load", loadId: "grain" });
  });

  it("refuses a load when an adult is already carrying somebody", () => {
    const state: HouseholdState = {
      ...household(),
      loads: [{ id: "grain", label: "Grain", abandoned: false }],
    };
    const carrying = assignCarry(state, "eliab", { type: "person", memberId: "elon" }).state;
    const attempt = assignCarry(carrying, "eliab", { type: "load", loadId: "grain" });
    expect(has(attempt.events, "CarryRejected")).toBe(true);
  });

  it("does not let a child or an elder carry anything", () => {
    const state = household();
    expect(has(assignCarry(state, "elon", { type: "person", memberId: "naamah" }).events, "CarryRejected")).toBe(true);
    expect(has(assignCarry(state, "naamah", { type: "person", memberId: "elon" }).events, "CarryRejected")).toBe(true);
  });
});

describe("3 · nothing is ever dropped automatically", () => {
  it("requires an explicit abandonLoad before the slot frees up", () => {
    const state: HouseholdState = {
      ...household(),
      loads: [{ id: "grain", label: "Grain", abandoned: false }],
    };
    const withLoad = assignCarry(state, "eliab", { type: "load", loadId: "grain" }).state;

    // Blocked while the load is still held.
    expect(has(assignCarry(withLoad, "eliab", { type: "person", memberId: "elon" }).events, "CarryRejected")).toBe(true);

    const dropped = abandonLoad(withLoad, "grain");
    expect(has(dropped.events, "LoadAbandoned")).toBe(true);
    expect(member(dropped.state, "eliab").carrying).toBeNull();

    const now = assignCarry(dropped.state, "eliab", { type: "person", memberId: "elon" });
    expect(has(now.events, "CarryRejected")).toBe(false);
    expect(member(now.state, "eliab").carrying).toEqual({ type: "person", memberId: "elon" });
  });

  /** Setting a load down is permanent. It is the price of picking a person up. */
  it("abandons a load permanently", () => {
    const state: HouseholdState = {
      ...household(),
      loads: [{ id: "grain", label: "Grain", abandoned: false }],
    };
    const dropped = abandonLoad(state, "grain").state;
    expect(dropped.loads[0]!.abandoned).toBe(true);

    const attempt = assignCarry(dropped, "eliab", { type: "load", loadId: "grain" });
    expect(has(attempt.events, "CarryRejected")).toBe(true);
  });
});

// --- 4 and 5 -----------------------------------------------------------------

describe("4 · murmuring cannot be bought off", () => {
  it("survives five legs of unlimited water, food and rest", () => {
    let state = withMeters(household(), "elon", { spirit: 0 });
    state = resolveCamp(state, { leg: 0, actions: [] }).state;
    expect(member(state, "elon").states.has("murmuring")).toBe(true);

    for (let leg = 1; leg <= 5; leg++) {
      state = resolveCamp(state, {
        leg,
        actions: [{ kind: "rest" }, { kind: "water", amount: 100 }],
        rested: true,
      }).state;
    }

    const elon = member(state, "elon");
    expect(elon.states.has("murmuring")).toBe(true);
    expect(elon.meters.water).toBeGreaterThan(50);
    expect(elon.meters.body).toBeGreaterThan(50);
  });

  it("clears on a conversation the player actually sat through", () => {
    let state = withMeters(household(), "elon", { spirit: 0 });
    state = resolveCamp(state, { leg: 0, actions: [] }).state;

    const skipped = resolveCamp(state, {
      leg: 1,
      actions: [{ kind: "conversation", memberId: "elon", completed: false }],
    });
    expect(member(skipped.state, "elon").states.has("murmuring")).toBe(true);

    const sat = resolveCamp(state, {
      leg: 1,
      actions: [{ kind: "conversation", memberId: "elon", completed: true }],
    });
    expect(member(sat.state, "elon").states.has("murmuring")).toBe(false);
  });

  it("clears on a communal event, for everybody", () => {
    let state = withMeters(household(), "elon", { spirit: 0 });
    state = resolveCamp(state, { leg: 0, actions: [] }).state;
    const elim = resolveCamp(state, { leg: 1, actions: [{ kind: "communal" }] });
    expect(member(elim.state, "elon").states.has("murmuring")).toBe(false);
  });

  it("clears when another member spends the camp with them, at a cost", () => {
    let state = withMeters(household(), "elon", { spirit: 0 });
    state = resolveCamp(state, { leg: 0, actions: [] }).state;
    const before = member(state, "tirzah").meters.spirit;

    const sat = resolveCamp(state, {
      leg: 1,
      actions: [{ kind: "peerSupport", helperId: "tirzah", recipientId: "elon" }],
    });
    expect(member(sat.state, "elon").states.has("murmuring")).toBe(false);
    expect(member(sat.state, "tirzah").meters.spirit).toBeLessThan(before);
  });

  it("will not let somebody with nothing left to give do the lifting", () => {
    let state = withMeters(household(), "elon", { spirit: 0 });
    state = withMeters(state, "tirzah", { spirit: 20 });
    state = resolveCamp(state, { leg: 0, actions: [] }).state;

    const sat = resolveCamp(state, {
      leg: 1,
      actions: [{ kind: "peerSupport", helperId: "tirzah", recipientId: "elon" }],
    });
    expect(member(sat.state, "elon").states.has("murmuring")).toBe(true);
  });
});

describe("5 · murmuring spreads", () => {
  it("costs every other household member spirit at camp", () => {
    let state = withMeters(household(), "elon", { spirit: 0 });
    state = resolveCamp(state, { leg: 0, actions: [] }).state;

    const before = state.members.map((m) => ({ id: m.id, spirit: m.meters.spirit }));
    const camped = resolveCamp(state, { leg: 1, actions: [] });

    for (const b of before) {
      if (b.id === "elon") continue;
      expect(member(camped.state, b.id).meters.spirit).toBeLessThan(b.spirit);
    }
    expect(has(camped.events, "ContagionSpread")).toBe(true);
  });

  it("gets worse with more than one murmurer", () => {
    let one = withMeters(household(), "elon", { spirit: 0 });
    one = resolveCamp(one, { leg: 0, actions: [] }).state;

    let two = withMeters(household(), "elon", { spirit: 0 });
    two = withMeters(two, "naamah", { spirit: 0 });
    two = resolveCamp(two, { leg: 0, actions: [] }).state;

    const afterOne = resolveCamp(one, { leg: 1, actions: [] }).state;
    const afterTwo = resolveCamp(two, { leg: 1, actions: [] }).state;

    expect(member(afterTwo, "eliab").meters.spirit).toBeLessThan(
      member(afterOne, "eliab").meters.spirit,
    );
  });
});

// --- 6 and 7 -----------------------------------------------------------------

describe("6 · zero trust across two legs", () => {
  it("departs the household and stays addressable in camp", () => {
    let state = household();
    state = resolveDecision(state, { leg: 1, trust: { elon: -100 } }).state;
    expect(member(state, "elon").states.has("defiant")).toBe(true);

    state = resolveCamp(state, { leg: 1, actions: [] }).state;
    expect(member(state, "elon").attachedTo).toBe("player");

    const second = resolveCamp(state, { leg: 2, actions: [] });
    expect(has(second.events, "MemberDeparted")).toBe(true);

    const elon = member(second.state, "elon");
    expect(elon.attachedTo).not.toBe("player");
    // Still in the camp — visible at another fire, not deleted.
    expect(second.state.members.some((m) => m.id === "elon")).toBe(true);
    expect(elon.dead).toBe(false);
  });

  it("resets the clock if trust comes back before the second leg ends", () => {
    let state = household();
    state = resolveDecision(state, { leg: 1, trust: { elon: -100 } }).state;
    state = resolveCamp(state, { leg: 1, actions: [] }).state;
    state = resolveDecision(state, { leg: 2, trust: { elon: 40 } }).state;

    const second = resolveCamp(state, { leg: 2, actions: [] });
    expect(has(second.events, "MemberDeparted")).toBe(false);
    expect(member(second.state, "elon").legsAtZeroTrust).toBe(0);
  });
});

describe("7 · the road back", () => {
  const departed = (): HouseholdState => {
    let state = household();
    state = resolveDecision(state, { leg: 1, trust: { elon: -100 } }).state;
    state = resolveCamp(state, { leg: 1, actions: [] }).state;
    state = resolveCamp(state, { leg: 2, actions: [] }).state;
    return state;
  };

  it("takes three legs of kept commitments and a visit on each", () => {
    let state = resolveDecision(departed(), { leg: 3, trust: { elon: 60 } }).state;
    for (const leg of [3, 4, 5]) {
      state = resolveCamp(state, {
        leg,
        actions: [{ kind: "visitDeparted", memberId: "elon" }],
      }).state;
    }
    expect(member(state, "elon").attachedTo).toBe("player");
  });

  it("resets to zero on a single broken commitment", () => {
    let state = resolveDecision(departed(), { leg: 3, trust: { elon: 60 } }).state;
    state = resolveCamp(state, {
      leg: 3,
      actions: [{ kind: "visitDeparted", memberId: "elon" }],
    }).state;
    expect(member(state, "elon").returnProgress.legsKept).toBe(1);

    state = resolveDecision(state, { leg: 4, trust: {}, brokeCommitment: true }).state;
    expect(member(state, "elon").returnProgress.legsKept).toBe(0);
    expect(member(state, "elon").attachedTo).not.toBe("player");
  });
});

// --- 8 -----------------------------------------------------------------------

describe("8 · scarring", () => {
  it("lowers the ceiling by ten each time a meter reaches zero", () => {
    let state = withMeters(household(), "elon", { spirit: 5 });
    state = resolveCamp(state, { leg: 1, actions: [], legSpiritDelta: -10 }).state;
    expect(member(state, "elon").maxes.spirit).toBe(90);

    // Back up, then down to zero a second time.
    state = resolveCamp(state, { leg: 2, actions: [{ kind: "communal" }] }).state;
    state = resolveCamp(state, { leg: 3, actions: [], legSpiritDelta: -100 }).state;
    expect(member(state, "elon").maxes.spirit).toBe(80);
  });

  it("never lets a meter climb past its lowered ceiling", () => {
    let state = withMeters(household(), "elon", { spirit: 5 });
    state = resolveCamp(state, { leg: 1, actions: [], legSpiritDelta: -10 }).state;
    for (let leg = 2; leg < 8; leg++) {
      state = resolveCamp(state, { leg, actions: [{ kind: "communal" }] }).state;
    }
    const elon = member(state, "elon");
    expect(elon.meters.spirit).toBeLessThanOrEqual(elon.maxes.spirit);
    expect(elon.meters.spirit).toBeLessThanOrEqual(90);
  });

  it("holds the floor at forty however many times it happens", () => {
    let state = withMeters(household(), "elon", { spirit: 100 });
    for (let leg = 1; leg <= 12; leg++) {
      state = resolveCamp(state, { leg, actions: [], legSpiritDelta: -200 }).state;
      state = resolveCamp(state, { leg, actions: [{ kind: "communal" }] }).state;
    }
    expect(member(state, "elon").maxes.spirit).toBe(TUNING.scarFloor);
  });

  it("records what happened and on which leg", () => {
    let state = withMeters(household(), "elon", { spirit: 5 });
    state = resolveCamp(state, { leg: 7, actions: [], legSpiritDelta: -10 }).state;
    const scars = member(state, "elon").scars;
    expect(scars).toHaveLength(1);
    expect(scars[0]!.meter).toBe("spirit");
    expect(scars[0]!.leg).toBe(7);
    expect(scars[0]!.cause.length).toBeGreaterThan(0);
  });
});

// --- 9 -----------------------------------------------------------------------

describe("9 · the simulation never kills anybody", () => {
  it("survives ten thousand randomised marches", () => {
    const paces: Pace[] = ["steady", "pressing", "forced"];
    const heats: HeatBand[] = ["dawn", "morning", "midday", "afternoon", "evening", "night"];

    // Deterministic pseudo-random, so a failure is reproducible.
    let seed = 0x5eed;
    const rand = (n: number): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed % n;
    };

    let deaths = 0;
    let sawCollapse = false;
    let sawStraggle = false;

    for (let run = 0; run < 10_000; run++) {
      let state = household();
      const hours = 1 + rand(30);
      for (let h = 0; h < hours; h++) {
        state = travelTick(state, {
          hours: 1,
          pace: paces[rand(paces.length)]!,
          heat: heats[rand(heats.length)]!,
          leg: 1 + rand(12),
        }).state;
      }
      state = resolveCamp(state, {
        leg: 1,
        actions: [],
        legSpiritDelta: -rand(20),
        rested: rand(2) === 0,
      }).state;

      for (const m of state.members) {
        if (m.dead) deaths++;
        if (m.states.has("collapsed")) sawCollapse = true;
        if (m.states.has("straggling")) sawStraggle = true;
      }
    }

    expect(deaths).toBe(0);
    // And the fuzz actually reached the bottom, so the assertion means something.
    expect(sawCollapse).toBe(true);
    expect(sawStraggle).toBe(true);
  });

  it("dies only when a writer says so", () => {
    const dead = authoredDeath(household(), "naamah", 9, "the plague at Taberah");
    expect(member(dead.state, "naamah").dead).toBe(true);
    expect(has(dead.events, "AuthoredDeath")).toBe(true);
  });

  it("stops carrying whatever they were carrying", () => {
    const carrying = assignCarry(household(), "eliab", { type: "person", memberId: "elon" }).state;
    const dead = authoredDeath(carrying, "eliab", 9, "authored").state;
    expect(member(dead, "eliab").carrying).toBeNull();
  });
});

// --- 10 ----------------------------------------------------------------------

describe("10 · the environment cannot reach trust", () => {
  /**
   * The type boundary does the real work — `EnvDelta` has no `trust` key, so no
   * environmental caller can express the mutation. This is the behavioural half.
   */
  it("leaves trust untouched by any amount of marching", () => {
    const before = household().members.map((m) => m.meters.trust);
    const marched = march(household(), 40, { pace: "forced", heat: "midday" });
    expect(marched.state.members.map((m) => m.meters.trust)).toEqual(before);
  });

  it("leaves trust untouched by camp, thirst, hunger or a night without rest", () => {
    let state = withMeters(household(), "elon", { water: 0, body: 5, spirit: 0 });
    const before = member(state, "elon").meters.trust;
    for (let leg = 1; leg <= 6; leg++) {
      state = resolveCamp(state, {
        leg,
        actions: [],
        legSpiritDelta: -30,
        rested: false,
      }).state;
    }
    expect(member(state, "elon").meters.trust).toBe(before);
  });

  it("moves trust only through a decision", () => {
    const decided = resolveDecision(household(), { leg: 1, trust: { elon: -25 } });
    expect(member(decided.state, "elon").meters.trust).toBe(75);
  });

  it("keeps trust out of the environmental delta type", () => {
    const source = readFileSync("src/sim/condition/types.ts", "utf8");
    // The enforcement itself, asserted rather than assumed.
    expect(source).toContain('Exclude<MeterName, "trust">');
  });
});

// --- 11 ----------------------------------------------------------------------

describe("11 · no coupling to the quiz or the Codex", () => {
  it("imports nothing from content, quiz, Codex, React or Phaser", () => {
    const dir = "src/sim/condition";
    const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = readFileSync(`${dir}/${file}`, "utf8");
      const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]!);
      for (const specifier of imports) {
        expect(specifier, `${file} imports ${specifier}`).not.toMatch(
          /content|quiz|codex|react|phaser|@\/ui|@\/game|@\/state/i,
        );
      }
    }
  });

  it("keeps every import inside the module itself", () => {
    const dir = "src/sim/condition";
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))) {
      const source = readFileSync(`${dir}/${file}`, "utf8");
      for (const m of source.matchAll(/from\s+"([^"]+)"/g)) {
        expect(m[1]!, `${file}`).toMatch(/^\.\//);
      }
    }
  });
});

// --- 12 ----------------------------------------------------------------------

describe("12 · determinism", () => {
  const script = (state: HouseholdState): HouseholdState => {
    let next = state;
    for (let h = 0; h < 12; h++) {
      next = travelTick(next, { hours: 1, pace: "forced", heat: "midday", leg: 3 }).state;
    }
    next = resolveDecision(next, { leg: 3, trust: { elon: -40, naamah: -10 } }).state;
    next = resolveCamp(next, {
      leg: 3,
      actions: [{ kind: "rest" }, { kind: "water", amount: 60 }],
      legSpiritDelta: -8,
      rested: true,
    }).state;
    return next;
  };

  it("gives byte-identical state for identical inputs", () => {
    expect(serialize(script(household()))).toBe(serialize(script(household())));
  });

  it("round-trips through serialize and deserialize", () => {
    const played = script(household());
    const restored = deserialize(serialize(played));
    expect(serialize(restored)).toBe(serialize(played));
    // Sets survive the trip as sets, not arrays.
    expect(restored.members[0]!.states instanceof Set).toBe(true);
  });
});

// --- The four verbs stay four verbs ------------------------------------------

/**
 * The requirement the spec puts above all others: if two zero-states produce the
 * same player experience, the model has collapsed into one meter in four
 * costumes. These assert that each one still does something the others do not.
 */
describe("the four zero-states stay distinct", () => {
  const at = (meter: keyof Member["meters"]): HouseholdState => {
    let state = withMeters(household(), "elon", { [meter]: 0 });
    state = resolveCamp(state, { leg: 1, actions: [] }).state;
    if (meter === "trust") {
      state = resolveDecision(state, { leg: 1, trust: { elon: -100 } }).state;
    }
    return state;
  };

  it("water — they are carried, and the choice costs a load", () => {
    const state = withMeters(household(), "elon", { water: 0 });
    const marched = march(state, 1);
    expect(member(marched.state, "elon").states.has("collapsed")).toBe(true);
    // The consuming layer is told, and nothing is auto-resolved.
    expect(has(marched.events, "CarrierNeeded")).toBe(true);
  });

  it("body — they are left behind, and it costs days", () => {
    const state = at("body");
    expect(member(state, "elon").states.has("straggling")).toBe(true);
    // Entering always leaves something behind that has to be treated.
    expect(member(state, "elon").conditions.length).toBeGreaterThan(0);
  });

  it("spirit — it spreads to everyone else", () => {
    const state = at("spirit");
    const camped = resolveCamp(state, { leg: 2, actions: [] });
    expect(has(camped.events, "ContagionSpread")).toBe(true);
  });

  it("trust — they disobey, and eventually leave", () => {
    const state = at("trust");
    expect(member(state, "elon").states.has("defiant")).toBe(true);
    const gone = resolveCamp(resolveCamp(state, { leg: 1, actions: [] }).state, {
      leg: 2,
      actions: [],
    });
    expect(has(gone.events, "MemberDeparted")).toBe(true);
  });

  it("uses a different exit threshold for each", () => {
    const thresholds = new Set([
      TUNING.collapseExitWater,
      TUNING.stragglingExitBody,
      TUNING.defiantExitTrust,
    ]);
    expect(thresholds.size).toBe(3);
  });
});

// --- Recovery ----------------------------------------------------------------

describe("recovery", () => {
  it("brings a collapsed member back weakened, not whole", () => {
    let state = withMeters(household(), "elon", { water: 0 });
    state = march(state, 1).state;
    expect(member(state, "elon").states.has("collapsed")).toBe(true);

    const watered = resolveCamp(state, { leg: 1, actions: [{ kind: "water", amount: 60 }] });
    const elon = member(watered.state, "elon");
    expect(elon.states.has("collapsed")).toBe(false);
    expect(elon.states.has("weakened")).toBe(true);
  });

  it("clears weakened at the end of the leg it began on", () => {
    let state = withMeters(household(), "elon", { water: 0 });
    state = march(state, 1).state;
    state = resolveCamp(state, { leg: 1, actions: [{ kind: "water", amount: 60 }] }).state;
    expect(member(state, "elon").states.has("weakened")).toBe(true);

    state = resolveCamp(state, { leg: 2, actions: [] }).state;
    expect(member(state, "elon").states.has("weakened")).toBe(false);
  });

  it("will not let a weakened member carry anything", () => {
    let state = withMeters(household(), "eliab", { water: 0 });
    state = march(state, 1).state;
    state = resolveCamp(state, { leg: 1, actions: [{ kind: "water", amount: 60 }] }).state;
    const attempt = assignCarry(state, "eliab", { type: "person", memberId: "elon" });
    expect(has(attempt.events, "CarryRejected")).toBe(true);
  });

  it("caps body while a persistent condition is untreated, and lifts it after treatment", () => {
    const state = at();
    const capped = member(state, "elon");
    expect(capped.conditions.length).toBeGreaterThan(0);

    let treated = state;
    const nights = capped.conditions[0]!.nightsToTreat;
    for (let n = 0; n < nights; n++) {
      treated = resolveCamp(treated, {
        leg: 2 + n,
        actions: [{ kind: "treat", memberId: "elon" }, { kind: "rest" }],
      }).state;
    }
    const after = member(treated, "elon");
    expect(after.conditions.every((c) => c.nightsTreated >= c.nightsToTreat)).toBe(true);
    expect(after.meters.body).toBeGreaterThan(TUNING.persistentConditionBodyCap - 40);
  });

  function at(): HouseholdState {
    let state = withMeters(household(), "elon", { body: 0 });
    state = resolveCamp(state, { leg: 1, actions: [] }).state;
    return state;
  }
});
