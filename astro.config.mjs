import { defineConfig, passthroughImageService } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

// Static-first. Pages prerender by default; the MCP endpoint (src/pages/mcp/server.ts)
// opts into on-demand rendering (prerender = false) and the Cloudflare adapter compiles
// it into the deployed worker. passthroughImageService() avoids the native `sharp` dep.
export default defineConfig({
  site: "https://irrational.pages.dev",
  output: "static",
  adapter: cloudflare(),
  image: { service: passthroughImageService() },
  vite: { plugins: [tailwindcss()] },
});
