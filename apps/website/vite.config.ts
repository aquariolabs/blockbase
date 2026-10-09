import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "varlock run -- astro build",
        cache: { env: ["POSTHOG_KEY", "POSTHOG_HOST"] },
      },
    },
  },
});
