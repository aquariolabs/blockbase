import type { AnonymizeConfig, ColumnInfo, ColumnRule } from "./types.ts";

const INFRASTRUCTURE_TABLES = new Set([
  "__drizzle_migrations",
  "_drizzle_migrations",
  "libsql_wasm_func_table",
]);

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isApplicationTable(name: string): boolean {
  return !name.startsWith("sqlite_") && !INFRASTRUCTURE_TABLES.has(name);
}

export function quoteIdent(name: string): string {
  if (!IDENTIFIER.test(name)) throw new Error(`Unsafe SQL identifier: ${name}`);
  return `"${name}"`;
}

export function assertConfiguredTablesExist(
  config: AnonymizeConfig,
  tables: readonly string[],
): void {
  const present = new Set(tables);
  for (const table of Object.keys(config)) {
    if (!present.has(table)) throw new Error(`Configured table is not in the database: ${table}`);
  }
}

export function assertClassified(
  table: string,
  columns: readonly ColumnInfo[],
  config: AnonymizeConfig,
): void {
  const rule = config[table];
  if (!rule) throw new Error(`Unclassified table: ${table}`);
  if (rule.op === "truncate") return;

  const known = new Set(columns.map((column) => column.name));
  const missing = columns.flatMap((column) => (rule.columns[column.name] ? [] : [column.name]));
  const unknown = Object.keys(rule.columns).filter((name) => !known.has(name));
  if (missing.length === 0 && unknown.length === 0) return;

  const parts: string[] = [];
  if (missing.length > 0) parts.push(`missing ${missing.join(", ")}`);
  if (unknown.length > 0) parts.push(`unknown ${unknown.join(", ")}`);
  throw new Error(`Unclassified columns on ${table}: ${parts.join("; ")}`);
}

export function columnRule(table: string, column: string, config: AnonymizeConfig): ColumnRule {
  const rule = config[table];
  if (!rule || rule.op !== "columns") throw new Error(`Unclassified table: ${table}`);
  const columnConfig = rule.columns[column];
  if (!columnConfig) throw new Error(`Unclassified columns on ${table}: missing ${column}`);
  return columnConfig;
}
