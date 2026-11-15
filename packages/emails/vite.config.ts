import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: "email export --dir templates --outDir out",
    },
  },
});
