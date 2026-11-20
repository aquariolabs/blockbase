import { assertNotProduction, createDatabaseBody } from "./names.ts";

const API = "https://api.turso.tech/v1";

type FetchLike = typeof fetch;

export function databaseHostname(payload: unknown): string {
  if (payload == null || typeof payload !== "object" || !("database" in payload)) {
    throw new Error("Turso API response is missing the database hostname.");
  }
  const database = payload.database;
  if (database == null || typeof database !== "object") {
    throw new Error("Turso API response is missing the database hostname.");
  }
  const hostname =
    "Hostname" in database
      ? database.Hostname
      : "hostname" in database
        ? database.hostname
        : undefined;
  if (typeof hostname !== "string" || !/^[a-zA-Z0-9.-]+$/.test(hostname)) {
    throw new Error("Turso API response is missing the database hostname.");
  }
  return hostname;
}

export function libsqlUrl(hostname: string): string {
  return `libsql://${hostname}`;
}

async function turso(
  fetchImpl: FetchLike,
  input: { organization: string; token: string; path: string; method: string; body?: unknown },
): Promise<{ status: number; payload: unknown }> {
  const response = await fetchImpl(
    `${API}/organizations/${encodeURIComponent(input.organization)}${input.path}`,
    {
      method: input.method,
      headers: {
        Authorization: `Bearer ${input.token}`,
        "content-type": "application/json",
      },
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
    },
  );
  if (response.status === 404 || response.status === 204)
    return { status: response.status, payload: null };
  const text = await response.text();
  if (!response.ok)
    throw new Error(`Turso API ${response.status} for ${input.method} ${input.path}.`);
  if (!text) return { status: response.status, payload: null };
  try {
    return { status: response.status, payload: JSON.parse(text) as unknown };
  } catch {
    throw new Error(`Turso API ${response.status} for ${input.method} ${input.path} was not JSON.`);
  }
}

export async function lookupHostname(input: {
  fetch: FetchLike;
  organization: string;
  token: string;
  name: string;
}): Promise<string | null> {
  const result = await turso(input.fetch, {
    organization: input.organization,
    token: input.token,
    path: `/databases/${encodeURIComponent(input.name)}`,
    method: "GET",
  });
  if (result.status === 404) return null;
  return databaseHostname(result.payload);
}

export async function deleteDatabase(input: {
  fetch: FetchLike;
  organization: string;
  token: string;
  name: string;
}): Promise<void> {
  assertNotProduction(input.name);
  const result = await turso(input.fetch, {
    organization: input.organization,
    token: input.token,
    path: `/databases/${encodeURIComponent(input.name)}`,
    method: "DELETE",
  });
  if (result.status === 200 || result.status === 404) return;
  throw new Error(`Turso API ${result.status} for DELETE /databases/${input.name}.`);
}

export async function createEmptyOrSeededDatabase(input: {
  fetch: FetchLike;
  organization: string;
  token: string;
  name: string;
  group: string;
  seed: string | null;
}): Promise<string> {
  const body = createDatabaseBody({ name: input.name, group: input.group, seed: input.seed });
  const result = await turso(input.fetch, {
    organization: input.organization,
    token: input.token,
    path: "/databases",
    method: "POST",
    body,
  });
  return databaseHostname(result.payload);
}
