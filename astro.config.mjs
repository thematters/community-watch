import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// Set SITE_URL / BASE_PATH at build time when deploying to a subpath
// (e.g. GitHub Pages user/repo). Default = root.
const site = process.env.SITE_URL ?? "https://example.com";
const rawBase = process.env.BASE_PATH ?? "/";
const base = rawBase === "/" ? "/" : `/${rawBase.replace(/^\/+|\/+$/g, "")}`;

export default defineConfig({
  site,
  base,
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
  trailingSlash: "ignore",
  build: { format: "directory" },
});
