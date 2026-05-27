import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      dev: {
        command: "varlock run -- portless run --name website.dia-zero astro dev",
        cache: false,
      },
      build: {
        command: "varlock run -- astro build",
        env: ["POSTHOG_KEY", "POSTHOG_HOST"],
      },
      "deploy:production": {
        command: "varlock-wrangler deploy",
        env: ["POSTHOG_KEY", "POSTHOG_HOST", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
      },
      "deploy:preview": {
        command: "varlock-wrangler versions upload",
        env: ["POSTHOG_KEY", "POSTHOG_HOST", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
      },
    },
  },
});
