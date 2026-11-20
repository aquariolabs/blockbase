import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      migrate: {
        command: "varlock run -- drizzle-kit migrate",
        cache: false,
      },
      snapshot: {
        command: "vp exec tsx src/preview/snapshot-cli.ts",
        cache: false,
      },
      anonymize: {
        command: "vp exec tsx src/anonymize/cli.ts",
        cache: false,
      },
      "provision-preview": {
        command: "vp exec tsx src/preview/provision-cli.ts",
        cache: false,
      },
      "delete-preview": {
        command: "vp exec tsx src/preview/delete-cli.ts",
        cache: false,
      },
    },
  },
});
