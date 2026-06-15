import { defineConfig, passthroughImageService } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Pure static site — no SSR adapter. Every page prerenders to static HTML served straight
// from Cloudflare's CDN (so the Web Analytics beacon auto-injects, and there's no whole-site
// Worker). The only dynamic route, the MCP endpoint, is a native Cloudflare Pages Function at
// functions/mcp/server.ts. passthroughImageService() avoids the native `sharp` dependency.
export default defineConfig({
  site: "https://irrational.pages.dev",
  output: "static",
  integrations: [sitemap()],
  image: { service: passthroughImageService() },
  vite: { plugins: [tailwindcss()] },
});
