import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "varlock run -- astro build",
        cache: {
          env: ["VARLOCK_ENV", "POSTHOG_KEY", "POSTHOG_HOST"],
          input: [{ auto: true }, "!.wrangler/**"],
        },
      },
    },
  },
});
