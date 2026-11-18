// No API keys: use is counted by mode (website, MCP, CLI; bots excluded) as daily totals. The
// User-Agent is read only to sort a request into a mode and is not stored. The docs say so in these words.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (f: string) =>
  readFileSync(new URL(`../../${f}`, import.meta.url), "utf8").replace(
    /\s+/g,
    " ",
  );
const ASK =
  "Please send a `User-Agent` that names your app (for example `my-app/1.0`). We read it only to tell apps, AI tools and crawlers apart, so our counts of how each mode is used stay honest. We don't store it, and we don't track who you are.";
const MCP =
  "AI apps send their own name when they connect. We count calls by app (Claude, Cursor, …) and keep nothing else.";

describe("the User-Agent request in the docs", () => {
  it.each(["README.md", "public/llms.txt"])(
    "%s asks for one and says what the MCP server counts",
    (f) => {
      expect(read(f)).toContain(ASK);
      expect(read(f)).toContain(MCP);
    },
  );
});
