# Contributing to Irrational

Irrational is a curated commons, and it's open. The most valuable contributions right now
are **translations** — they're how the field guide reaches people the English-first UI
doesn't.

Whatever you contribute, keep the project's discipline: **cite the source, mark the gaps,
don't overstate confidence.**

## Translate the field guide or the printable checklist

The audit already _answers_ in any language (the engine instructs the user's own model — see
the "Reply in" picker and the MCP `language` param). What isn't translated yet is the
**catalogue UI itself** and the **printable checklist** (`/checklist`). That's the open
invitation.

To contribute a translation:

1. The bias catalogue lives in [`src/data/biases.ts`](src/data/biases.ts) — `hook`,
   `definition`, `example`, `counter`, and `ask` are the translatable prose.
2. **Keep the bias `id` and `family` keys exactly as they are** (canonical English) — they're
   how the web and the MCP stay parseable across languages. Translate only the prose.
3. You are the native review. Translate the bias _terminology_ faithfully; where a term has
   no clean equivalent, keep the English term and gloss it rather than inventing one.
4. For the checklist, copy [`src/pages/checklist.astro`](src/pages/checklist.astro) to a
   locale variant (e.g. `checklist.hi.astro`) and translate the visible strings.
5. Open a PR. Name the language and confirm you're a fluent/native speaker of it.

## Propose a bias or a worked example

The catalogue is deliberately tight (22 biases) for **precision, not coverage**. A new bias
earns a slot only if it passes all four:

1. it distorts **deliberate decisions** (not just perception or memory),
2. it's **distinct** — not a relabel of one already in the set,
3. it has a **sharp, specific adversarial question** the engine can press, and
4. it covers a **failure mode nothing else covers**.

Every entry needs a **verified primary citation** (author, year, title, venue) — not a
paraphrase from memory. Worked examples (`src/data/examples.ts`) should fire only biases that
are in the set.

## Develop

```bash
npm install --ignore-scripts   # skip sharp's native build; we don't use image optimization
npm test                       # vitest — engine + catalogue
npm run dev                    # http://localhost:4321
npm run build                  # static pages + the MCP worker
```

PRs run the test + build + type-check gate in CI before they can merge.

Built by [Urban Morph](https://urbanmorph.com).
