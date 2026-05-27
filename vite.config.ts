import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    projects: ["packages/*", "apps/*"],
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    sortImports: {},
    sortTailwindcss: {
      functions: ["clsx", "cn"],
      preserveWhitespace: true,
    },
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  run: {
    cache: true,
  },
});
