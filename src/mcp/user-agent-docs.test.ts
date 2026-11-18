// No API keys. Irrational counts nothing from requests: the docs ask for a User-Agent, say it is not
// stored, and claim no counting.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (f: string) =>
  readFileSync(new URL(`../../${f}`, import.meta.url), "utf8").replace(
    /\s+/g,
    " ",
  );
const ASK =
  "Please send a `User-Agent` that names your app (for example `my-app/1.0`). We don't store it, and we don't track who you are.";
const MCP = "We don't keep anything about MCP callers.";

describe("the User-Agent request in the docs", () => {
  it.each(["README.md", "public/llms.txt"])(
    "%s asks for one and claims no counting",
    (f) => {
      expect(read(f)).toContain(ASK);
      expect(read(f)).toContain(MCP);
      expect(read(f)).not.toMatch(/count calls by app|counts of how each mode/);
    },
  );
});
