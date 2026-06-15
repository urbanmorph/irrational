import { describe, it, expect } from "vitest";
import { handleMcp } from "./handler";
import { BIASES } from "../data/biases";

/* eslint-disable @typescript-eslint/no-explicit-any */
function call(method: string, params?: unknown, id: unknown = 1) {
  return handleMcp({
    jsonrpc: "2.0",
    id: id as any,
    method,
    params: params as any,
  });
}
const result = (r: ReturnType<typeof handleMcp>) => (r as any)?.result;

describe("mcp handler", () => {
  it("initialize returns server info + protocol version", () => {
    const r = call("initialize");
    expect(result(r).serverInfo.name).toBe("irrational");
    expect(result(r).protocolVersion).toBeTruthy();
  });

  it("tools/list returns exactly the three tools", () => {
    const names = result(call("tools/list")).tools.map((t: any) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(["analyze_decision", "list_biases", "get_bias"]),
    );
    expect(names).toHaveLength(3);
  });

  it("analyze_decision with reasoning returns an audit directive with all biases", () => {
    const r = call("tools/call", {
      name: "analyze_decision",
      arguments: {
        judgment: "Rewrite it",
        reasoning: "we already spent two months",
      },
    });
    const sc = result(r).structuredContent;
    expect(sc.status).toBe("audit");
    expect(sc.candidateBiases).toHaveLength(BIASES.length);
  });

  it("analyze_decision threads a language into the directive", () => {
    const r = call("tools/call", {
      name: "analyze_decision",
      arguments: { judgment: "x", reasoning: "y", language: "Hindi" },
    });
    expect(result(r).structuredContent.instructions).toContain("Hindi");
  });

  it("analyze_decision without reasoning asks for reasoning", () => {
    const r = call("tools/call", {
      name: "analyze_decision",
      arguments: { judgment: "Quit" },
    });
    expect(result(r).structuredContent.status).toBe("needs_reasoning");
  });

  it("list_biases returns all 22 and filters by family", () => {
    expect(
      result(call("tools/call", { name: "list_biases", arguments: {} }))
        .structuredContent.count,
    ).toBe(22);
    expect(
      result(
        call("tools/call", {
          name: "list_biases",
          arguments: { family: "too-much-information" },
        }),
      ).structuredContent.count,
    ).toBe(5);
  });

  it("get_bias returns a known bias and flags an unknown id", () => {
    expect(
      result(
        call("tools/call", {
          name: "get_bias",
          arguments: { id: "sunk-cost" },
        }),
      ).structuredContent.name,
    ).toBe("Sunk cost");
    expect(
      result(
        call("tools/call", { name: "get_bias", arguments: { id: "nope" } }),
      ).isError,
    ).toBe(true);
  });

  it("unknown method returns JSON-RPC -32601", () => {
    expect((call("frobnicate") as any).error.code).toBe(-32601);
  });

  it("notifications get no response", () => {
    expect(
      handleMcp({ jsonrpc: "2.0", method: "notifications/initialized" }),
    ).toBeNull();
  });
});
