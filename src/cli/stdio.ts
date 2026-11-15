// The local MCP server: newline-delimited JSON-RPC on stdin/stdout, answered by the same
// handleMcp() the hosted /mcp/server endpoint uses. Nothing leaves the machine.

import { handleMcp, type JsonRpcRequest } from "../mcp/handler";

/** One line in, one line out (or null: a notification, a blank line, or a batch of notifications). */
export function handleLine(line: string): string | null {
  if (!line.trim()) return null;
  let msg: unknown;
  try {
    msg = JSON.parse(line);
  } catch {
    return JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" },
    });
  }
  if (Array.isArray(msg)) {
    const out = msg.map((m) => handleMcp(m as JsonRpcRequest)).filter(Boolean);
    return out.length ? JSON.stringify(out) : null;
  }
  const res = handleMcp(msg as JsonRpcRequest);
  return res ? JSON.stringify(res) : null;
}
