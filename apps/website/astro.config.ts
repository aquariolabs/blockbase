import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import varlockAstroIntegration from "@varlock/astro-integration";
import { defineConfig } from "astro/config";
import evlog from "evlog/vite";

export default defineConfig({
  // TODO: replace with the correct project route
  site: "https://dia-zero.aquariolabs.com",
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
