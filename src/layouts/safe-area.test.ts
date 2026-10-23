import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const src = (p: string) =>
  readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// Body of the first CSS rule whose selector list is exactly `selector`.
function rule(css: string, selector: string) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp(`(?:^|[}\\s])${esc}\\s*\\{([^}]*)\\}`));
  if (!m) throw new Error(`no rule for ${selector}`);
  return m[1];
}

const layout = src("layouts/Layout.astro");
const globalCss = src("styles/global.css");
const nav = src("components/Nav.astro");
const footer = src("components/Footer.astro");
const checklist = src("pages/checklist.astro");
const home = src("pages/index.astro");

describe("safe-area insets for notched screens", () => {
  it("the shared layout's viewport meta opts into viewport-fit=cover", () => {
    const meta = layout.match(/<meta name="viewport" content="([^"]*)"/);
    expect(meta?.[1]).toContain("viewport-fit=cover");
  });

  it("the page gutter (.wrap) clears the left and right insets", () => {
    const wrap = rule(globalCss, ".wrap");
    expect(wrap).toMatch(/max\([^;]*env\(safe-area-inset-left\)/);
    expect(wrap).toMatch(/max\([^;]*env\(safe-area-inset-right\)/);
  });

  it("the sticky header clears the top inset", () => {
    expect(rule(nav, ".site-nav")).toContain("env(safe-area-inset-top)");
  });

  it("the footer's last row clears the bottom inset", () => {
    expect(rule(footer, ".foot-legal")).toMatch(
      /max\([^;]*env\(safe-area-inset-bottom\)/,
    );
  });

  it("the footer rows keep the page gutter as side padding", () => {
    // A `padding:` shorthand on these .wrap rows would zero the gutter.
    for (const row of [".foot-cta", ".foot-cols", ".foot-legal"]) {
      expect(footer).toMatch(new RegExp(`class="wrap ${row.slice(1)}"`));
      expect(rule(footer, row)).not.toMatch(/(^|[\s;])padding\s*:/);
    }
  });

  it("the checklist's sheet sits inside the page gutter, so in landscape the card clears the notch", () => {
    // The card's own padding used to replace the gutter's safe-area padding (it was `class="sheet wrap"`).
    expect(checklist).toMatch(
      /<div class="wrap sheet-frame">\s*(<!--[^>]*-->\s*)?<article class="sheet">/,
    );
    expect(checklist).not.toMatch(/class="sheet wrap"/);
    // In print the paper's margin is the gutter: no extra frame padding.
    const print = checklist.slice(checklist.indexOf("@media print"));
    expect(rule(print, ".sheet-frame")).toMatch(/padding-inline:\s*0/);
  });

  it("the home hero uses the same gutter as every other section, so its edge lines up with the nav", () => {
    expect(rule(home, ".hero-grid")).not.toMatch(/--gutter/);
  });
});
