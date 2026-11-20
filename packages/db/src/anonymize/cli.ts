import { pathToFileURL } from "node:url";

import { createClient } from "@libsql/client";

import { anonymizeConfig } from "../../anonymize.config.ts";
import { configState } from "../config-state.ts";
import { assertNotProduction } from "../preview/names.ts";
import { copyDatabase } from "./copy.ts";

const KEYS = [
  "TURSO_PROD_DATABASE_URL",
  "TURSO_PROD_READ_TOKEN",
  "SNAPSHOT_DATABASE_URL",
  "SNAPSHOT_DATABASE_NAME",
  "TURSO_PREVIEW_GROUP_TOKEN",
  "ANON_HASH_KEY",
] as const;

function assertLibsqlUrl(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== "libsql:") throw new Error("Database URL must use libsql.");
  if (parsed.username || parsed.password || parsed.searchParams.has("authToken")) {
    throw new Error("Database URL must not embed credentials.");
  }
}

export async function runAnonymize(env: NodeJS.ProcessEnv): Promise<number> {
  try {
    if (configState(KEYS, env) === "off") {
      console.log("anonymize off");
      return 0;
    }
    const snapshotName = env.SNAPSHOT_DATABASE_NAME ?? "";
    assertNotProduction(snapshotName);
    const sourceUrl = env.TURSO_PROD_DATABASE_URL ?? "";
    const targetUrl = env.SNAPSHOT_DATABASE_URL ?? "";
    assertLibsqlUrl(sourceUrl);
    assertLibsqlUrl(targetUrl);
    if (sourceUrl === targetUrl) throw new Error("Refusing to copy a database onto itself.");

    const source = createClient({ url: sourceUrl, authToken: env.TURSO_PROD_READ_TOKEN });
    const target = createClient({ url: targetUrl, authToken: env.TURSO_PREVIEW_GROUP_TOKEN });
    await copyDatabase({ source, target, config: anonymizeConfig, hashKey: env.ANON_HASH_KEY });
    source.close();
    target.close();
    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "anonymize failed"}\n`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await runAnonymize(process.env));
}
