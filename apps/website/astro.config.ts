import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import varlockAstroIntegration from "@varlock/astro-integration";
import { defineConfig } from "astro/config";
import evlog from "evlog/vite";

// https://astro.build/config
export default defineConfig({
  // TODO: replace with the correct project route
  site: "https://dia-zero.aquariolabs.com",
  trailingSlash: "never",
  output: "static",
  adapter: cloudflare({
    prerenderEnvironment: "node", // needed for varlock + astro + cloudflare integration
  }),
  integrations: [varlockAstroIntegration(), react(), sitemap()],
  vite: {
    plugins: [
      tailwindcss(),
      evlog({
        service: "website",
      }),
    ],
  },
});
