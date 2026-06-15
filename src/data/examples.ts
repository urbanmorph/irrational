// Pre-generated worked audits — rendered statically (no model at runtime). Powers the
// home scenario-swap. Source: supporting-docs/worked-examples.md. The composed format:
// system read · biases (with evidence) · outside view · premortem · questions · recalibration.

import type { Family } from './biases';

export interface ExampleBias {
  name: string;
  family: Family;
  evidence: string;
}

export interface WorkedExample {
  id: string;
  chip: string;
  title: string;
  mode: 'forward' | 'retrospective';
  input: { judgment: string; reasoning: string };
  call: string;
  confidence: string;
  topBias: string;
  system: string;
  biases: ExampleBias[];
  outsideView: string;
  premortem: string;
  questions: string[];
  recalibration: string;
  confidenceLine: string;
}

export const EXAMPLES: WorkedExample[] = [
  {
    id: 'rewrite',
    chip: 'Rewrite the legacy system',
    title: 'Rewrite the 6-year-old backend from scratch',
    mode: 'forward',
    input: {
      judgment: 'We should rewrite our 6-year-old backend from scratch this year.',
      reasoning:
        "The codebase is a mess and the team hates it. We've spent two months on a proof-of-concept that went well, so I'm confident we can finish in six months. Stripe and others did big rewrites and won. The old thing is beyond saving.",
    },
    call: "Don't greenlight the big-bang rewrite. Carve off the worst module first (strangler-fig), behind the current interface, with a hard 3-month checkpoint.",
    confidence: '~25%',
    topBias: 'sunk cost',
    system:
      'This is a System 1 call wearing a suit — fluent, certain, and missing every number that matters. Watch what is actually steering it.',
    biases: [
      {
        name: 'Sunk cost',
        family: 'need-to-act-fast',
        evidence:
          'the “two months on a POC” are gone either way — but they are doing most of the talking. You are reasoning from what you have spent, not from what the next month returns.',
      },
      {
        name: 'Planning fallacy',
        family: 'need-to-act-fast',
        evidence:
          '“about six months” is a best-case, single-point guess with no reference class — and the POC tested the fun 20%, not the six years of edge-cases that are the other 80%.',
      },
      {
        name: 'Survivorship',
        family: 'too-much-information',
        evidence:
          '“Stripe and others did it and won” quotes the visible survivors and steps over the graveyard of rewrites that quietly overran or were abandoned.',
      },
      {
        name: 'WYSIATI',
        family: 'not-enough-meaning',
        evidence:
          '“the old thing is beyond saving” is a confident verdict built on what is annoying today — it ignores the undocumented business logic the old system silently encodes.',
      },
    ],
    outsideView:
      'Big-bang rewrites of mature, in-production systems routinely run 2–3× the estimate, and a sobering share never fully replace the original. Against that base rate, “six months” is the floor, not the plan — anchor your timeline on your team’s own estimate-vs-actual history instead.',
    premortem:
      'Picture it a year out, failed: hidden rules surfaced mid-migration, you ended up running both systems at once, velocity dropped instead of rising, “six months” became eighteen, and leadership pulled the plug half-done — leaving two unfinished systems.',
    questions: [
      "If you'd never built the POC, would a full rewrite still be the obvious move today?",
      "What's your team's real estimate-vs-actual ratio on big projects — and why are you the exception this time?",
      'What logic lives only in the old code that nobody fully understands, and what happens to it on cutover day?',
      'Could an incremental strangler-fig capture ~80% of the velocity gain at ~20% of the risk?',
    ],
    recalibration:
      'Not “never rewrite.” The version that survives scrutiny: an incremental strangler-fig — carve off the worst module first, behind the existing interface, with a hard 3-month checkpoint and a timeline built from your own track record. Treat the POC as a learning artifact, not a down payment.',
    confidenceLine: 'original full rewrite ~25% · incremental path at recoverable risk: moderate–high',
  },
  {
    id: 'quit',
    chip: 'Quit my job',
    title: 'Quit the stable job to go full-time on the startup',
    mode: 'forward',
    input: {
      judgment: 'I should quit my stable job and go full-time on my startup this quarter.',
      reasoning:
        "I've thought about it for two years. Friends love the idea. I keep reading about founders who quit and made it big, and I'll regret it forever if I don't try. I've got eight months of runway. I just know it'll take off.",
    },
    call: 'Don’t quit cold. Get a real demand signal — paying users, not friends — and longer runway before you torch the income.',
    confidence: '~15–20%',
    topBias: 'survivorship',
    system:
      'A wish narrating itself as a plan — two years of wanting, dressed up as readiness. The certainty is doing the work that evidence should.',
    biases: [
      {
        name: 'Survivorship',
        family: 'too-much-information',
        evidence:
          '“founders who quit and made it big” + “I keep reading about…” — you are reading the winners. The far larger crowd who quit and quietly failed never wrote the posts you are learning from.',
      },
      {
        name: 'WYSIATI',
        family: 'not-enough-meaning',
        evidence:
          '“friends love the idea” — friends are not the market and enthusiasm is not a purchase. That is politeness, not demand.',
      },
      {
        name: 'Optimism',
        family: 'need-to-act-fast',
        evidence:
          '“I just know it’ll take off” — that is certainty borrowed from how badly you want it, not from any signal the market has actually given you.',
      },
      {
        name: 'Planning fallacy',
        family: 'need-to-act-fast',
        evidence:
          '“eight months of runway” quietly becomes the timeline — but is eight months realistic time-to-traction, or just the best case before the money runs out?',
      },
    ],
    outsideView:
      'Most startups don’t reach real traction in eight months, and the base rate for “quit cold, full attention → it takes off” is sobering. Many of the founders you admire also kept de-risking — a co-founder, savings, a side-project first — rather than leaping blind.',
    premortem:
      'Picture it a year out, failed: the idea got warm encouragement but no paying customers, the eight months drained into building instead of selling, the runway ran out before product-market fit, and you took a worse job under pressure.',
    questions: [
      'What would a stranger — not a friend — actually pay for this today? Have you charged anyone?',
      "What's the base rate of your kind of startup hitting traction in eight months, and why are you the exception?",
      'What is the cheapest experiment that could prove you wrong in six weeks instead of eight months?',
      'Could you get the same signal nights-and-weekends, or with a co-founder, before quitting?',
    ],
    recalibration:
      'Not “never.” Quit when you have a demand signal you genuinely can’t get part-time — paying users, a converting waitlist — plus 12+ months of runway and a falsifiable milestone. Until then, run the cheapest disproof you can design.',
    confidenceLine: 'quit-now plan ~15–20% · de-risked path: meaningfully higher',
  },
  {
    id: 'sell',
    chip: 'Hold a stock down 40%',
    title: 'Hold the stock that is down 40%',
    mode: 'forward',
    input: {
      judgment: "I won't sell my shares even though they're down 40% — I'll hold till they're back to what I paid.",
      reasoning:
        "I bought at $100, it's $60. Selling locks in the loss. I've read up and there are reasons it'll bounce back. It was $100 once, so it can be again. I'd feel like an idiot selling at the bottom.",
    },
    call: 'The price you paid is irrelevant. Decide on forward value only: with fresh cash, would you buy this at $60 today on the merits?',
    confidence: 'low',
    topBias: 'anchoring',
    system: 'Every reason here points backward — at the price you paid — not forward, at what the share is worth now.',
    biases: [
      {
        name: 'Anchoring',
        family: 'too-much-information',
        evidence:
          '“back to what I paid” and “it was $100 once, so it can be again” — the purchase price is an arbitrary anchor the stock has no memory of.',
      },
      {
        name: 'Loss aversion',
        family: 'need-to-act-fast',
        evidence:
          '“selling locks in the loss” / “I’d feel like an idiot selling at the bottom” — the pain of realising the loss is steering this, not the forward expected return.',
      },
      {
        name: 'Sunk cost',
        family: 'need-to-act-fast',
        evidence:
          'you are holding because of the $100 already paid, not because of what the next dollar in this position is likely to earn.',
      },
      {
        name: 'Confirmation',
        family: 'too-much-information',
        evidence:
          '“I’ve read up and there are reasons it’ll bounce back” — those reasons were gathered after you had already decided to hold.',
      },
    ],
    outsideView:
      'A share price has no memory of what you paid; “it was $100 once” tells you nothing about whether $60 is cheap today. The only forward-looking question is the base-rate one — with fresh cash, would you buy this at $60 right now?',
    premortem:
      'Picture it a year out: it drifted to $40, you rode it all the way down “waiting for break-even,” and the capital that could have compounded elsewhere sat dead — anchored to a number only you still care about.',
    questions: [
      'If you had $60 in cash today, would you buy this stock right now? (If not — why are you holding it?)',
      'What does the price you paid have to do with its future value?',
      'Are your “reasons it’ll bounce back” things you found before deciding to hold, or after?',
      'Is there any price at which you would sell — or is the answer always “wait for break-even”?',
    ],
    recalibration:
      'Ignore the $100 anchor entirely. Hold only if you’d actively buy at $60 today on the merits; otherwise sell and redeploy. The decision is about forward value and opportunity cost, not getting made whole.',
    confidenceLine: '“hold to break-even” as reasoned: low · decide on forward value instead',
  },
];
