import { appendFileSync } from "node:fs";

export function writeGithubOutput(name: string, value: string): void {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  if (value.includes("\n") || name.includes("\n"))
    throw new Error("Refusing to write multiline output.");
  appendFileSync(file, `${name}=${value}\n`);
}
