import { pathToFileURL } from "node:url";

import { configState } from "../config-state.ts";
import { writeGithubOutput } from "../github-output.ts";
import { createEmptyOrSeededDatabase, libsqlUrl, lookupHostname } from "./api.ts";
import {
  assertNotProduction,
  previewDatabaseName,
  seedSource,
  snapshotDatabaseName,
} from "./names.ts";

const KEYS = [
  "TURSO_ORGANIZATION_SLUG",
  "TURSO_PREVIEW_GROUP_NAME",
  "TURSO_PREVIEW_GROUP_TOKEN",
] as const;

export async function runProvision(
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  try {
    if (configState(KEYS, env) === "off") {
      console.log("preview database off");
      return 0;
    }
    const group = env.TURSO_PREVIEW_GROUP_NAME ?? "";
    const organization = env.TURSO_ORGANIZATION_SLUG ?? "";
    const token = env.TURSO_PREVIEW_GROUP_TOKEN ?? "";
    const name = previewDatabaseName(group, env.PR_NUMBER ?? "");
    assertNotProduction(name);
    const snapshot = snapshotDatabaseName(group);
    const auth = { fetch: fetchImpl, organization, token };
    const existing = await lookupHostname({ ...auth, name });
    if (existing) {
      writeGithubOutput("database_url", libsqlUrl(existing));
      console.log(`${name} exists`);
      return 0;
    }
    const snapshotHost = await lookupHostname({ ...auth, name: snapshot });
    const seed = seedSource(snapshot, snapshotHost != null);
    const hostname = await createEmptyOrSeededDatabase({ ...auth, name, group, seed });
    writeGithubOutput("database_url", libsqlUrl(hostname));
    console.log(`${name} ${seed ? "snapshot" : "empty"}`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "preview database failed"}\n`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await runProvision(process.env));
}
