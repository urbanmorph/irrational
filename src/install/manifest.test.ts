import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const pub = (p: string) => new URL(`../../public${p}`, import.meta.url);
const manifest = JSON.parse(readFileSync(pub("/site.webmanifest"), "utf8"));

// PNG IHDR: width/height are big-endian u32 at bytes 16 and 20.
function pngSize(path: string) {
  const buf = readFileSync(pub(path));
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

describe("site.webmanifest", () => {
  it("declares id, scope and lang", () => {
    expect(manifest.id).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.lang).toBe("en");
  });

  it("keeps the 192 and 512 any-purpose icons", () => {
    const any = manifest.icons.filter(
      (i: { purpose?: string }) => !i.purpose || i.purpose === "any",
    );
    expect(any.map((i: { sizes: string }) => i.sizes).sort()).toEqual([
      "192x192",
      "512x512",
    ]);
  });

  it("has a separate 512 maskable icon that exists at that size", () => {
    const maskable = manifest.icons.filter(
      (i: { purpose?: string }) => i.purpose === "maskable",
    );
    expect(maskable).toHaveLength(1);
    expect(maskable[0].sizes).toBe("512x512");
    expect(maskable[0].src).not.toBe("/favicon-512.png");
    expect(pngSize(maskable[0].src)).toEqual({ w: 512, h: 512 });
  });

  it("every icon file exists with its declared size", () => {
    for (const icon of manifest.icons) {
      const [w, h] = icon.sizes.split("x").map(Number);
      expect(pngSize(icon.src)).toEqual({ w, h });
    }
  });
});
