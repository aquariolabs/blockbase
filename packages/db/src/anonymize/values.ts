import type { InValue } from "@libsql/client";
import { copycat } from "@snaplet/copycat";

import type { ColumnInfo, ColumnRule } from "./types.ts";

export function textSeed(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Uint8Array) return Buffer.from(value).toString("base64");
  return "";
}

function deterministicHex(value: unknown, column: string): string {
  const seed = `${column}:${textSeed(value)}`;
  let hex = "";
  for (let index = 0; hex.length < 64; index += 1) {
    hex += String(copycat.hex(`${seed}:${index}`));
  }
  return hex.slice(0, 64);
}

export function transformValue(
  value: unknown,
  rule: ColumnRule,
  label: string,
  column: ColumnInfo,
): unknown {
  if (rule.op === "keep") return value ?? null;
  if (rule.op === "null" || rule.op === "truncate") {
    if (column.notNull) throw new Error(`Column ${label} cannot use ${rule.op}.`);
    return null;
  }
  if (rule.op === "random-bytes") return deterministicHex(value, label);
  return rule.fake(value);
}

export function asInValue(value: unknown): InValue {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint")
    return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Uint8Array) return value;
  if (value instanceof Date) return value.getTime();
  throw new Error("Unsupported anonymized value.");
}
