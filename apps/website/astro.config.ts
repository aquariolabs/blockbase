import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import varlockAstroIntegration from "@varlock/astro-integration";
import robotsTxt from "astro-robots-txt";
import { defineConfig } from "astro/config";
import evlog from "evlog/vite";
import { ENV } from "varlock/env";

export default defineConfig({
  site: "https://blockbase.aquariolabs.com",
  adapter: cloudflare(),
  integrations: [
    varlockAstroIntegration(),
    react(),
    sitemap(),
    robotsTxt({
      sitemap: true,
      policy: [
        {
          userAgent: "*",
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
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    ssr: {
      noExternal: ["@workspace/ui", "@base-ui/react"],
    },
    plugins: [
      tailwindcss(),
      evlog({
        service: "website",
      }),
    ],
  },
});
