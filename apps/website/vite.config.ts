import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "varlock run -- astro build",
        env: ["POSTHOG_KEY", "POSTHOG_HOST"],
      },
    },
  },
});
