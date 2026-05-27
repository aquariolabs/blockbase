import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      dev: {
        command: "varlock run -- portless run --name website.dia-zero astro dev",
        cache: false,
      },
      build: {
        command: "astro build",
      },
      "deploy:production": {
        command: "varlock-wrangler deploy",
      },
      "deploy:preview": {
        command: "varlock-wrangler versions upload",
      },
    },
  },
});
