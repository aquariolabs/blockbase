import { randomBytes, scryptSync } from "node:crypto";

const SCRYPT = { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 } as const;

export function hashPreviewPassword(password: string): string {
  if (password.length === 0) throw new Error("PREVIEW_PASSWORD is required.");
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, SCRYPT);
  return `${salt}:${key.toString("hex")}`;
}
