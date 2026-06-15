// Stateless MCP server, hand-rolled JSON-RPC 2.0 (no SDK — the whole engine is
// "discipline as data"). Pure function: parsed request in, response out (or null for
// notifications). The HTTP wrapper lives in the Pages Function.

import { BIASES, FAMILIES, type Family } from "../data/biases";
import { buildAuditDirective, type AuditMode } from "../engine/scaffold";

export const SERVER_INFO = { name: "irrational", version: "0.1.0" } as const;
export const PROTOCOL_VERSION = "2024-11-05";

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
            'Optional. Natural language for the audit prose (e.g. "Tamil", "Spanish"). Bias ids and output keys stay canonical English so the result is still parseable. Defaults to English.',
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
