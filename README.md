# Irrational

**A field guide to the mistakes your mind makes — and an open, adversarial behavioural-bias engine you can call from your own AI or any MCP agent.**

→ **[irrational.pages.dev](https://irrational.pages.dev)**

Irrational **runs no AI model.** It provides the curated adversarial framework, a 22-bias catalogue, and a stateless scaffold — delivered as a public field guide and an open MCP tool — and the reasoning is done by whatever model you or your agent already have. **No API keys. No stored decisions. Nothing leaves you.**

A frontier model already knows the biases, so the value isn't informational — it's behavioural: a plain LLM is trained to agree, while Irrational has a fixed adversarial contract (_assume you're biased, refuse to validate, argue the other side_) that an agent can invoke systematically — even on its own draft reasoning.

## What's inside

- **Field guide** — 22 cognitive biases grouped by Buster Benson's four problems the brain solves, each with the question that breaks its spell and a **verified citation**.
- **The engine** — an MCP server exposing `analyze_decision`, `list_biases`, `get_bias`. `analyze_decision` returns a verdict-first _directive_ your model executes. The discipline is ours; the reasoning is yours.
- **The web forge** — type a decision; it assembles the adversarial prompt in your browser and hands off to _your_ AI. No model runs here.

## Stack

Astro (static) · Cloudflare Pages · a hand-rolled, dependency-free JSON-RPC MCP endpoint. No runtime model, no database. Single source of truth: [`src/data/biases.ts`](src/data/biases.ts) feeds both the web and the MCP.

## Develop

```bash
npm install --ignore-scripts   # we don't use image optimization, so skip sharp's native build
npm run dev                    # http://localhost:4321
npm test                       # vitest — engine + catalogue (22 tests)
npm run build                  # static pages + the MCP worker
```

## Connect the engine (MCP)

```bash
claude mcp add --transport http irrational https://irrational.pages.dev/mcp/server
```

…or point any MCP client at `https://irrational.pages.dev/mcp/server`.

## Licence

MIT (code). Bias-catalogue text CC-BY. Every claim is cited — see [/sources](https://irrational.pages.dev/sources).
