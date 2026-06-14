// The locked bias catalogue — single source of truth for the web field guide and the
// MCP engine. 22 biases, grouped by Buster Benson's four problems. Citations verified.
// See supporting-docs/bias-catalog.md for provenance.

export type Family =
  | "too-much-information"
  | "not-enough-meaning"
  | "need-to-act-fast"
  | "what-we-remember";

export interface Bias {
  id: string;
  name: string;
  family: Family;
  /** one-line plain-language summary */
  hook: string;
  /** 2–3 sentence definition */
  definition: string;
  /** one concrete, relatable instance */
  example: string;
  /** the debiasing move */
  counter: string;
  /** the adversarial question the engine presses (must be a question) */
  ask: string;
  /** verified citation */
  source: string;
  /** optional stable link (DOI / publisher / explainer) */
  sourceUrl?: string;
}

export interface FamilyMeta {
  label: string;
  blurb: string;
  /** spectrum colour from the design language */
  color: string;
}

export const FAMILIES = {
  "too-much-information": {
    label: "Too much information",
    blurb: "We filter aggressively, and filter wrong.",
    color: "#4AA6E0",
  },
  "not-enough-meaning": {
    label: "Not enough meaning",
    blurb: "We fill the gaps with tidy stories.",
    color: "#5BBF7A",
  },
  "need-to-act-fast": {
    label: "Need to act fast",
    blurb: "We favour speed, decisiveness, and commitment.",
    color: "#E2452C",
  },
  "what-we-remember": {
    label: "What we remember & how we judge what happened",
    blurb: "Memory edits itself — and we misread our own track record.",
    color: "#8A6FD0",
  },
} satisfies Record<Family, FamilyMeta>;

export const BIASES: Bias[] = [
  // ── Family 1 · Too much information ──────────────────────────────────────────
  {
    id: "anchoring",
    name: "Anchoring",
    family: "too-much-information",
    hook: "The first number or idea drags every later estimate toward it.",
    definition:
      "The mind latches onto an initial value as a reference point and adjusts away from it insufficiently — even when the anchor is arbitrary or irrelevant. It pulls your estimate whether or not you believe it.",
    example:
      "A jacket marked “$400, now $250” feels like a steal, even if it is only worth $150.",
    counter:
      "Form your own estimate before seeing any number; or test an opposite anchor and see where you land.",
    ask: "If you had never heard that first figure, what would you estimate from scratch?",
    source:
      "Tversky & Kahneman (1974), Judgment under Uncertainty: Heuristics and Biases, Science.",
  },
  {
    id: "availability",
    name: "Availability",
    family: "too-much-information",
    hook: "You judge likelihood by what springs to mind, not what is common.",
    definition:
      "We estimate how likely or frequent something is by how easily examples come to mind. Vivid, recent, or emotional events feel more probable than they are; common-but-dull risks feel rarer.",
    example:
      "After plane-crash headlines, flying feels dangerous — though the drive to the airport was the riskier leg.",
    counter:
      "Ask for base rates and real frequencies, not what you can recall.",
    ask: "Is this actually likely, or just recent and vivid?",
    source:
      "Tversky & Kahneman (1973), Availability: A Heuristic for Judging Frequency and Probability, Cognitive Psychology.",
  },
  {
    id: "confirmation",
    name: "Confirmation bias",
    family: "too-much-information",
    hook: "You notice evidence that fits and skim past the rest.",
    definition:
      "We seek, interpret, and remember information that confirms what we already believe, and discount what contradicts it. The search itself is lopsided, so the evidence we gather is too.",
    example:
      "Convinced a new hire is a star, you read their every move generously and explain away the misses.",
    counter:
      "Actively hunt disconfirming evidence — search for what would prove you wrong as hard as for what proves you right.",
    ask: "What evidence would change your mind — and have you gone looking for it?",
    source:
      "Nickerson (1998), Confirmation Bias: A Ubiquitous Phenomenon in Many Guises, Review of General Psychology.",
  },
  {
    id: "survivorship",
    name: "Survivorship bias",
    family: "too-much-information",
    hook: "You reason from what is visible and ignore what did not make it into view.",
    definition:
      "We draw conclusions from the cases that “survived” some selection, while the failures — silently filtered out — never enter the data. The graveyard is invisible, so the pattern looks stronger than it is.",
    example:
      "“Successful founders dropped out of college” ignores the far larger crowd of dropouts who failed and were never studied.",
    counter:
      "Ask where the missing cases are — who did not survive to be counted — and whether they would overturn the pattern.",
    ask: "Who or what is not in your data because they did not survive to be counted?",
    source:
      "Abraham Wald (1943; repr. 1980), A Method of Estimating Plane Vulnerability Based on Damage of Survivors, Statistical Research Group / Center for Naval Analyses.",
  },
  {
    id: "framing",
    name: "Framing effect",
    family: "too-much-information",
    hook: "The same fact as a gain vs. a loss flips your choice.",
    definition:
      "Our choices change with how options are described — gains vs. losses, 90% survival vs. 10% mortality — even when the underlying facts are identical. Presentation, not substance, moves the decision.",
    example: "“90% fat-free” sells; “10% fat” does not — same yogurt.",
    counter:
      "Restate the option the opposite way (gain ↔ loss) and check whether your preference survives the rewording.",
    ask: "Does this still hold if you restate it the opposite way?",
    source:
      "Tversky & Kahneman (1981), The Framing of Decisions and the Psychology of Choice, Science.",
  },

  // ── Family 2 · Not enough meaning ────────────────────────────────────────────
  {
    id: "representativeness",
    name: "Representativeness / base-rate neglect",
    family: "not-enough-meaning",
    hook: "A good narrative beats the actual odds.",
    definition:
      "We judge probability by how closely something matches a mental stereotype, ignoring how common it actually is (the base rate). A vivid match feels like evidence, but it is not.",
    example:
      "Told someone is “quiet and loves books,” people guess “librarian” over “salesperson” — though salespeople vastly outnumber librarians.",
    counter:
      "Start from the base rate of the reference class, then adjust for specifics — not the other way around.",
    ask: "What is the base rate for cases like this, regardless of how compelling this one feels?",
    source:
      "Kahneman & Tversky (1973), On the Psychology of Prediction, Psychological Review.",
  },
  {
    id: "wysiati",
    name: "WYSIATI (what you see is all there is)",
    family: "not-enough-meaning",
    hook: "Confident conclusions from the little you happen to know.",
    definition:
      "The mind builds a coherent story from the information at hand and treats it as the whole picture, ignoring what is unknown or missing. Confidence comes from the story’s coherence, not its completeness.",
    example:
      "A glowing one-page résumé makes the candidate feel like a sure thing — it is one page about a whole career.",
    counter:
      "Ask what you would need to know to be wrong, and what is conspicuously absent from the information you have.",
    ask: "What is missing that, if you had it, could flip this?",
    source: "Kahneman (2011), Thinking, Fast and Slow.",
  },
  {
    id: "halo",
    name: "Halo effect",
    family: "not-enough-meaning",
    hook: "One impressive trait colours the whole judgment.",
    definition:
      "A single positive (or negative) quality — charisma, attractiveness, a prestigious logo — spills over into our rating of unrelated qualities. We infer competence from confidence.",
    example:
      "A polished speaker is assumed to be a deep thinker; we mistake fluency for substance.",
    counter:
      "Rate each quality separately, on its own evidence; ask which judgments are riding on one standout trait.",
    ask: "Are you rating the whole thing highly because of one standout feature?",
    source:
      "Thorndike (1920), A Constant Error in Psychological Ratings, Journal of Applied Psychology.",
  },
  {
    id: "narrative",
    name: "Narrative fallacy",
    family: "not-enough-meaning",
    hook: "You impose cause-and-effect on what is really noise.",
    definition:
      "We turn sequences of events into tidy cause-and-effect stories because stories are easier to hold than randomness. The coherence of the tale gets mistaken for evidence it is true.",
    example:
      "After a stock jumps, pundits supply a confident reason — the same move would have been “explained” just as fluently had it dropped.",
    counter:
      "Ask whether there is a real mechanism or just a satisfying story; notice how easily the opposite outcome could have been narrated.",
    ask: "Is this a real mechanism, or a story drawn around randomness?",
    source: "Taleb (2007), The Black Swan.",
  },
  {
    id: "authority",
    name: "Authority bias",
    family: "not-enough-meaning",
    hook: "You defer to the expert or senior voice as a shortcut.",
    definition:
      "We give outsized weight to authority figures — titles, seniority, credentials — independent of the actual argument. The messenger’s status substitutes for scrutiny of the message.",
    example:
      "A team adopts a flawed plan because the most senior person proposed it, and no one pressure-tests it.",
    counter:
      "Judge the argument on its merits; ask whether it would survive if a junior or anonymous person had made it.",
    ask: "Would this argument survive if a junior person made it?",
    source:
      "Milgram (1963), Behavioral Study of Obedience, Journal of Abnormal and Social Psychology (see also Cialdini, Influence, 1984).",
  },
  {
    id: "social-proof",
    name: "Bandwagon / social proof",
    family: "not-enough-meaning",
    hook: "The crowd’s choice stands in for the right choice.",
    definition:
      "We treat “many others are doing it” as evidence it is correct, especially under uncertainty. The more people seem to agree, the more we assume they cannot all be wrong — though they often are, for the same reason.",
    example:
      "A packed restaurant draws a longer queue; everyone is in line partly because everyone else is.",
    counter:
      "Separate popularity from validity; ask whether you would choose this if no one else were.",
    ask: "Are you doing this because it is right, or because everyone else is?",
    source:
      "Cialdini (1984), Influence: How and Why People Agree to Things (see also Asch, 1951).",
  },

  // ── Family 3 · Need to act fast ──────────────────────────────────────────────
  {
    id: "overconfidence",
    name: "Overconfidence",
    family: "need-to-act-fast",
    hook: "Certainty tracks how coherent the story feels, not the evidence.",
    definition:
      "We systematically overestimate the accuracy of our judgments and the precision of our knowledge. Felt confidence is calibrated to how good the story sounds, not to how likely we are to be right.",
    example:
      "People who say they are “99% sure” are wrong far more than 1% of the time.",
    counter:
      "State a confidence number and a range you would bet on; ask the base rate of being wrong for calls like this.",
    ask: "Honestly, what is the chance you are wrong — and would you bet on it?",
    source:
      "Moore & Healy (2008), The Trouble with Overconfidence, Psychological Review.",
  },
  {
    id: "loss-aversion",
    name: "Loss aversion",
    family: "need-to-act-fast",
    hook: "A loss hurts about twice as much as the equal gain feels good.",
    definition:
      "Losses loom larger than equivalent gains — roughly twice as painful — so we take irrational risks to avoid losses and pass up good bets that carry any possible loss. The asymmetry warps every risk decision.",
    example:
      "People refuse a coin-flip to win $150 or lose $100, though the bet is clearly favourable.",
    counter:
      "Reframe in terms of final outcomes and expected value, not gains vs. losses from today’s reference point.",
    ask: "Are you avoiding this mainly to dodge a loss, not to capture a better outcome?",
    source:
      "Kahneman & Tversky (1979), Prospect Theory: An Analysis of Decision under Risk, Econometrica.",
  },
  {
    id: "sunk-cost",
    name: "Sunk cost",
    family: "need-to-act-fast",
    hook: "You keep investing because of what is already spent.",
    definition:
      "We continue a course of action to justify past, unrecoverable investments — money, time, effort — instead of weighing only future costs and benefits. The more we have poured in, the harder it is to stop.",
    example:
      "Sitting through a bad film because you paid for the ticket. The money is gone either way.",
    counter:
      "Ignore what is spent. Ask only “what is the best use of the next dollar or hour from here?” — as if arriving fresh.",
    ask: "Starting fresh today with nothing invested, would you still choose this?",
    source:
      "Arkes & Blumer (1985), The Psychology of Sunk Cost, Organizational Behavior and Human Decision Processes.",
  },
  {
    id: "planning-fallacy",
    name: "Planning fallacy",
    family: "need-to-act-fast",
    hook: "You price the best case and call it the plan.",
    definition:
      "We predict our own projects will run as smoothly as the best case, underestimating time, cost, and risk — even knowing similar projects usually overran. Optimism about the specific case overrides the track record.",
    example:
      "Renovations and software launches routinely take about twice the estimate; the next one is always “different.”",
    counter:
      "Build the estimate from the actual outcomes of similar past projects (the reference class), not an imagined smooth run.",
    ask: "What did similar efforts actually take — not what you hope this one will?",
    source:
      "Buehler, Griffin & Ross (1994); term coined by Kahneman & Tversky (1979).",
  },
  {
    id: "status-quo",
    name: "Status quo / default bias",
    family: "need-to-act-fast",
    hook: "The current state wins by inertia.",
    definition:
      "We prefer things to stay as they are, treating the current state or default as a baseline and any change as a risk. Inaction feels safer than action, even when change is the better bet.",
    example:
      "People rarely switch the default insurance or retirement-plan option, whatever it is — the default quietly decides for them.",
    counter:
      "Compare every option (including the status quo) as if choosing fresh today; ask whether you are picking it or just defaulting to it.",
    ask: "Are you choosing this because it is best, or because it is the default?",
    source:
      "Samuelson & Zeckhauser (1988), Status Quo Bias in Decision Making, Journal of Risk and Uncertainty.",
  },
  {
    id: "optimism",
    name: "Optimism bias",
    family: "need-to-act-fast",
    hook: "You assume good outcomes apply specially to you.",
    definition:
      "We expect our own future to be sunnier than the odds warrant — overestimating good outcomes and underestimating risks, for ourselves more than for others. Hope quietly rewrites the probabilities.",
    example:
      "Most people think they are less likely than average to get divorced, get sick, or crash a car.",
    counter:
      "Price the realistic downside explicitly; ask what the outcome distribution looks like for people in your situation.",
    ask: "What is the realistic downside, and have you actually priced it in?",
    source:
      "Weinstein (1980), Unrealistic Optimism About Future Life Events, Journal of Personality and Social Psychology.",
  },

  // ── Family 4 · What we remember & how we judge what happened ──────────────────
  {
    id: "hindsight",
    name: "Hindsight bias",
    family: "what-we-remember",
    hook: "“I knew it all along” quietly corrupts the lesson.",
    definition:
      "Once we know how something turned out, we believe we predicted it — or could have. The outcome reshapes our memory of what we thought beforehand, making events seem more foreseeable than they were.",
    example:
      "After a crash, everyone “saw it coming” — though almost no one acted on it at the time.",
    counter:
      "Recover what you actually predicted beforehand (write predictions down); ask whether the signs were truly obvious before the result was known.",
    ask: "Before the outcome, did you truly predict it — or does it just feel obvious now?",
    source:
      "Fischhoff (1975), Hindsight ≠ Foresight, Journal of Experimental Psychology: Human Perception and Performance.",
  },
  {
    id: "outcome",
    name: "Outcome bias",
    family: "what-we-remember",
    hook: "You judge the decision by how it turned out, not by whether it was sound.",
    definition:
      "We rate the quality of a decision by its result rather than the reasoning available at the time. Because luck shapes outcomes, good decisions sometimes fail and bad ones succeed — so judging by result alone trains the wrong lessons.",
    example:
      "A surgeon makes the textbook-correct call; a rare complication kills the patient and it is branded a blunder.",
    counter:
      "Separate decision-quality from outcome-quality. Ask “given only what was known then, was this reasonable?”",
    ask: "Bad decision, or a reasonable call with a bad outcome — would you make it again knowing only what you knew then?",
    source:
      "Baron & Hershey (1988), Outcome Bias in Decision Evaluation, Journal of Personality and Social Psychology.",
  },
  {
    id: "self-serving",
    name: "Self-serving / attribution bias",
    family: "what-we-remember",
    hook: "You credit good outcomes to skill and blame bad ones on luck or others.",
    definition:
      "We attribute successes to our own ability and effort, and failures to bad luck, circumstances, or other people. The asymmetry protects self-image but corrupts the lessons we draw.",
    example:
      "“I aced it because I am sharp; I bombed it because the questions were unfair.”",
    counter:
      "Attribute symmetrically — apply the same standard to wins and losses; ask how you would assign cause if the result had flipped.",
    ask: "If this had gone the other way, would you be assigning the cause the same way?",
    source:
      "Miller & Ross (1975), Self-Serving Biases in the Attribution of Causality: Fact or Fiction?, Psychological Bulletin.",
  },
  {
    id: "recency",
    name: "Recency bias",
    family: "what-we-remember",
    hook: "The latest events dominate a longer pattern.",
    definition:
      "We give disproportionate weight to the most recent information, letting it overshadow a longer track record. What just happened feels like the trend.",
    example:
      "One great (or terrible) recent quarter reshapes a strategy built on years of contrary data.",
    counter:
      "Zoom out to the full history; ask whether recent events are a real shift or just the latest data point.",
    ask: "Are recent events drowning out the longer track record?",
    source:
      "Murdock (1962), The Serial Position Effect of Free Recall, Journal of Experimental Psychology.",
  },
  {
    id: "peak-end",
    name: "Peak–end rule",
    family: "what-we-remember",
    hook: "You judge the whole by its peak and its ending.",
    definition:
      "We remember and evaluate an experience largely by its most intense moment and how it ended — not by the sum or average of the whole. Duration barely registers.",
    example:
      "A two-week trip that ended on a sour final day is remembered as worse than a shorter one that ended well.",
    counter:
      "Reconstruct the whole experience, not just its peak and finish; ask whether one moment or the ending is standing in for the entirety.",
    ask: "Are you judging the whole option by one high point or how it ended?",
    source:
      "Kahneman, Fredrickson, Schreiber & Redelmeier (1993); Redelmeier & Kahneman (1996).",
  },
];
