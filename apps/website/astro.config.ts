import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import varlockAstroIntegration from "@varlock/astro-integration";
import robotsTxt from "astro-robots-txt";
import { defineConfig } from "astro/config";
import evlog from "evlog/vite";
import { ENV } from "varlock/env";

// https://astro.build/config
export default defineConfig({
  site: "https://dia-zero.aquariolabs.com", // TODO: replace with the correct project route
  adapter: cloudflare({
    prerenderEnvironment: "node",
  }),
  integrations: [
    varlockAstroIntegration(),
    react(),
    sitemap(),
    robotsTxt({
      sitemap: true,
      policy: [
        {
          userAgent: "*",
          // The next line enables or disables the crawling on the `robots.txt` level outside of production.
          disallow: ENV.VARLOCK_ENV === "production" ? "" : "/",
        },
      ],
      transform(content) {
        const contentSignalLine = "Content-Signal: ai-train=no, search=yes, ai-input=no";
        if (content.includes(contentSignalLine)) return content;
        return `${content.trimEnd()}\n${contentSignalLine}\n`;
      },
    }),
  ],
  vite: {
    plugins: [
      tailwindcss(),
      evlog({
        service: "website",
      }),
    ],
  },
});
