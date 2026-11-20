import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:local.db";
const remote = url.startsWith("libsql:");

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: remote ? "turso" : "sqlite",
  casing: "snake_case",
  dbCredentials: {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
