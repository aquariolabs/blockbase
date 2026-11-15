import { definePlugin, defineRule } from "vite-plus/lint/plugins";
import type { Comment, ESTree, Node, Visitor } from "vite-plus/lint/plugins";

const DIRECTIVE_PATTERNS = [
  /^\s*(?:oxlint|eslint)(?:-disable|-enable|\s)/,
  /^\s*@ts-(?:expect-error|ignore|nocheck|check)\b/,
  /^\/\s*<(?:reference|amd-module|amd-dependency)\b/,
  /^\s*(?:oxfmt|prettier|biome)-ignore\b/,
  /^\s*(?:v8|c8|istanbul)\s+ignore\b/,
  /^\s*@(?:vite-ignore|jsx|jsxImportSource|jsxRuntime|jsxFrag)\b/,
  /^\s*[#@]__(?:PURE|NO_SIDE_EFFECTS)__\s*$/,
];

const TOP_LEVEL_DECLARATIONS = new Set([
  "ExportNamedDeclaration",
  "ExportDefaultDeclaration",
  "FunctionDeclaration",
  "ClassDeclaration",
  "VariableDeclaration",
  "TSInterfaceDeclaration",
  "TSTypeAliasDeclaration",
  "TSEnumDeclaration",
  "TSModuleDeclaration",
  "TSDeclareFunction",
]);

const MEMBERS = [
  "MethodDefinition",
  "PropertyDefinition",
  "AccessorProperty",
  "TSAbstractMethodDefinition",
  "TSAbstractPropertyDefinition",
  "TSPropertySignature",
  "TSMethodSignature",
  "TSIndexSignature",
  "TSEnumMember",
  "Property",
];

const isDirective = (comment: Comment) =>
  DIRECTIVE_PATTERNS.some((pattern) => pattern.test(comment.value));

const isJSDoc = (comment: Comment) => comment.type === "Block" && comment.value.startsWith("*");

const noComments = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow code comments, except tool directives. With allowJSDoc, JSDoc on top-level declarations and members is allowed too.",
    },
    schema: [
      {
        type: "object",
        properties: { allowJSDoc: { type: "boolean" } },
        additionalProperties: false,
      },
    ],
    messages: {
      noComments:
        "Comments are not allowed. Express the intent through names, types, and tests instead.",
    },
  },
  create(context) {
    const [options] = context.options as [{ allowJSDoc?: boolean }?];
    const allowJSDoc = options?.allowJSDoc === true;
    const documentableStarts = new Set<number>();
    const collect = (node: Node) => documentableStarts.add(node.start);
    const memberVisitors: Visitor = Object.fromEntries(MEMBERS.map((type) => [type, collect]));

    const documents = (comment: Comment) => {
      const { text } = context.sourceCode;
      let cursor = comment.end;
      while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
      return documentableStarts.has(cursor);
    };

    return {
      ...memberVisitors,
      Program(program: ESTree.Program) {
        for (const statement of program.body) {
          if (TOP_LEVEL_DECLARATIONS.has(statement.type)) collect(statement);
        }
      },
      "Program:exit"() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (isDirective(comment)) continue;
          if (allowJSDoc && isJSDoc(comment) && documents(comment)) continue;
          context.report({ loc: comment.loc, messageId: "noComments" });
        }
      },
    };
  },
});

export default definePlugin({
  meta: { name: "blockbase" },
  rules: { "no-comments": noComments },
});
