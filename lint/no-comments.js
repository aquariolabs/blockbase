import { definePlugin, defineRule } from "vite-plus/lint/plugins";

const DIRECTIVE_PATTERNS = [
  /^\s*(?:oxlint|eslint)(?:-disable|-enable|\s)/,
  /^\s*@ts-(?:expect-error|ignore|nocheck|check)\b/,
  /^\/\s*<(?:reference|amd-module|amd-dependency)\b/,
  /^\s*(?:oxfmt|prettier|biome)-ignore\b/,
  /^\s*(?:v8|c8|istanbul)\s+ignore\b/,
  /^\s*@(?:vite-ignore|jsx|jsxImportSource|jsxRuntime|jsxFrag)\b/,
  /^\s*[#@]__(?:PURE|NO_SIDE_EFFECTS)__\s*$/,
];

const isDirective = (comment) => DIRECTIVE_PATTERNS.some((pattern) => pattern.test(comment.value));

const noComments = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow code comments, except for tool directives.",
    },
    messages: {
      noComments:
        "Comments are not allowed. Express the intent through names, types, and tests instead.",
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (!isDirective(comment)) {
            context.report({ loc: comment.loc, messageId: "noComments" });
          }
        }
      },
    };
  },
});

export default definePlugin({
  meta: { name: "blockbase" },
  rules: { "no-comments": noComments },
});
