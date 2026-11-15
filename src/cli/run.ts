/// <reference types="node" />
// The `irrational` command line. Pure: argv and an Io in, the output and an exit code out, so
// every command is tested without a process. main.ts wires it to the real process; with no
// arguments off a terminal (or `serve`) it hands over to the stdio MCP server instead.
// It calls the same functions as the MCP tools (scaffold.ts, handler.ts): nothing is duplicated,
// and it makes no network calls: the decision goes only to the model the user pipes it to.

import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { BIASES, FAMILIES, type Bias, type Family } from "../data/biases";
import { CHECKLIST } from "../data/checklist";
import {
  buildAuditDirective,
  forgePrompt,
  type AuditRequest,
} from "../engine/scaffold";
import { SERVER_INFO, getBias, isFamily, listBiases } from "../mcp/handler";

export interface Io {
  isTTY: boolean;
  readStdin(): Promise<string>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, text: string): Promise<void>;
}

export interface Result {
  code: number;
  stdout: string;
  stderr: string;
  /** hand over to the stdio MCP server */
  serve?: boolean;
}

const SITE = "https://irrational.pages.dev";
const CREDIT = `From the Irrational bias catalogue (${SITE}), text CC BY 4.0; every claim cited at ${SITE}/sources.`;
const FAMILY_IDS = Object.keys(FAMILIES) as Family[];

export const HELP = `irrational: audit a decision for cognitive biases, with your own AI. Runs no model.

Usage:
  irrational audit "<judgment>" --why "<reasoning>"   a prompt to paste or pipe into any model
  irrational audit - < plan.md                         audit a document (first line = the decision)
  irrational audit --file plan.md                      the same, from a file
  irrational biases [--family <family>]                the catalogue
  irrational bias <id>                                 one bias, with its question and citation
  irrational checklist                                 the pen-and-paper audit
  irrational serve                                     the MCP server on stdio (also: no arguments, piped)

Audit options:
  --why <text|->      how you arrived at it (required; - reads stdin)
  --retro             a past decision: the outcome-flip test instead of a premortem
  --language <name>   the audit's language, e.g. Hindi or hi
  --structured        ask the model for JSON to the output schema
  --directive         the MCP directive (JSON) instead of the pasteable prompt

Output: --json for scripts, --format md for markdown, -o <file> to write a file.
Families: ${FAMILY_IDS.join(", ")}

Example: irrational audit "Rewrite the backend" --why "the POC went well" | claude -p`;

/** Short hash of the catalogue, so `--version` says exactly which catalogue shipped. */
export function catalogueVersion(): string {
  const hash = createHash("sha256")
    .update(JSON.stringify(BIASES))
    .digest("hex");
  return `${BIASES.length} biases, ${hash.slice(0, 7)}`;
}

class UsageError extends Error {}

const done = (stdout: string, code = 0): Result => ({
  code,
  stdout,
  stderr: "",
});
const fail = (stderr: string, code: number): Result => ({
  code,
  stdout: "",
  stderr: `${stderr}\n`,
});

/** "hi" → "Hindi"; names and anything unrecognised pass through. */
function languageName(lang?: string): string | undefined {
  if (!lang || !/^[a-z]{2,3}$/i.test(lang)) return lang;
  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(lang);
    return name && name.toLowerCase() !== lang.toLowerCase() ? name : lang;
  } catch {
    return lang;
  }
}

/** A document's decision is its first non-empty line (markdown heading marks dropped). */
function fromDocument(text: string): { judgment: string; reasoning: string } {
  const first = text.split("\n").find((l) => l.trim()) ?? "";
  return {
    judgment: first.replace(/^#+\s*/, "").trim(),
    reasoning: text.trim(),
  };
}

const OPTIONS = {
  why: { type: "string" },
  file: { type: "string", short: "f" },
  retro: { type: "boolean" },
  language: { type: "string" },
  structured: { type: "boolean" },
  directive: { type: "boolean" },
  family: { type: "string" },
  json: { type: "boolean" },
  format: { type: "string" },
  output: { type: "string", short: "o" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
} as const;

type Parsed = ReturnType<typeof parse>;
type Values = Parsed["values"];

const parse = (args: string[]) =>
  parseArgs({ args, options: OPTIONS, allowPositionals: true, strict: true });

async function audit(rest: string[], v: Values, io: Io): Promise<Result> {
  if (rest.length > 1)
    throw new UsageError("audit takes one judgment; quote it");
  let { judgment, reasoning }: { judgment: string; reasoning?: string } = {
    judgment: rest[0] ?? "",
    reasoning: v.why,
  };
  if (v.file !== undefined || judgment === "-") {
    if (v.file !== undefined && rest.length)
      throw new UsageError("give a judgment or --file, not both");
    const text =
      v.file === undefined || v.file === "-"
        ? await io.readStdin()
        : await io.readFile(v.file);
    ({ judgment, reasoning } = fromDocument(text));
  } else if (!judgment) {
    throw new UsageError(
      'audit needs a judgment: irrational audit "<judgment>" --why "<reasoning>"',
    );
  }
  if (reasoning === "-") reasoning = await io.readStdin();

  const req: AuditRequest = {
    judgment,
    reasoning,
    mode: v.retro ? "retrospective" : "forward",
    language: languageName(v.language),
    structured: v.structured === true,
  };
  const directive = buildAuditDirective(req);
  if (directive.status === "needs_reasoning") {
    // An audit without reasoning is the failure this tool exists to prevent.
    return v.json || v.directive
      ? done(json(directive), 2)
      : fail(`${directive.question}\n(add --why "<your reasoning>")`, 2);
  }
  if (v.directive) return done(json(directive));
  const prompt = forgePrompt(req);
  return done(v.json ? json({ status: "audit", prompt }) : `${prompt}\n`);
}

const json = (x: unknown) => `${JSON.stringify(x, null, 2)}\n`;

function biasesText(list: Bias[], md: boolean): string {
  const out: string[] = md ? ["# The Irrational bias catalogue", ""] : [];
  for (const fam of FAMILY_IDS) {
    const inFam = list.filter((b) => b.family === fam);
    if (!inFam.length) continue;
    out.push(md ? `## ${FAMILIES[fam].label}` : FAMILIES[fam].label, "");
    for (const b of inFam)
      out.push(
        md
          ? `- **${b.name}** (\`${b.id}\`): ${b.hook}`
          : `  ${b.id.padEnd(24)} ${b.hook}`,
      );
    out.push("");
  }
  if (md) out.push(`_${CREDIT}_`, "");
  return out.join("\n");
}

function biasText(b: Bias, md: boolean): string {
  const field = (label: string, text: string) =>
    md ? `**${label}:** ${text}` : `${label}: ${text}`;
  return [
    md ? `# ${b.name}` : `${b.name} (${b.id})`,
    "",
    md
      ? `_${FAMILIES[b.family].label}_ · \`${b.id}\``
      : FAMILIES[b.family].label,
    "",
    b.definition,
    "",
    field("Example", b.example),
    field("Counter", b.counter),
    field("Ask yourself", b.ask),
    field("Source", b.sourceUrl ? `${b.source} ${b.sourceUrl}` : b.source),
    ...(md ? ["", `_${CREDIT}_`] : []),
    "",
  ].join("\n");
}

function checklistText(md: boolean): string {
  const c = CHECKLIST;
  const box = md ? "- [ ]" : "[ ]";
  const line = md
    ? ""
    : "  ______________________________________________________________";
  const out = [
    md ? `# ${c.title}` : c.title,
    "",
    c.subtitle,
    "",
    "Decision: ____________________   Date: __________",
    "",
  ];
  c.steps.forEach((s, i) => {
    out.push(md ? `## ${i + 1}. ${s.title}` : `${i + 1}. ${s.title}`);
    if (s.hint) out.push(md ? s.hint : `   ${s.hint}`);
    for (const o of s.options ?? []) out.push(`${box} ${o}`);
    for (const q of s.questions ?? []) out.push(md ? `- ${q}` : `   - ${q}`);
    if (i === 1) {
      for (const fam of FAMILY_IDS) {
        out.push(
          "",
          md ? `**${FAMILIES[fam].label}**` : `   ${FAMILIES[fam].label}`,
        );
        for (const b of BIASES.filter((x) => x.family === fam))
          out.push(`${box} ${b.name}`);
      }
      out.push("", c.evidenceLabel);
    }
    if (!s.options && !s.questions) out.push(line, line);
    if (i === c.steps.length - 1) out.push(`${c.confidenceLabel} ____ %`);
    out.push("");
  });
  out.push(...c.footer.map((f) => (md ? `_${f}_` : f)), "");
  return out.join("\n");
}

async function dispatch(
  { values: v, positionals }: Parsed,
  io: Io,
): Promise<Result> {
  if (v.version)
    return done(
      `irrational ${SERVER_INFO.version} (catalogue: ${catalogueVersion()})\n`,
    );
  const [cmd, ...rest] = positionals;
  if (v.help || cmd === "help") return done(`${HELP}\n`);
  if (!cmd)
    return io.isTTY
      ? done(`${HELP}\n`)
      : { code: 0, stdout: "", stderr: "", serve: true };
  if (v.format !== undefined && v.format !== "md" && v.format !== "text")
    throw new UsageError(`--format is md or text, not ${v.format}`);
  const md = v.format === "md";

  switch (cmd) {
    case "serve":
      return { code: 0, stdout: "", stderr: "", serve: true };
    case "audit":
      return audit(rest, v, io);
    case "biases": {
      if (v.family !== undefined && !isFamily(v.family))
        throw new UsageError(
          `unknown family ${v.family}; one of ${FAMILY_IDS.join(", ")}`,
        );
      const list = listBiases(v.family as Family | undefined);
      return done(v.json ? json(list) : biasesText(list.biases, md));
    }
    case "bias": {
      if (rest.length !== 1)
        throw new UsageError("bias takes one id: irrational bias anchoring");
      const b = getBias(rest[0]);
      if (!b)
        return fail(
          `irrational: unknown bias id ${rest[0]}; see irrational biases`,
          1,
        );
      return done(v.json ? json(b) : biasText(b, md));
    }
    case "checklist":
      return done(v.json ? json(CHECKLIST) : checklistText(md));
    default:
      throw new UsageError(`unknown command ${cmd}; see irrational --help`);
  }
}

export async function run(args: string[], io: Io): Promise<Result> {
  try {
    const parsed = parse(args);
    const r = await dispatch(parsed, io);
    const out = parsed.values.output;
    if (!out || !r.stdout || r.serve) return r;
    await io.writeFile(out, r.stdout);
    return { ...r, stdout: "" };
  } catch (e) {
    // parseArgs throws TypeErrors with ERR_PARSE_ARGS_* codes for bad options
    const usage =
      e instanceof UsageError ||
      String((e as { code?: string }).code).startsWith("ERR_PARSE_ARGS");
    return fail(`irrational: ${(e as Error).message}`, usage ? 2 : 1);
  }
}
