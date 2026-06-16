// Cloudflare Pages Function, the stateless MCP JSON-RPC endpoint at /mcp/server.
// All logic is the tested handleMcp(); this is just the HTTP layer. Living here (instead of
// an Astro SSR route) keeps the rest of the site pure-static.
import { handleMcp, type JsonRpcRequest } from "../../src/mcp/handler";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

export const onRequestOptions = () =>
  new Response(null, { status: 204, headers: CORS });

export const onRequestGet = () =>
  json({
    name: "irrational",
    version: "0.1.0",
    transport: "http",
    methods: "POST JSON-RPC 2.0 (initialize · tools/list · tools/call)",
    docs: "https://irrational.pages.dev/mcp",
  });

export const onRequestPost: PagesFunction = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      400,
    );
  }

  if (Array.isArray(body)) {
    const out = body.map((r) => handleMcp(r as JsonRpcRequest)).filter(Boolean);
    return json(out);
  }

  const res = handleMcp(body as JsonRpcRequest);
  if (res === null) return new Response(null, { status: 202, headers: CORS }); // notification
  return json(res);
};
