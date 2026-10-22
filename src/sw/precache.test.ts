import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { precacheList } from "./precache";

let dist: string;
const put = (path: string, body = path) => {
  mkdirSync(dirname(join(dist, path)), { recursive: true });
  writeFileSync(join(dist, path), body);
};

beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), "irrational-dist-"));
  put("/index.html");
  put("/about/index.html");
  put("/offline/index.html");
  put("/_astro/index.D_mT855W.css");
  put("/google10baad30f7442a2a.html");
  put("/og.png");
  put("/screenshot-wide.webp");
});
afterEach(() => rmSync(dist, { recursive: true, force: true }));

describe("precacheList", () => {
  it("saves every page by its directory URL, and the hashed build files", async () => {
    const { pages, assets } = await precacheList(dist);
    expect(pages).toEqual(["/", "/about/", "/offline/"]);
    expect(assets).toEqual(["/_astro/index.D_mT855W.css"]);
  });

  it("leaves out loose files (verification page, images, screenshots)", async () => {
    const { pages, assets } = await precacheList(dist);
    expect([...pages, ...assets].join(" ")).not.toMatch(
      /google|og\.png|screenshot/,
    );
  });

  it("has a version that changes only when a page or build file changes", async () => {
    const a = (await precacheList(dist)).version;
    put("/og.png", "new image");
    expect((await precacheList(dist)).version).toBe(a);
    put("/about/index.html", "edited");
    expect((await precacheList(dist)).version).not.toBe(a);
  });
});
