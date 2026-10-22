import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const src = (p: string) =>
  readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

describe("offline wiring", () => {
  it("every page registers the worker, in the production build only", () => {
    const layout = src("src/layouts/Layout.astro");
    expect(layout).toMatch(
      /import\.meta\.env\.PROD[\s\S]*navigator\.serviceWorker[\s\S]*register\("\/sw\.js"/,
    );
  });

  it("the build writes sw.js", () => {
    expect(src("astro.config.mjs")).toMatch(/serviceWorker\(\)/);
  });

  it("the offline page is kept out of search and the sitemap", () => {
    expect(src("src/pages/offline.astro")).toMatch(/<Layout[^>]*\bnoindex\b/);
    expect(src("src/layouts/Layout.astro")).toMatch(
      /noindex && <meta name="robots" content="noindex"/,
    );
    expect(src("astro.config.mjs")).toMatch(/filter:[^\n]*\/offline\//);
  });
});
