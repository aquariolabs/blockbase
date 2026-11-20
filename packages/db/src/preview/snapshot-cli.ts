import { pathToFileURL } from "node:url";

import { configState } from "../config-state.ts";
import { writeGithubOutput } from "../github-output.ts";
import { createEmptyOrSeededDatabase, deleteDatabase, libsqlUrl } from "./api.ts";
import { assertNotProduction, snapshotDatabaseName } from "./names.ts";

const KEYS = [
  "TURSO_ORGANIZATION_SLUG",
  "TURSO_PREVIEW_GROUP_NAME",
  "TURSO_PREVIEW_GROUP_TOKEN",
] as const;

export async function runSnapshot(
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  try {
    if (configState(KEYS, env) === "off") {
      console.log("anonymize snapshot off");
      return 0;
    }
    const group = env.TURSO_PREVIEW_GROUP_NAME ?? "";
    const name = snapshotDatabaseName(group);
    assertNotProduction(name);
    const auth = {
      fetch: fetchImpl,
      organization: env.TURSO_ORGANIZATION_SLUG ?? "",
      token: env.TURSO_PREVIEW_GROUP_TOKEN ?? "",
    };
    await deleteDatabase({ ...auth, name });
    const hostname = await createEmptyOrSeededDatabase({ ...auth, name, group, seed: null });
    writeGithubOutput("database_name", name);
    writeGithubOutput("database_url", libsqlUrl(hostname));
    console.log(`${name} recreated`);
    return 0;
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "anonymize snapshot failed"}\n`,
    );
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await runSnapshot(process.env));
}
