import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    projects: ["packages/*", "apps/*"],
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [".agents/skills/**"],
    sortImports: {},
    sortTailwindcss: {
      functions: ["clsx", "cn"],
      preserveWhitespace: true,
    },
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
});
