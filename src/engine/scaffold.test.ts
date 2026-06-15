import { describe, it, expect } from "vitest";
import {
  buildAuditDirective,
  forgePrompt,
  AUDIT_OUTPUT_SCHEMA,
} from "./scaffold";
import { BIASES } from "../data/biases";

describe("buildAuditDirective", () => {
  it("asks for reasoning when it is missing", () => {
    expect(buildAuditDirective({ judgment: "Quit my job" }).status).toBe(
      "needs_reasoning",
    );
  });

  it("asks for reasoning when it is blank", () => {
    expect(
      buildAuditDirective({ judgment: "x", reasoning: "   " }).status,
    ).toBe("needs_reasoning");
  });

  it("produces an audit directive carrying all 22 candidate biases", () => {
    const r = buildAuditDirective({
      judgment: "Rewrite it",
      reasoning: "we already spent two months",
    });
    expect(r.status).toBe("audit");
    if (r.status !== "audit") return;
    expect(r.candidateBiases).toHaveLength(BIASES.length);
    expect(r.mode).toBe("forward");
    expect(r.judgment).toBe("Rewrite it");
  });

  it("switches the premortem step to the outcome-flip test in retrospective mode", () => {
    const fwd = buildAuditDirective({
      judgment: "a",
      reasoning: "b",
      mode: "forward",
    });
    const retro = buildAuditDirective({
      judgment: "a",
      reasoning: "b",
      mode: "retrospective",
    });
    if (fwd.status === "audit")
      expect(fwd.instructions.toLowerCase()).toContain("premortem");
    if (retro.status === "audit")
      expect(retro.instructions.toLowerCase()).toContain("outcome-flip");
  });

  it("encodes the adversarial, evidence-bound contract", () => {
    const r = buildAuditDirective({ judgment: "a", reasoning: "b" });
    if (r.status !== "audit") throw new Error("expected audit");
    const i = r.instructions.toLowerCase();
    expect(i).toContain("adversarial");
    expect(i).toContain("evidence");
    expect(i).toContain("system 1");
  });

  it("adds a language instruction when a language is given, and keeps bias ids canonical", () => {
    const r = buildAuditDirective({
      judgment: "a",
      reasoning: "b",
      language: "Tamil",
    });
    if (r.status !== "audit") throw new Error("expected audit");
    expect(r.instructions).toContain("Tamil");
    const i = r.instructions.toLowerCase();
    expect(i).toContain("respond");
    // structured output must stay parseable: ids/keys not translated
    expect(i).toContain("ids");
  });

  it("omits the language instruction when no language is given", () => {
    const r = buildAuditDirective({ judgment: "a", reasoning: "b" });
    if (r.status !== "audit") throw new Error("expected audit");
    expect(r.instructions.toLowerCase()).not.toContain("respond entirely in");
  });

  it("describes the composed output format", () => {
    expect(Object.keys(AUDIT_OUTPUT_SCHEMA)).toEqual(
      expect.arrayContaining([
        "verdict",
        "system",
        "biases",
        "outside_view",
        "premortem",
        "adversarial_questions",
        "recalibration",
      ]),
    );
  });
});

describe("forgePrompt", () => {
  it("embeds the judgment, the reasoning, and the adversarial directive", () => {
    const p = forgePrompt({
      judgment: "Sell the stock",
      reasoning: "it is down 40%",
    });
    expect(p).toContain("Sell the stock");
    expect(p).toContain("down 40%");
    expect(p.toLowerCase()).toContain("adversarial");
  });

  it("carries the language instruction into the forge prompt", () => {
    const p = forgePrompt({
      judgment: "x",
      reasoning: "y",
      language: "Spanish",
    });
    expect(p).toContain("Spanish");
  });
});
