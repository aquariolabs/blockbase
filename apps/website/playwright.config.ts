import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    headless: !!process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // CI tests the built Worker; `astro dev` flakes while Vite optimizes deps.
    command: process.env.CI
      ? "vp run build && wrangler dev --ip 127.0.0.1 --port 4321"
      : "varlock run -- astro dev",
    stdout: "pipe",
    port: 4321,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      VARLOCK_ENV: "test",
    },
  },
});
