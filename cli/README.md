# irrational

Audit a decision for cognitive biases with your own AI. A command line and a local MCP server in one
package. It runs no model and makes no network calls: your decision goes only to the model you choose.

The same engine as [irrational.pages.dev](https://irrational.pages.dev): an adversarial contract, a
22-bias catalogue with a citation for every claim, and a fixed procedure (spot the system, name the
biases with your own words as evidence, the outside view, a premortem, hard questions, a recalibration).

## The command line

```sh
npx irrational audit "Rewrite the backend this year" --why "the POC went well; six months" | claude -p
npx irrational audit - < plan.md              # audit a document; its first line is the decision
npx irrational audit --file plan.md --retro   # a past decision: the outcome-flip test
npx irrational audit "..." --why "..." --language Hindi --structured   # JSON to the output schema
npx irrational audit "..." --why "..." --directive   # the MCP directive, for agents
npx irrational biases --family need-to-act-fast
npx irrational bias sunk-cost --format md
npx irrational checklist                      # the pen-and-paper audit
```

The output is a prompt: pipe it into `claude -p`, `llm`, `ollama run`, or paste it into any chat.
Without `--why` it asks for your reasoning and exits 2, because an audit of a conclusion alone is the
failure it exists to prevent. `--json` for scripts, `--format md` for markdown, `-o file` to write a file.
Exit codes: 0 ok, 1 failure, 2 bad usage.

## The MCP server

With no arguments (started by an MCP client) or `serve`, it is a stdio MCP server with the same three
tools as the hosted one: `analyze_decision`, `list_biases`, `get_bias`.

```sh
claude mcp add irrational -- npx -y irrational
```

```json
{
  "mcpServers": {
    "irrational": { "command": "npx", "args": ["-y", "irrational"] }
  }
}
```

## Licence

Code MIT. The bias-catalogue text is also available under CC BY 4.0; every claim is cited at
[irrational.pages.dev/sources](https://irrational.pages.dev/sources).
