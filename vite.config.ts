import { defineConfig } from "vite-plus";

/**
 * Build output and local tool state. A check that sees a new folder here
 * would otherwise miss the cache.
 */
const generated = [
  "!**/dist",
  "!**/dist/**",
  "!**/out",
  "!**/out/**",
  "!**/.wrangler",
  "!**/.wrangler/**",
  "!**/playwright-report",
  "!**/playwright-report/**",
  "!**/test-results",
  "!**/test-results/**",
];

export default defineConfig({
  test: {
    projects: ["packages/*", "apps/*"],
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [".agents/**", ".codex/**"],
    sortImports: {},
    sortTailwindcss: {
      functions: ["clsx", "cn"],
      preserveWhitespace: true,
    },
  },
  lint: {
    ignorePatterns: [".agents/**", ".codex/**"],
    jsPlugins: [
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      { name: "slop", specifier: "eslint-plugin-slop" },
    ],
    rules: {
      complexity: "error",
      "vite-plus/prefer-vite-plus-imports": "error",
      "slop/no-em-dash": "error",
      "slop/no-trivial-functions": "error",
      "slop/max-comment-length": "error",
      "slop/no-jargon": "error",
      "slop/prefer-jsdoc": "error",
      "slop/no-trivial-type-aliases": "error",
      "slop/no-static-only-class": "error",
      "slop/no-chained-type-assertions": "error",
    },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
    tasks: {
      check: {
        command: "vp check",
        cache: { env: ["VARLOCK_ENV"], input: [{ auto: true }, ...generated] },
      },
      test: {
        command: "vp test",
        cache: { env: ["VARLOCK_ENV"], input: [{ auto: true }, ...generated] },
      },
    },
  },
});
