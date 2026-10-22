import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

/**
 * What the offline worker saves on install: every page (by its directory URL)
 * and every hashed build file, plus a version that changes whenever any of them
 * does, so a deploy that changes a page installs a new worker.
 */
export async function precacheList(dist: string) {
  const paths = (await readdir(dist, { recursive: true, withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => `/${relative(dist, join(e.parentPath, e.name))}`)
    .sort();
  const html = paths.filter((p) => p.endsWith("/index.html"));
  const assets = paths.filter((p) => p.startsWith("/_astro/"));
  const hash = createHash("sha256");
  for (const p of [...html, ...assets])
    hash.update(p).update(await readFile(join(dist, p)));
  return {
    version: hash.digest("hex").slice(0, 16),
    pages: html.map((p) => p.replace(/index\.html$/, "")).sort(),
    assets,
  };
}

/** After the build, writes dist/sw.js: src/sw/sw.js with its precache list prepended. */
export default function serviceWorker(): AstroIntegration {
  return {
    name: "irrational:service-worker",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const list = await precacheList(dist);
        const source = await readFile(
          new URL("./sw.js", import.meta.url),
          "utf8",
        );
        await writeFile(
          join(dist, "sw.js"),
          `self.__PRECACHE__=${JSON.stringify(list)};\n${source}`,
        );
        logger.info(
          `sw.js ${list.version}: ${list.pages.length} pages, ${list.assets.length} build files`,
        );
      },
    },
  };
}
