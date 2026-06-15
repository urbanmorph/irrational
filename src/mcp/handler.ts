// Stateless MCP server, hand-rolled JSON-RPC 2.0 (no SDK — the whole engine is
// "discipline as data"). Pure function: parsed request in, response out (or null for
// notifications). The HTTP wrapper lives in the Pages Function.

import { BIASES, FAMILIES, type Family } from "../data/biases";
import { buildAuditDirective, type AuditMode } from "../engine/scaffold";

export const SERVER_INFO = { name: "irrational", version: "0.1.0" } as const;
export const PROTOCOL_VERSION = "2024-11-05";

// Server-level instructions: MCP clients (Claude Code, Claude Desktop, …) inject this
// into the model's context so it knows how to USE the server, not just that it exists.
export const SERVER_INSTRUCTIONS = [
  "Irrational is an adversarial behavioural-bias auditor. It runs no model of its own:",
  "`analyze_decision` returns a DIRECTIVE — an adversarial contract, the bias catalogue and a",
  "procedure. You must EXECUTE that directive yourself to produce the audit; do not just print or",
  "summarise it. Follow its instructions exactly: assume the user is biased, refuse to validate,",
  "argue the other side, and tie every bias to the user's own words.",
  "",
  "Call analyze_decision with the user's judgment and the reasoning behind it (ask for the reasoning",
  "first if only a conclusion is given). Output is readable prose by default; pass structured:true for",
  "a parseable JSON object, and language to answer in another language.",
  "Use list_biases / get_bias to reference or explain the 22-bias catalogue.",
].join("\n");

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const FAMILY_VALUES = Object.keys(FAMILIES) as Family[];

export const TOOLS = [
  {
    name: "analyze_decision",
    description:
      "Adversarially audit a decision for cognitive biases. Returns a directive YOUR model executes to produce the composed audit (verdict-first). Provide reasoning, not just the conclusion.",
    inputSchema: {
      type: "object",
      properties: {
        judgment: {
          type: "string",
          description: "The decision/judgment in one line.",
        },
        reasoning: {
          type: "string",
          description: "How you arrived at it (required to audit).",
        },
        mode: {
          type: "string",
          enum: ["forward", "retrospective"],
          description:
            "forward = a decision you are about to make; retrospective = reviewing a past decision/outcome.",
        },
        language: {
          type: "string",
          description:
            'Optional. Natural language for the audit prose (e.g. "Tamil", "Spanish"). Bias ids stay canonical English so the result is still parseable. Defaults to English.',
        },
        structured: {
          type: "boolean",
          description:
            "Optional. Default false → the audit comes back as readable prose. Set true to get a machine-parseable JSON object (bias ids/keys in English) for pipelines that store or compare audits.",
        },
      },
      required: ["judgment"],
    },
  },
  {
    name: "list_biases",
    description: "List the 22-bias catalogue, optionally filtered by family.",
    inputSchema: {
      type: "object",
      properties: { family: { type: "string", enum: FAMILY_VALUES } },
    },
  },
  {
    name: "get_bias",
    description: "Get the full entry for one bias by id.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
] as const;

function ok(id: JsonRpcResponse["id"], result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function err(
  id: JsonRpcResponse["id"],
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function toolResult(
  id: JsonRpcResponse["id"],
  data: unknown,
  isError = false,
): JsonRpcResponse {
  return ok(id, {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
    isError,
  });
}

function handleToolCall(
  id: JsonRpcResponse["id"],
  params: Record<string, unknown> | undefined,
): JsonRpcResponse {
  const name = params?.name as string | undefined;
  const args = (params?.arguments ?? {}) as Record<string, unknown>;

  switch (name) {
    case "analyze_decision": {
      const directive = buildAuditDirective({
        judgment: String(args.judgment ?? ""),
        reasoning: args.reasoning == null ? undefined : String(args.reasoning),
        mode: args.mode as AuditMode | undefined,
        language: args.language == null ? undefined : String(args.language),
        structured: args.structured === true,
      });
      return toolResult(id, directive);
    }
    case "list_biases": {
      const family = args.family as Family | undefined;
      const list = family ? BIASES.filter((b) => b.family === family) : BIASES;
      return toolResult(id, { count: list.length, biases: list });
    }
    case "get_bias": {
      const bias = BIASES.find((b) => b.id === args.id);
      if (!bias)
        return toolResult(
          id,
          { error: `Unknown bias id: ${String(args.id)}` },
          true,
        );
      return toolResult(id, bias);
    }
    default:
      return err(id, -32602, `Unknown tool: ${String(name)}`);
  }
}

export function handleMcp(req: JsonRpcRequest): JsonRpcResponse | null {
  const id = req.id ?? null;
  switch (req.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions: SERVER_INSTRUCTIONS,
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return null; // notifications get no response
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call":
      return handleToolCall(id, req.params);
    default:
      return err(id, -32601, `Method not found: ${req.method}`);
  }
}
