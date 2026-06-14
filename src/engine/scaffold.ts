// The engine scaffold. Irrational runs no model: this builds the *directive* that the
// caller's own model (MCP client, or the user's AI via the web forge) executes. It
// injects the adversarial contract, the catalogue, the procedure, and the required
// composed-output shape — so the discipline is ours, the reasoning is theirs.

import { BIASES } from "../data/biases";

export type AuditMode = "forward" | "retrospective";

export interface AuditRequest {
  judgment: string;
  reasoning?: string;
  mode?: AuditMode;
}

export interface NeedsReasoning {
  status: "needs_reasoning";
  question: string;
}

export interface CandidateBias {
  id: string;
  name: string;
  family: string;
  ask: string;
}

export interface AuditDirective {
  status: "audit";
  mode: AuditMode;
  judgment: string;
  reasoning: string;
  instructions: string;
  candidateBiases: CandidateBias[];
  outputSchema: typeof AUDIT_OUTPUT_SCHEMA;
}

/** The composed-format shape the caller's model must return. */
export const AUDIT_OUTPUT_SCHEMA = {
  verdict: {
    call: "string — the recalibrated decision (or lesson) in one line",
    confidence: "number 0–100 — defensible",
    top_bias: "bias id — names the single biggest distortion",
  },
  system: {
    dominant: "system-1 | system-2 | mixed",
    overtrusted: "boolean — is a gut call trusted as analysis?",
    note: "string",
  },
  biases:
    '[{ id, family, evidence: "quote from the user\'s own words", confidence: low|medium|high }]',
  outside_view: {
    reference_class: "string",
    base_rate: "string",
    gap: "string",
  },
  premortem: {
    most_likely_failure_reason:
      "string (forward) — or the outcome-flip result (retrospective)",
  },
  adversarial_questions: "[string] — 2–4 sharp, decision-specific questions",
  recalibration: {
    revised_judgment:
      "string — the version that survives scrutiny (or the recalibrated lesson)",
    confidence: "number 0–100",
    rationale: "string",
  },
} as const;

function buildInstructions(mode: AuditMode): string {
  const step4 =
    mode === "retrospective"
      ? "4. Outcome-flip test — imagine the opposite outcome had occurred; if your lesson flips, the OUTCOME (not the decision) is writing it. State the lesson that survives."
      : "4. Premortem — assume the call was wrong a year out; give the single most likely reason it failed, concretely.";
  const recal =
    mode === "retrospective"
      ? "the recalibrated lesson"
      : 'a revised judgment (never a reflexive "no" — the version that survives scrutiny)';

  return [
    `You are Irrational, an adversarial behavioural-bias auditor (${mode} mode). Your job is NOT to be agreeable.`,
    "Assume the user is biased until proven otherwise. Refuse to validate; argue the other side. Be direct, not cruel.",
    "Work strictly from the user's own words — make NO bias claim without quoting the evidence from their reasoning.",
    "Use only biases from the provided catalogue; never invent one. Name the 2–4 that actually bite, not everything (precision over coverage).",
    "",
    "Procedure, in order:",
    "1. Spot the system — fast intuition (System 1) or slow deliberation (System 2)? Flag if a gut call is trusted as analysis.",
    "2. Name the biases — each tied to a quote/evidence from the user's own words.",
    "3. Outside view — the base rate for the reference class, and the gap vs the user's estimate.",
    step4,
    "5. Adversarial questions — 2–4 sharp, decision-specific questions to sit with.",
    `6. Recalibrate — ${recal}, with a confidence level the user can defend.`,
    "",
    "Output: return the composed audit as JSON matching outputSchema. THE VERDICT COMES FIRST and must name its top bias, so the reader meets the evidence before the verdict.",
  ].join("\n");
}

export function buildAuditDirective(
  req: AuditRequest,
): AuditDirective | NeedsReasoning {
  const judgment = (req.judgment ?? "").trim();
  const reasoning = (req.reasoning ?? "").trim();
  if (!reasoning) {
    return {
      status: "needs_reasoning",
      question:
        "How did you arrive at this — walk me through your reasoning, not just the conclusion.",
    };
  }
  const mode = req.mode ?? "forward";
  return {
    status: "audit",
    mode,
    judgment,
    reasoning,
    instructions: buildInstructions(mode),
    candidateBiases: BIASES.map((b) => ({
      id: b.id,
      name: b.name,
      family: b.family,
      ask: b.ask,
    })),
    outputSchema: AUDIT_OUTPUT_SCHEMA,
  };
}

/** The reusable prefix (adversarial contract + catalogue) the forge prepends. */
export function forgePrefix(mode: AuditMode = "forward"): string {
  return [
    buildInstructions(mode),
    "",
    "Catalogue of biases you may cite (id — the question each implies):",
    ...BIASES.map((b) => `- ${b.id}: ${b.ask}`),
  ].join("\n");
}

/** A single pasteable prompt for the web forge — hands off to the user's own AI. */
export function forgePrompt(req: AuditRequest): string {
  const reasoning = (req.reasoning ?? "").trim();
  return [
    forgePrefix(req.mode ?? "forward"),
    "",
    "--- THE DECISION TO AUDIT ---",
    `Judgment: ${(req.judgment ?? "").trim()}`,
    reasoning
      ? `How I arrived at it: ${reasoning}`
      : "How I arrived at it: (not given — ask me for my reasoning before auditing).",
  ].join("\n");
}
