import { describe, it, expect } from "vitest";
import { z } from "zod";
import { BIASES, FAMILIES, type Family } from "./biases";

const FAMILY_IDS = [
  "too-much-information",
  "not-enough-meaning",
  "need-to-act-fast",
  "what-we-remember",
] as const;

const BiasSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id must be kebab-case"),
  name: z.string().min(2),
  family: z.enum(FAMILY_IDS),
  hook: z.string().min(10),
  definition: z.string().min(40),
  example: z.string().min(10),
  counter: z.string().min(10),
  ask: z
    .string()
    .min(10)
    .refine((s) => s.trim().endsWith("?"), "ask must be a question"),
  source: z.string().min(8),
  sourceUrl: z.string().url().optional(),
});

describe("bias catalogue", () => {
  it("contains exactly 22 biases", () => {
    expect(BIASES.length).toBe(22);
  });

  it("every entry satisfies the schema", () => {
    for (const b of BIASES) {
      const r = BiasSchema.safeParse(b);
      expect(
        r.success,
        `${b.id}: ${r.success ? "" : JSON.stringify(r.error.issues)}`,
      ).toBe(true);
    }
  });

  it("ids are unique", () => {
    const ids = BIASES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("family distribution is 5 / 6 / 6 / 5", () => {
    const n = (f: Family) => BIASES.filter((b) => b.family === f).length;
    expect(n("too-much-information")).toBe(5);
    expect(n("not-enough-meaning")).toBe(6);
    expect(n("need-to-act-fast")).toBe(6);
    expect(n("what-we-remember")).toBe(5);
  });

  it("every family referenced has metadata (with a colour)", () => {
    for (const f of FAMILY_IDS) {
      expect(FAMILIES[f]).toBeDefined();
      expect(FAMILIES[f].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("includes Kahneman's canonical ten", () => {
    const canonical = [
      "anchoring",
      "availability",
      "representativeness",
      "wysiati",
      "overconfidence",
      "loss-aversion",
      "framing",
      "planning-fallacy",
      "sunk-cost",
      "hindsight",
    ];
    const ids = new Set(BIASES.map((b) => b.id));
    for (const c of canonical) expect(ids.has(c), `missing ${c}`).toBe(true);
  });

  it("includes the two retrospective additions", () => {
    const ids = new Set(BIASES.map((b) => b.id));
    expect(ids.has("outcome")).toBe(true);
    expect(ids.has("self-serving")).toBe(true);
  });
});
