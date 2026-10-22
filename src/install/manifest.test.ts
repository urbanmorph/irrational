import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";

const pub = (p: string) => new URL(`../../public${p}`, import.meta.url);
const manifest = JSON.parse(readFileSync(pub("/site.webmanifest"), "utf8"));

// Pixel size from the file header. PNG: IHDR width/height are big-endian u32
// at bytes 16 and 20. Lossy WebP ("VP8 " chunk): 14-bit little-endian at 26/28.
function imageSize(path: string) {
  const buf = readFileSync(pub(path));
  if (buf.toString("ascii", 1, 4) === "PNG") {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf.toString("ascii", 8, 16) === "WEBPVP8 ") {
    return {
      w: buf.readUInt16LE(26) & 0x3fff,
      h: buf.readUInt16LE(28) & 0x3fff,
    };
  }
  throw new Error(`${path}: expected PNG or lossy WebP`);
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
    expect(imageSize(maskable[0].src)).toEqual({ w: 512, h: 512 });
  });

  it("every icon file exists with its declared size", () => {
    for (const icon of manifest.icons) {
      const [w, h] = icon.sizes.split("x").map(Number);
      expect(imageSize(icon.src)).toEqual({ w, h });
    }
  });

  describe("screenshots", () => {
    const shots: {
      src: string;
      sizes: string;
      type: string;
      label: string;
      form_factor: string;
    }[] = manifest.screenshots ?? [];

    it("has one narrow and one wide screenshot", () => {
      expect(shots.map((s) => s.form_factor).sort()).toEqual([
        "narrow",
        "wide",
      ]);
    });

    it("each file exists with its declared size, type and a label", () => {
      expect(shots.length).toBeGreaterThan(0);
      for (const shot of shots) {
        const [w, h] = shot.sizes.split("x").map(Number);
        expect(imageSize(shot.src)).toEqual({ w, h });
        expect(shot.type).toBe(`image/${shot.src.split(".").pop()}`);
        expect(shot.label.length).toBeGreaterThan(0);
      }
    });

    it("stays within install-dialog limits", () => {
      for (const shot of shots) {
        const [w, h] = shot.sizes.split("x").map(Number);
        for (const d of [w, h]) {
          expect(d).toBeGreaterThanOrEqual(320);
          expect(d).toBeLessThanOrEqual(3840);
        }
        expect(Math.max(w, h) / Math.min(w, h)).toBeLessThanOrEqual(2.3);
        expect(shot.form_factor === "wide").toBe(w > h);
        expect(statSync(pub(shot.src)).size).toBeLessThan(300 * 1024);
      }
    });
  });
});
