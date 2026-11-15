import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      // Renders every template to HTML: fails when one doesn't compile.
      build: "email export --dir templates --outDir out",
    },
  },
});
