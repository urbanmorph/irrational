import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { run, type Io } from "./run";
import { handleLine } from "./stdio";
import { BIASES } from "../data/biases";
import { CHECKLIST } from "../data/checklist";
import { buildAuditDirective, forgePrompt } from "../engine/scaffold";

const json = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const pkg = json("../../cli/package.json");

function io(over: Partial<Io> = {}): Io & { written: Record<string, string> } {
  const written: Record<string, string> = {};
  return {
    isTTY: true,
    readStdin: async () => "",
    readFile: async (p) => {
      throw new Error(`no such file: ${p}`);
    },
    writeFile: async (p, s) => {
      written[p] = s;
    },
    ...over,
    written,
  };
}

const go = (args: string[], over: Partial<Io> = {}) => run(args, io(over));

describe("irrational audit", () => {
  it("prints the pasteable forge prompt for a judgment and its reasoning", async () => {
    const r = await go([
      "audit",
      "Rewrite the backend",
      "--why",
      "the POC went well",
    ]);
    expect(r.code).toBe(0);
    expect(r.stdout).toBe(
      forgePrompt({
        judgment: "Rewrite the backend",
        reasoning: "the POC went well",
      }) + "\n",
    );
    expect(r.stderr).toBe("");
  });

  it("asks for the reasoning and exits 2 when --why is missing", async () => {
    const r = await go(["audit", "Quit my job"]);
    expect(r.code).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("walk me through your reasoning");
  });

  it("gives the needs_reasoning object on stdout with --json, still exiting 2", async () => {
    const r = await go(["audit", "Quit my job", "--json"]);
    expect(r.code).toBe(2);
    expect(JSON.parse(r.stdout).status).toBe("needs_reasoning");
  });

  it("audits a document from stdin: first line is the judgment, the whole text the reasoning", async () => {
    const doc =
      "# Move to Postgres\n\nWe chose it because the team knows it.\n";
    const r = await go(["audit", "-"], { readStdin: async () => doc });
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("Judgment: Move to Postgres");
    expect(r.stdout).toContain("the team knows it");
  });

  it("audits a document from a file with --file", async () => {
    const r = await go(["audit", "--file", "plan.md"], {
      readFile: async () => "Hire two more engineers\nBecause we are behind.",
    });
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("Judgment: Hire two more engineers");
  });

  it("reads the reasoning from stdin with --why -", async () => {
    const r = await go(["audit", "Ship Friday", "--why", "-"], {
      readStdin: async () => "QA said it looks fine",
    });
    expect(r.stdout).toContain("How I arrived at it: QA said it looks fine");
  });

  it("switches to the outcome-flip test with --retro", async () => {
    const r = await go([
      "audit",
      "We shipped",
      "--why",
      "it worked",
      "--retro",
    ]);
    expect(r.stdout).toContain("Outcome-flip test");
  });

  it("names a language given as a code", async () => {
    const r = await go(["audit", "x", "--why", "y", "--language", "hi"]);
    expect(r.stdout).toContain("Respond entirely in Hindi");
  });

  it("asks the model for the JSON schema with --structured", async () => {
    const r = await go(["audit", "x", "--why", "y", "--structured"]);
    expect(r.stdout).toContain("Output ONLY a JSON object");
    expect(r.stdout).toContain("top_bias");
  });

  it("returns the MCP directive with --directive, the same object the MCP tool returns", async () => {
    const r = await go(["audit", "x", "--why", "y", "--directive"]);
    expect(JSON.parse(r.stdout)).toEqual(
      buildAuditDirective({ judgment: "x", reasoning: "y", structured: false }),
    );
  });

  it("wraps the prompt in JSON with --json", async () => {
    const r = await go(["audit", "x", "--why", "y", "--json"]);
    const out = JSON.parse(r.stdout);
    expect(out.status).toBe("audit");
    expect(out.prompt).toBe(forgePrompt({ judgment: "x", reasoning: "y" }));
  });

  it("writes to a file with -o and prints nothing", async () => {
    const i = io();
    const r = await run(["audit", "x", "--why", "y", "-o", "prompt.txt"], i);
    expect(r.code).toBe(0);
    expect(r.stdout).toBe("");
    expect(i.written["prompt.txt"]).toContain("Judgment: x");
  });

  it("exits 1 with a message when -o cannot be written or --file read", async () => {
    const w = await go(["audit", "x", "--why", "y", "-o", "/nope/p.txt"], {
      writeFile: async () => {
        throw new Error("EACCES: permission denied");
      },
    });
    expect(w.code).toBe(1);
    expect(w.stderr).toContain("EACCES");
    const r = await go(["audit", "--file", "missing.md"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("missing.md");
  });

  it("refuses a judgment and a document together", async () => {
    const r = await go(["audit", "x", "--file", "plan.md"]);
    expect(r.code).toBe(2);
  });
});

describe("irrational biases / bias", () => {
  it("lists every bias, one per line, under its family", async () => {
    const r = await go(["biases"]);
    expect(r.code).toBe(0);
    for (const b of BIASES) expect(r.stdout).toContain(b.id);
    expect(r.stdout).toContain("Too much information");
  });

  it("filters by family", async () => {
    const r = await go(["biases", "--family", "need-to-act-fast"]);
    const want = BIASES.filter((b) => b.family === "need-to-act-fast");
    for (const b of want) expect(r.stdout).toContain(b.id);
    expect(r.stdout).not.toContain("anchoring");
  });

  it("rejects an unknown family with exit 2", async () => {
    const r = await go(["biases", "--family", "nope"]);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain("too-much-information");
  });

  it("gives the same JSON as the MCP list_biases tool", async () => {
    const r = await go(["biases", "--json"]);
    expect(JSON.parse(r.stdout)).toEqual({
      count: BIASES.length,
      biases: BIASES,
    });
  });

  it("shows one bias with its question and citation", async () => {
    const r = await go(["bias", "anchoring"]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("Anchoring");
    expect(r.stdout).toContain(BIASES[0].ask);
    expect(r.stdout).toContain("Tversky & Kahneman (1974)");
  });

  it("renders a bias as markdown carrying the catalogue's licence", async () => {
    const r = await go(["bias", "anchoring", "--format", "md"]);
    expect(r.stdout.startsWith("# Anchoring")).toBe(true);
    expect(r.stdout).toContain("CC BY 4.0");
  });

  it("exits 1 for an unknown bias", async () => {
    const r = await go(["bias", "nope"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("nope");
  });
});

describe("irrational checklist", () => {
  it("prints the pen-and-paper audit with every step and every bias", async () => {
    const r = await go(["checklist"]);
    expect(r.code).toBe(0);
    for (const s of CHECKLIST.steps) expect(r.stdout).toContain(s.title);
    for (const b of BIASES) expect(r.stdout).toContain(b.name);
  });

  it("renders as markdown with checkboxes", async () => {
    const r = await go(["checklist", "--format", "md"]);
    expect(r.stdout).toContain("- [ ] Anchoring");
    expect(r.stdout).toContain("## 1. Spot the system");
  });
});

describe("modes and usage", () => {
  it("prints help on a terminal with no arguments", async () => {
    const r = await go([]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("irrational audit");
  });

  it("serves MCP with no arguments when stdin is not a terminal", async () => {
    expect((await go([], { isTTY: false })).serve).toBe(true);
  });

  it("serves MCP with the explicit serve command", async () => {
    expect((await go(["serve"])).serve).toBe(true);
  });

  it("names the package and catalogue versions", async () => {
    const r = await go(["--version"]);
    expect(r.stdout).toMatch(
      new RegExp(
        `^irrational ${pkg.version} \\(catalogue: ${BIASES.length} biases, [0-9a-f]{7}\\)`,
      ),
    );
  });

  it("exits 2 on an unknown command or option", async () => {
    expect((await go(["frobnicate"])).code).toBe(2);
    expect((await go(["biases", "--nope"])).code).toBe(2);
  });

  // The npm package versions apart from the MCP server (server.json's own version):
  // server.json's npm entry is what the Registry points at, so it must match the package.
  it("keeps the package version in step with server.json's npm entry", () => {
    const npm = json("../../server.json").packages.find(
      (p: { registryType: string }) => p.registryType === "npm",
    );
    expect(npm.identifier).toBe(pkg.name);
    expect(npm.version).toBe(pkg.version);
    expect(pkg.name).toBe("irrational");
  });
});

describe("stdio MCP", () => {
  it("answers a request line with a response line", () => {
    const out = handleLine(
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    );
    expect(JSON.parse(out!).result.serverInfo.name).toBe("irrational");
  });

  it("stays silent for notifications and blank lines", () => {
    expect(
      handleLine(
        JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      ),
    ).toBeNull();
    expect(handleLine("   ")).toBeNull();
  });

  it("returns a parse error for bad JSON", () => {
    expect(JSON.parse(handleLine("{nope")!).error.code).toBe(-32700);
  });

  it("answers a batch", () => {
    const out = JSON.parse(
      handleLine(
        JSON.stringify([
          { jsonrpc: "2.0", id: 1, method: "ping" },
          { jsonrpc: "2.0", method: "notifications/initialized" },
        ]),
      )!,
    );
    expect(out).toHaveLength(1);
  });
});
