import { scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";

import { createClient, type Client } from "@libsql/client";
import { copycat } from "@snaplet/copycat";
import { expect, it } from "vite-plus/test";

import { anonymizeConfig, fakeEmail } from "../anonymize.config.ts";
import { copyDatabase } from "../src/anonymize/copy.ts";
import { hashPreviewPassword } from "../src/anonymize/preview-password.ts";
import type { AnonymizeConfig } from "../src/anonymize/types.ts";

const HASH_KEY = "test-hash-key";
const TEST_PREVIEW_PASSWORD = "test-only-secret";

function textCell(value: unknown): string {
  if (typeof value === "string") return value;
  throw new Error("Expected a text cell");
}

function memory(): Client {
  return createClient({ url: ":memory:" });
}

async function applyAuthSchema(db: Client): Promise<void> {
  const sql = readFileSync(new URL("../drizzle/0000_auth.sql", import.meta.url), "utf8");
  for (const part of sql.split("--> statement-breakpoint")) {
    const statement = part.trim();
    if (statement) await db.execute(statement);
  }
}

async function seedAuth(db: Client): Promise<void> {
  await db.execute("PRAGMA foreign_keys = ON");
  await db.execute({
    sql: "INSERT INTO users (id, name, email, email_verified, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)",
    args: [
      "user_ada",
      "Ada Lovelace",
      "ada.lovelace@example.com",
      1,
      "https://example.com/ada.png",
      1_700_000_000,
      1_700_000_000,
      "user_alan",
      "Alan Turing",
      "alan.turing@example.com",
      0,
      null,
      1_700_000_100,
      1_700_000_100,
    ],
  });
  await db.execute({
    sql: "INSERT INTO sessions (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      "sess_ada",
      1_800_000_000,
      "session-token-original-ada",
      1_700_000_000,
      1_700_000_000,
      "203.0.113.10",
      "SecretAgent/1.0",
      "user_ada",
    ],
  });
  await db.execute({
    sql: "INSERT INTO verifications (id, identifier, value, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [
      "ver_ada",
      "ada.lovelace@example.com",
      "verification-code-original",
      1_800_000_000,
      1_700_000_000,
      1_700_000_000,
    ],
  });
  await db.execute({
    sql: `INSERT INTO accounts (
      id, account_id, provider_id, user_id, access_token, refresh_token, id_token, scope, password, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "acc_ada",
      "ada-provider-account",
      "credential",
      "user_ada",
      "access-token-original",
      "refresh-token-original",
      "id-token-original",
      "email profile",
      "real-password-not-for-preview",
      1_700_000_000,
      1_700_000_000,
    ],
  });
}

const ORIGINALS = [
  "Ada Lovelace",
  "Alan Turing",
  "ada.lovelace@example.com",
  "alan.turing@example.com",
  "https://example.com/ada.png",
  "session-token-original-ada",
  "verification-code-original",
  "ada-provider-account",
  "access-token-original",
  "refresh-token-original",
  "id-token-original",
  "real-password-not-for-preview",
  "203.0.113.10",
  "SecretAgent/1.0",
];

it("fails when a table or column is unclassified", async () => {
  const source = memory();
  const target = memory();
  await source.execute("CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL)");
  const missingColumn: AnonymizeConfig = {
    users: { op: "columns", columns: { id: { op: "keep" }, nickname: { op: "null" } } },
  };
  await expect(
    copyDatabase({ source, target, config: missingColumn, hashKey: HASH_KEY }),
  ).rejects.toThrow("Unclassified columns on users: missing email; unknown nickname");

  await source.execute("CREATE TABLE notes (id TEXT PRIMARY KEY, body TEXT)");
  const missingTable: AnonymizeConfig = {
    users: { op: "columns", columns: { id: { op: "keep" }, email: { op: "keep" } } },
  };
  await expect(
    copyDatabase({ source, target, config: missingTable, hashKey: HASH_KEY }),
  ).rejects.toThrow("Unclassified table: notes");
});

it("anonymizes auth rows in memory and keeps no original fake value", async () => {
  const source = memory();
  const target = memory();
  const again = memory();
  await applyAuthSchema(source);
  await applyAuthSchema(target);
  await applyAuthSchema(again);
  await seedAuth(source);

  const previewHash = hashPreviewPassword(TEST_PREVIEW_PASSWORD);
  const config = anonymizeConfig(previewHash);
  const lines: string[] = [];
  const originalLog = console.log;
  console.log = (message?: unknown) => {
    lines.push(String(message));
  };
  try {
    await copyDatabase({ source, target, config, hashKey: HASH_KEY });
    await copyDatabase({ source, target: again, config, hashKey: HASH_KEY });
  } finally {
    console.log = originalLog;
  }

  const logged = lines.join("\n");
  for (const original of ORIGINALS) expect(logged).not.toContain(original);

  const users = await target.execute("SELECT id, name, email, image FROM users ORDER BY id");
  expect(users.rows.map((row) => row.id)).toEqual(["user_ada", "user_alan"]);
  const emails = users.rows.map((row) => textCell(row.email));
  const names = users.rows.map((row) => textCell(row.name));
  expect(new Set(emails).size).toBe(2);
  expect(emails.every((email) => email.endsWith(".invalid"))).toBe(true);
  expect(emails).not.toContain("ada.lovelace@example.com");
  expect(emails).not.toContain("alan.turing@example.com");
  expect(names).not.toContain("Ada Lovelace");
  expect(names).not.toContain("Alan Turing");
  expect(users.rows.every((row) => row.image == null)).toBe(true);

  const repeated = await again.execute("SELECT email FROM users ORDER BY id");
  expect(repeated.rows.map((row) => row.email)).toEqual(emails);

  expect((await target.execute("SELECT COUNT(*) AS count FROM sessions")).rows[0]?.count).toBe(0);
  expect((await target.execute("SELECT COUNT(*) AS count FROM verifications")).rows[0]?.count).toBe(
    0,
  );

  const accounts = await target.execute(
    "SELECT user_id, account_id, provider_id, access_token, refresh_token, id_token, password FROM accounts",
  );
  expect(accounts.rows).toHaveLength(1);
  const account = accounts.rows[0];
  expect(account?.user_id).toBe("user_ada");
  expect(account?.provider_id).toBe("credential");
  expect(account?.account_id).not.toBe("ada-provider-account");
  expect(account?.access_token).toBeNull();
  expect(account?.refresh_token).toBeNull();
  expect(account?.id_token).toBeNull();
  expect(account?.password).toBe(previewHash);
  expect(account?.password).not.toBe("real-password-not-for-preview");
  if (typeof account?.password !== "string") throw new Error("Expected a password hash");
  expect(account.password).not.toContain(TEST_PREVIEW_PASSWORD);

  const violations = await target.execute("PRAGMA foreign_key_check");
  expect(violations.rows).toHaveLength(0);

  const dumped = [
    users.rows,
    accounts.rows,
    (await target.execute("SELECT * FROM sessions")).rows,
    (await target.execute("SELECT * FROM verifications")).rows,
  ];
  const stored = JSON.stringify(dumped);
  for (const original of ORIGINALS) expect(stored).not.toContain(original);
});

it("requires the copycat hash key before reading rows", async () => {
  const source = memory();
  const target = memory();
  await source.execute("CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT)");
  await source.execute(
    "INSERT INTO users (id, email) VALUES ('user_ada', 'ada.lovelace@example.com')",
  );

  await expect(
    copyDatabase({ source, target, config: { users: { op: "truncate" } }, hashKey: undefined }),
  ).rejects.toThrow("ANON_HASH_KEY is required.");
  expect(
    (await target.execute("SELECT COUNT(*) AS count FROM sqlite_master WHERE name = 'users'"))
      .rows[0]?.count,
  ).toBe(0);
});

it("replaces random-bytes without keeping the original", async () => {
  const source = memory();
  const target = memory();
  await source.execute("CREATE TABLE secrets (id TEXT PRIMARY KEY, secret TEXT NOT NULL)");
  await target.execute("CREATE TABLE secrets (id TEXT PRIMARY KEY, secret TEXT NOT NULL)");
  await source.execute({
    sql: "INSERT INTO secrets (id, secret) VALUES (?, ?), (?, ?)",
    args: ["a", "original-secret-a", "b", "original-secret-b"],
  });
  const config: AnonymizeConfig = {
    secrets: {
      op: "columns",
      columns: {
        id: { op: "keep" },
        secret: { op: "random-bytes" },
      },
    },
  };

  await copyDatabase({ source, target, config, hashKey: HASH_KEY });
  const rows = await target.execute("SELECT secret FROM secrets ORDER BY id");
  const secrets = rows.rows.map((row) => textCell(row.secret));
  expect(secrets).not.toContain("original-secret-a");
  expect(secrets).not.toContain("original-secret-b");
  expect(new Set(secrets).size).toBe(2);
});

it("keeps fake emails deterministic, unique, and on the .invalid domain", () => {
  copycat.setHashKey(HASH_KEY);
  const ada = fakeEmail("ada.lovelace@example.com");
  const alan = fakeEmail("alan.turing@example.com");
  expect(ada.endsWith(".invalid")).toBe(true);
  expect(alan.endsWith(".invalid")).toBe(true);
  expect(ada).not.toBe(alan);
  expect(ada).not.toBe("ada.lovelace@example.com");
  expect(alan).not.toBe("alan.turing@example.com");
  expect(fakeEmail("ada.lovelace@example.com")).toBe(ada);
});

it("derives the preview password hash from the secret", () => {
  const first = hashPreviewPassword(TEST_PREVIEW_PASSWORD);
  const second = hashPreviewPassword(TEST_PREVIEW_PASSWORD);
  expect(first).not.toBe(second);
  expect(first).not.toContain(TEST_PREVIEW_PASSWORD);
  for (const hash of [first, second]) {
    const [salt, key] = hash.split(":");
    expect(salt).toHaveLength(32);
    expect(key).toHaveLength(128);
    const derived = scryptSync(TEST_PREVIEW_PASSWORD.normalize("NFKC"), salt ?? "", 64, {
      N: 16384,
      r: 16,
      p: 1,
      maxmem: 128 * 16384 * 16 * 2,
    });
    expect(derived.toString("hex")).toBe(key);
  }
  expect(() => hashPreviewPassword("")).toThrow("PREVIEW_PASSWORD is required.");
});
