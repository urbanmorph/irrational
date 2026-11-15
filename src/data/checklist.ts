// The pen-and-paper audit, single source for the printable /checklist page and the
// `irrational checklist` command. The steps mirror the engine's procedure (scaffold.ts).

export interface ChecklistStep {
  title: string;
  /** what to think about, shown under the title */
  hint?: string;
  /** tick-box choices (step 1) */
  options?: string[];
  /** questions to sit with (step 5) */
  questions?: string[];
}

export interface Checklist {
  title: string;
  subtitle: string;
  steps: ChecklistStep[];
  evidenceLabel: string;
  confidenceLabel: string;
  footer: string[];
}

export const CHECKLIST: Checklist = {
  title: "Irrational: bias audit",
  subtitle:
    "One decision, audited adversarially. Fill it in honestly; the goal is to be told no.",
  steps: [
    {
      title: "Spot the system",
      hint: "Did this come from fast intuition, or slow, deliberate analysis? A confident gut call dressed as analysis is the dangerous one.",
      options: [
        'System 1: fast / intuitive / "it just feels right"',
        "System 2: slow / deliberate / I worked it through",
      ],
    },
    {
      title: "Name the biases",
      hint: "Tick the ones at play, and for each, write the exact thing in your reasoning that shows it. No tick without evidence.",
    },
    {
      title: "Apply the outside view",
      hint: "Forget this case. What usually happens in cases like this, the base rate, and how far is your estimate from it?",
    },
    {
      title: "Run a premortem",
      hint: "It's a year later and this decision failed. Write the single most likely reason, concretely.",
    },
    {
      title: "Sit with the hard questions",
      questions: [
        "If you'd never started / already paid / heard that first number, would you still choose this today?",
        "What evidence would change your mind, and have you actually gone looking for it?",
        "Are you choosing this because it's best, or because it's the default / what everyone's doing / what you already want?",
        "What's the realistic downside, and have you priced it in?",
      ],
    },
    {
      title: "Recalibrate",
      hint: 'The version of the decision that survives scrutiny (not a reflexive "no"), and a confidence level you can defend.',
    },
  ],
  evidenceLabel: "Evidence, in my own words:",
  confidenceLabel: "Confidence I can defend:",
  footer: [
    "irrational.pages.dev: open-source, runs no model, stores nothing",
    "Method: Kahneman's System 1 / 2 · the outside view · the premortem",
  ],
};
