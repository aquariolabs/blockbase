import { expect, it } from "vite-plus/test";

import { configState } from "../src/config-state.ts";
import {
  createEmptyOrSeededDatabase,
  databaseHostname,
  deleteDatabase,
} from "../src/preview/api.ts";
import {
  createDatabaseBody,
  previewDatabaseName,
  productionDatabaseExitCode,
  seedSource,
  snapshotDatabaseName,
} from "../src/preview/names.ts";
import { runProvision } from "../src/preview/provision-cli.ts";

it("returns exit code 1 when the seed source ends with -production", () => {
  expect(productionDatabaseExitCode("app-production")).toBe(1);
  expect(productionDatabaseExitCode("app-anon-snapshot")).toBe(0);
  expect(() => seedSource("app-production", true)).toThrow(
    "Refusing to seed preview data from app-production.",
  );
  expect(() => seedSource("app-production", false)).toThrow(
    "Refusing to seed preview data from app-production.",
  );
  expect(() =>
    createDatabaseBody({ name: "app-pr-1", group: "app", seed: "app-production" }),
  ).toThrow("Refusing to seed preview data from app-production.");
});

it("seeds the anonymized snapshot and never production when the snapshot is missing", () => {
  expect(snapshotDatabaseName("app")).toBe("app-anon-snapshot");
  expect(previewDatabaseName("app", "12")).toBe("app-pr-12");
  expect(seedSource("app-anon-snapshot", false)).toBeNull();
  expect(seedSource("app-anon-snapshot", true)).toBe("app-anon-snapshot");
  expect(createDatabaseBody({ name: "app-pr-12", group: "app", seed: null })).toEqual({
    name: "app-pr-12",
    group: "app",
  });
  expect(
    createDatabaseBody({ name: "app-pr-12", group: "app", seed: "app-anon-snapshot" }),
  ).toEqual({
    name: "app-pr-12",
    group: "app",
    seed: { type: "database", name: "app-anon-snapshot" },
  });
  expect(
    JSON.stringify(createDatabaseBody({ name: "app-pr-12", group: "app", seed: null })),
  ).not.toContain("production");
});

it("does not send a production seed or delete a production database", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error("Turso was called");
  };
  await expect(
    createEmptyOrSeededDatabase({
      fetch: fetchImpl,
      organization: "example",
      token: "preview-token",
      name: "app-pr-1",
      group: "app",
      seed: "app-production",
    }),
  ).rejects.toThrow("Refusing to seed preview data from app-production.");
  await expect(
    deleteDatabase({
      fetch: fetchImpl,
      organization: "example",
      token: "preview-token",
      name: "app-production",
    }),
  ).rejects.toThrow("Refusing to seed preview data from app-production.");
});

it("creates an empty preview database when the snapshot does not exist", async () => {
  const bodies: unknown[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    if (typeof input !== "string") throw new Error("Expected a URL string");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer preview-api-token");
    if (init?.method === "POST") {
      if (typeof init.body !== "string") throw new Error("Expected a JSON request body");
      bodies.push(JSON.parse(init.body) as unknown);
      return Response.json({ database: { Hostname: "app-pr-4.example.turso.io" } });
    }
    expect(input).not.toContain("production");
    return new Response("", { status: 404 });
  };

  const status = await runProvision(
    {
      TURSO_ORGANIZATION_SLUG: "example",
      TURSO_PREVIEW_GROUP_NAME: "app",
      TURSO_PREVIEW_API_TOKEN: "preview-api-token",
      TURSO_PREVIEW_DB_TOKEN: "preview-db-token",
      PR_NUMBER: "4",
    },
    fetchImpl,
  );

  expect(status).toBe(0);
  expect(bodies).toEqual([{ name: "app-pr-4", group: "app" }]);
  expect(databaseHostname({ database: { Hostname: "app-pr-4.example.turso.io" } })).toBe(
    "app-pr-4.example.turso.io",
  );
});

it("seeds the anonymized snapshot when it already exists", async () => {
  const bodies: unknown[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    if (typeof input !== "string") throw new Error("Expected a URL string");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer preview-api-token");
    if (init?.method === "POST") {
      if (typeof init.body !== "string") throw new Error("Expected a JSON request body");
      bodies.push(JSON.parse(init.body) as unknown);
      return Response.json({ database: { Hostname: "app-pr-4.example.turso.io" } });
    }
    if (input.endsWith("/app-anon-snapshot")) {
      return Response.json({ database: { Hostname: "app-anon-snapshot.example.turso.io" } });
    }
    return new Response("", { status: 404 });
  };

  const status = await runProvision(
    {
      TURSO_ORGANIZATION_SLUG: "example",
      TURSO_PREVIEW_GROUP_NAME: "app",
      TURSO_PREVIEW_API_TOKEN: "preview-api-token",
      TURSO_PREVIEW_DB_TOKEN: "preview-db-token",
      PR_NUMBER: "4",
    },
    fetchImpl,
  );

  expect(status).toBe(0);
  expect(bodies).toEqual([
    {
      name: "app-pr-4",
      group: "app",
      seed: { type: "database", name: "app-anon-snapshot" },
    },
  ]);
});

it("stays off when no preview variables are configured", async () => {
  expect(
    configState(
      ["TURSO_ORGANIZATION_SLUG", "TURSO_PREVIEW_GROUP_NAME", "TURSO_PREVIEW_API_TOKEN"],
      {},
    ),
  ).toBe("off");
  expect(await runProvision({})).toBe(0);
  expect(await runProvision({ TURSO_ORGANIZATION_SLUG: "example" })).toBe(1);
  expect(() =>
    configState(["TURSO_ORGANIZATION_SLUG", "TURSO_PREVIEW_GROUP_NAME"], {
      TURSO_ORGANIZATION_SLUG: "example",
    }),
  ).toThrow(/Incomplete configuration/);
});
