import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import varlockAstroIntegration from "@varlock/astro-integration";
import { defineConfig } from "astro/config";
import evlog from "evlog/vite";
import type { Plugin } from "vite";

// Work around vitejs/vite#22356 while this repo's Vite+ alias still embeds
// Vite 8.0.10. Astro's dev toolbar registers an esbuild onEnd optimizer
// plugin that reads result.metafile, which throws "Not implemented" under
// Vite+ until it picks up the Vite 8.0.13 fix.
// TODO: Remove this once @voidzero-dev/vite-plus-core includes that fix.
function removeAstroToolbarEsbuildOptimizer(): Plugin {
  return {
    name: "website:remove-astro-toolbar-esbuild-optimizer",
    configResolved(config) {
      const esbuildOptions = config.optimizeDeps.esbuildOptions;
      const plugins = esbuildOptions?.plugins;
      if (!plugins) {
        return;
      }

      esbuildOptions.plugins = plugins.filter(
        (plugin) => plugin.name !== "astro:strip-toolbar-sourcemap",
      );
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://dia-zero.aquariolabs.com",
  trailingSlash: "never",
  output: "static",
  adapter: cloudflare({
    prerenderEnvironment: "node", // needed for varlock + astro + cloudflare integration
  }),
  integrations: [varlockAstroIntegration(), react(), sitemap()],
  vite: {
    plugins: [
      removeAstroToolbarEsbuildOptimizer(),
      tailwindcss(),
      evlog({
        service: "website",
      }),
    ],
  },
});
