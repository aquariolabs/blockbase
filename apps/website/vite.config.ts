import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "varlock run -- astro build",
        // VARLOCK_ENV picks the env, which changes the build (robots.txt).
        cache: {
          env: ["VARLOCK_ENV", "POSTHOG_KEY", "POSTHOG_HOST"],
          // Local Wrangler state from `wrangler dev`, not a build input.
          input: [{ auto: true }, "!.wrangler/**"],
        },
      },
    },
  },
});
