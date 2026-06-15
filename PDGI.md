# How Irrational follows PDGI

[Irrational](https://irrational.pages.dev) is built on the principles of [People's Digital Goods and Infrastructure (PDGI)](https://pdgi.org/blog/peoples-digital-goods-and-infrastructure/): people before digital, rights-centric, commons-oriented, transparent.

This is a public scorecard of how those principles are actually implemented, with links to the evidence and notes on where we fall short.

Status key: ✅ implemented · 🟡 partial · ⛳ gap, with intended direction.

## Scorecard

### People before digital (agency over automation) — ✅

Irrational exists to protect a person's own judgment, not to replace it. It makes no decision for you and runs no model of its own — it hands you sharper questions and the reasoning stays with you or your agent. By design it is the opposite of a sycophantic assistant: it assumes you are biased, refuses to validate, and argues the other side.
Evidence: [/about](https://irrational.pages.dev/about), the adversarial contract in [`src/engine/scaffold.ts`](src/engine/scaffold.ts).

### Transparency and accountability — ✅

Open source (MIT), open repository, and the engine's adversarial scaffold is fully inspectable — anti-black-box is the whole pitch. Every one of the 22 biases is cited to its primary source, web-verified against the original journals and publishers. The build, tests and deploy are a public, version-controlled record.
Evidence: this repository, [`src/data/biases.ts`](src/data/biases.ts), [/sources](https://irrational.pages.dev/sources), [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

### Decentralisation and no lock-in — ✅

No account, no signup, no API keys. The reasoning is bring-your-own-model: the engine returns an adversarial directive that _your_ AI executes — we never run inference. The MCP endpoint is an open protocol any agent can call, the site is static and self-hostable, and the bias catalogue is open data. Nothing is trapped in the platform.
Evidence: [/mcp](https://irrational.pages.dev/mcp), [`src/mcp/handler.ts`](src/mcp/handler.ts), [`src/pages/mcp/server.ts`](src/pages/mcp/server.ts), the [MIT licence](./LICENSE).

### Free software and the digital commons — ✅

MIT code. The 22-bias catalogue — definitions, examples, debiasing moves and verified citations — is a reusable commons under CC-BY, grounded in the public scientific canon (Kahneman, Tversky, Thaler, Ariely, Cialdini).
Evidence: [LICENSE](./LICENSE), [`src/data/biases.ts`](src/data/biases.ts), [/sources](https://irrational.pages.dev/sources).

### Privacy — ✅

We run no AI model and keep no data. The worked-example audits are hand-written and rendered statically; your own decision is assembled into a prompt in your browser and handed to your AI, never to us; the MCP returns a stateless scaffold and logs no input. No account, no email, no keys. Analytics are Cloudflare Web Analytics only — cookie-free, no personal data, aggregate page counts.
Evidence: [/privacy](https://irrational.pages.dev/privacy) ("we run no AI and keep no data").

### Humans in the loop (AI does not cut people out) — ✅

This is the entire reason Irrational exists. Where a plain LLM passively confirms and reinforces your framing, Irrational forces deliberation over deference — a check that keeps the human's judgment central, even inside agent pipelines (a second agent can red-team the first). It runs no model; people and their tools do the reasoning, we supply the discipline.
Evidence: [/about](https://irrational.pages.dev/about), the contract and procedure in [`src/engine/scaffold.ts`](src/engine/scaffold.ts).

### Platform cooperativism — 🟡

Irrational is a tool and a curated commons, not a contribution platform: the catalogue is editorially curated rather than community-submitted, so there is no anonymous-publish path like bharatlas's. It is fully open to forks and pull requests, though.
Direction: invite community contributions through the repo — proposed biases, worked examples, and especially translations — with the same "cite the source, mark the gaps" discipline as the curated set.

### A non-digital alternative must exist — ✅

The whole method works on paper. A printable one-page audit — the System 1 / 2 read, the 22 biases as checkboxes, the outside view, the premortem and the recalibration — lets anyone run the same adversarial check with nothing but a pen, no app, AI or account. The field guide and sources also read without JavaScript (the [/biases](https://irrational.pages.dev/biases) cards use native HTML `<details>`); only the live demo and the forge need it.
Evidence: [/checklist](https://irrational.pages.dev/checklist) (print / save-as-PDF), the no-JS field guide.
Direction: add a downloadable copy of the full catalogue as files for fully-offline reference.

### Grassroots and reaching the divide-affected — 🟡

The audit now answers in the user's language. The bring-your-own-model design makes this nearly free: the scaffold instructs the user's AI to write the whole audit in any language while keeping bias ids canonical, so the result is still parseable. The web forge offers the 12 major scheduled Indian languages (auto-detecting the browser's) plus others, and the MCP `analyze_decision` tool takes a `language` parameter — no translation files, every language works on day one.
Evidence: the language control on [the home forge](https://irrational.pages.dev/), the `language` param on [/mcp](https://irrational.pages.dev/mcp), `languageLine()` in [`src/engine/scaffold.ts`](src/engine/scaffold.ts).
Direction: still English-first for the catalogue UI itself; the next step is community-contributed translations of the field guide and the printable checklist (which also advances platform cooperativism).

### Algorithmic fairness — mostly not applicable

Irrational runs no algorithm that makes decisions about people — it is a framework and a catalogue, and the one AI touch (the scaffold) executes on the user's own model. If anything its intent is pro-fairness: it helps people notice the biases distorting their own judgments.

## Fork this

Want to show your project follows PDGI? Map each principle to the concrete thing you do, link the evidence, and mark the gaps honestly. Copy this file as a template and keep it in your repo, where its git history becomes the record of your work.

Built by [Urban Morph](https://urbanmorph.com). PDGI framework: [pdgi.org](https://pdgi.org/).
