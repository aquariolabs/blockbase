import type { Client, InValue } from "@libsql/client";
import { copycat } from "@snaplet/copycat";

import {
  assertClassified,
  assertConfiguredTablesExist,
  columnRule,
  isApplicationTable,
  quoteIdent,
} from "./classify.ts";
import type { AnonymizeConfig, ColumnInfo } from "./types.ts";
import { asInValue, transformValue } from "./values.ts";

type Queryable = Pick<Client, "execute">;

const PAGE = 200;

export function assertReadStatement(sql: string): void {
  const normalized = sql.trim().toLowerCase();
  if (
    normalized.startsWith("select") ||
    normalized.startsWith("pragma") ||
    normalized.startsWith("with")
  )
    return;
  throw new Error("Refusing to write to the source database.");
}

function readOnly(source: Queryable): Queryable {
  return {
    execute: (statement) => {
      const sql = typeof statement === "string" ? statement : statement.sql;
      assertReadStatement(sql);
      return source.execute(statement);
    },
  };
}

async function applicationTables(source: Queryable): Promise<string[]> {
  const result = await source.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  const names: string[] = [];
  for (const row of result.rows) {
    const name = row.name;
    if (typeof name === "string" && isApplicationTable(name)) names.push(name);
  }
  return names;
}

async function tableColumns(source: Queryable, table: string): Promise<ColumnInfo[]> {
  const result = await source.execute(`PRAGMA table_info(${quoteIdent(table)})`);
  const columns: ColumnInfo[] = [];
  for (const row of result.rows) {
    if (typeof row.name !== "string")
      throw new Error(`PRAGMA table_info returned an unnamed column for ${table}.`);
    columns.push({ name: row.name, notNull: Number(row.notnull) === 1 });
  }
  return columns;
}

async function copyOrder(source: Queryable, tables: readonly string[]): Promise<string[]> {
  const pending = new Set(tables);
  const parents = new Map<string, Set<string>>();
  for (const table of tables) {
    const result = await source.execute(`PRAGMA foreign_key_list(${quoteIdent(table)})`);
    const set = new Set<string>();
    for (const row of result.rows) {
      if (typeof row.table === "string" && row.table !== table && pending.has(row.table))
        set.add(row.table);
    }
    parents.set(table, set);
  }

  const ordered: string[] = [];
  while (pending.size > 0) {
    const ready = [...pending]
      .filter((table) => [...(parents.get(table) ?? [])].every((parent) => !pending.has(parent)))
      .sort();
    if (ready.length === 0) throw new Error("Foreign key cycle between application tables.");
    for (const table of ready) {
      ordered.push(table);
      pending.delete(table);
    }
  }
  return ordered;
}

function rowidOf(row: Record<string, unknown>, table: string): InValue {
  const rowid = row._anon_rowid;
  if (typeof rowid === "number" || typeof rowid === "bigint") return rowid;
  throw new Error(`Missing rowid while copying ${table}.`);
}

async function insertPage(
  source: Queryable,
  target: Queryable,
  table: string,
  columns: readonly ColumnInfo[],
  config: AnonymizeConfig,
  after: InValue,
): Promise<{ written: number; next: InValue; done: boolean }> {
  const page = await source.execute({
    sql: `SELECT rowid AS _anon_rowid, * FROM ${quoteIdent(table)} WHERE rowid > ? ORDER BY rowid LIMIT ${PAGE}`,
    args: [after],
  });
  if (page.rows.length === 0) return { written: 0, next: after, done: true };

  const names = columns.map((column) => quoteIdent(column.name)).join(", ");
  const marks = columns.map(() => "?").join(", ");
  let next = after;
  for (const row of page.rows) {
    next = rowidOf(row, table);
    const args = columns.map((column) => {
      const rule = columnRule(table, column.name, config);
      return asInValue(transformValue(row[column.name], rule, `${table}.${column.name}`, column));
    });
    await target.execute({
      sql: `INSERT INTO ${quoteIdent(table)} (${names}) VALUES (${marks})`,
      args,
    });
  }
  return { written: page.rows.length, next, done: false };
}

async function copyTable(
  source: Queryable,
  target: Queryable,
  table: string,
  config: AnonymizeConfig,
): Promise<number> {
  const rule = config[table];
  if (!rule) throw new Error(`Unclassified table: ${table}`);
  if (rule.op === "truncate") return 0;

  const columns = await tableColumns(source, table);
  assertClassified(table, columns, config);
  let written = 0;
  let after: InValue = 0;
  for (;;) {
    const page = await insertPage(source, target, table, columns, config, after);
    written += page.written;
    after = page.next;
    if (page.done) return written;
  }
}

async function foreignKeyViolations(target: Queryable): Promise<number> {
  const result = await target.execute("PRAGMA foreign_key_check");
  return result.rows.length;
}

export async function copyDatabase(input: {
  source: Queryable;
  target: Queryable;
  config: AnonymizeConfig;
  hashKey: string | undefined;
}): Promise<void> {
  if (!input.hashKey) throw new Error("ANON_HASH_KEY is required.");
  copycat.setHashKey(input.hashKey);

  const source = readOnly(input.source);
  const tables = await applicationTables(source);
  assertConfiguredTablesExist(input.config, tables);
  for (const table of tables) {
    assertClassified(table, await tableColumns(source, table), input.config);
  }

  const ordered = await copyOrder(source, tables);
  await input.target.execute("PRAGMA foreign_keys = ON");
  await input.target.execute("BEGIN");
  try {
    for (const table of ordered) {
      const written = await copyTable(source, input.target, table, input.config);
      console.log(`${table} ${written}`);
    }
    const violations = await foreignKeyViolations(input.target);
    if (violations > 0) throw new Error(`Foreign key check failed: ${violations}`);
    await input.target.execute("COMMIT");
  } catch (error) {
    await input.target.execute("ROLLBACK");
    throw error;
  }
}
