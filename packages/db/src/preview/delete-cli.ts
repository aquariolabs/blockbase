import { pathToFileURL } from "node:url";

import { configState } from "../config-state.ts";
import { deleteDatabase } from "./api.ts";
import { assertNotProduction, previewDatabaseName } from "./names.ts";

const KEYS = [
  "TURSO_ORGANIZATION_SLUG",
  "TURSO_PREVIEW_GROUP_NAME",
  "TURSO_PREVIEW_API_TOKEN",
] as const;

export async function runDelete(
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  try {
    if (configState(KEYS, env) === "off") {
      console.log("preview database off");
      return 0;
    }
    const name = previewDatabaseName(env.TURSO_PREVIEW_GROUP_NAME ?? "", env.PR_NUMBER ?? "");
    assertNotProduction(name);
    await deleteDatabase({
      fetch: fetchImpl,
      organization: env.TURSO_ORGANIZATION_SLUG ?? "",
      token: env.TURSO_PREVIEW_API_TOKEN ?? "",
      name,
    });
    console.log(`${name} deleted`);
    return 0;
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "preview database delete failed"}\n`,
    );
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await runDelete(process.env));
}
