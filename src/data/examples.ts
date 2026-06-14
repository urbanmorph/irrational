// Pre-generated worked audits — rendered statically (no model at runtime). Powers the
// home scenario-swap and the /biases worked-examples section. Source: supporting-docs/
// worked-examples.md.

import type { Family } from "./biases";

export interface ExampleBias {
  name: string;
  family: Family;
  evidence: string;
}

export interface WorkedExample {
  id: string;
  chip: string;
  title: string;
  mode: "forward" | "retrospective";
  input: { judgment: string; reasoning: string };
  call: string;
  confidence: string;
  topBias: string;
  biases: ExampleBias[];
  premortem: string;
  questions: string[];
  recalibration: string;
  confidenceLine: string;
}

export const EXAMPLES: WorkedExample[] = [
  {
    id: "rewrite",
    chip: "Rewrite the legacy system",
    title: "Rewrite the 6-year-old backend from scratch",
    mode: "forward",
    input: {
      judgment:
        "We should rewrite our 6-year-old backend from scratch this year.",
      reasoning:
        "The codebase is a mess and the team hates it. We've spent two months on a proof-of-concept that went well, so I'm confident we can finish in six months. Stripe and others did big rewrites and won. The old thing is beyond saving.",
    },
    call: "Don't greenlight the big-bang rewrite. Carve off the worst module first (strangler-fig), behind the current interface, with a hard 3-month checkpoint.",
    confidence: "~25%",
    topBias: "sunk cost",
    biases: [
      {
        name: "Sunk cost",
        family: "need-to-act-fast",
        evidence:
          "“two months on a POC” are gone either way — but they are doing most of the talking.",
      },
      {
        name: "Planning fallacy",
        family: "need-to-act-fast",
        evidence:
          "“about six months” is the best case, with no reference class; rewrites run 2–3×.",
      },
      {
        name: "Survivorship",
        family: "too-much-information",
        evidence:
          "“Stripe did it and won” quotes the survivors and steps over the graveyard.",
      },
      {
        name: "WYSIATI",
        family: "not-enough-meaning",
        evidence:
          "“beyond saving” ignores the undocumented logic the old system silently encodes.",
      },
    ],
    premortem:
      "A year out, failed: hidden rules surfaced mid-migration, you ran two systems at once, six months became eighteen, and someone pulled the plug half-done.",
    questions: [
      "If you'd never built the POC, would a full rewrite still be obvious today?",
      "What's your team's real estimate-vs-actual ratio — and why are you the exception?",
      "Could an incremental migration get ~80% of the gain at ~20% of the risk?",
    ],
    recalibration:
      "Not “never rewrite.” Incremental strangler-fig, worst module first, hard checkpoint, timeline built from your own track record. Treat the POC as a learning artifact, not a down payment.",
    confidenceLine:
      "original full rewrite ~25% · incremental path at recoverable risk: moderate–high",
  },
  {
    id: "quit",
    chip: "Quit my job",
    title: "Quit the stable job to go full-time on the startup",
    mode: "forward",
    input: {
      judgment:
        "I should quit my stable job and go full-time on my startup this quarter.",
      reasoning:
        "I've thought about it for two years. Friends love the idea. I keep reading about founders who quit and made it big, and I'll regret it forever if I don't try. I've got eight months of runway. I just know it'll take off.",
    },
    call: "Don’t quit cold. Get a real demand signal (paying users, not friends) and longer runway before torching the income.",
    confidence: "~15–20%",
    topBias: "survivorship",
    biases: [
      {
        name: "Survivorship",
        family: "too-much-information",
        evidence:
          "“founders who made it big” + “I keep reading about…” — you are reading the winners.",
      },
      {
        name: "WYSIATI",
        family: "not-enough-meaning",
        evidence:
          "“friends love it” — friends are not the market; that is not demand.",
      },
      {
        name: "Optimism",
        family: "need-to-act-fast",
        evidence:
          "“I just know it’ll take off” — certainty borrowed from wanting it.",
      },
      {
        name: "Planning fallacy",
        family: "need-to-act-fast",
        evidence:
          "“eight months of runway” — is that realistic time-to-traction, or the best case?",
      },
    ],
    premortem:
      "A year out: polite enthusiasm, no paying customers, the eight months went to building not selling, runway gone, and a worse job taken under pressure.",
    questions: [
      "What would a stranger — not a friend — pay for this today?",
      "What's the base rate of traction in 8 months, and why are you the exception?",
      "What is the cheapest experiment that proves you wrong in 6 weeks, not 8 months?",
    ],
    recalibration:
      "Not “never.” Quit when you have a demand signal you cannot get part-time, 12+ months runway, and a falsifiable milestone. Until then, run the cheapest disproof.",
    confidenceLine:
      "quit-now plan ~15–20% · de-risked path: meaningfully higher",
  },
  {
    id: "sell",
    chip: "Hold a stock down 40%",
    title: "Hold the stock that is down 40%",
    mode: "forward",
    input: {
      judgment:
        "I won't sell my shares even though they're down 40% — I'll hold till they're back to what I paid.",
      reasoning:
        "I bought at $100, it's $60. Selling locks in the loss. I've read up and there are reasons it'll bounce back. It was $100 once, so it can be again. I'd feel like an idiot selling at the bottom.",
    },
    call: "The price you paid is irrelevant. Decide on forward value only: would you buy it at $60 today on the merits?",
    confidence: "low",
    topBias: "anchoring",
    biases: [
      {
        name: "Anchoring",
        family: "too-much-information",
        evidence:
          "“back to what I paid” / “$100 once so it can again” — an arbitrary anchor.",
      },
      {
        name: "Loss aversion",
        family: "need-to-act-fast",
        evidence:
          "“locks in the loss” / “feel like an idiot” — dodging the feeling, not maximising return.",
      },
      {
        name: "Sunk cost",
        family: "need-to-act-fast",
        evidence:
          "holding for what you paid, not what the next dollar will earn.",
      },
      {
        name: "Confirmation",
        family: "too-much-information",
        evidence:
          "“reasons it’ll bounce back” — found after you decided to hold.",
      },
    ],
    premortem:
      "A year out: it drifted to $40, you rode it down waiting for break-even, and the capital that could have compounded elsewhere sat dead.",
    questions: [
      "If you had $60 in cash today, would you buy this stock right now?",
      "What does the price you paid have to do with its future value?",
      "Is there any price that would make you sell?",
    ],
    recalibration:
      "Ignore the $100 anchor. Hold only if you would buy at $60 today on the merits; otherwise sell and redeploy. It is about forward value and opportunity cost.",
    confidenceLine:
      "“hold to break-even” as reasoned: low · decide on forward value instead",
  },
];
