import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// The MCP Registry listing: directories (mcptry and others) score a listing on its title, icon,
// description, repository and website.
const server = JSON.parse(
  readFileSync(new URL("../../server.json", import.meta.url), "utf8"),
);

describe("server.json", () => {
  it("has a title, a 40+ character description, a repository and a website", () => {
    expect(server.title).toBe("Irrational");
    expect(server.description.length).toBeGreaterThanOrEqual(40);
    expect(server.repository.url).toBe(
      "https://github.com/urbanmorph/irrational",
    );
    expect(server.websiteUrl).toBe("https://irrational.pages.dev");
  });

  it("lists the site's own icon, served from the site", () => {
    expect(server.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "https://irrational.pages.dev/favicon.svg",
          mimeType: "image/svg+xml",
        }),
      ]),
    );
  });
});
