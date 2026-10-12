import { defineConfig, devices } from "@playwright/test";

// End-to-end journeys (PRD §14 UAT-01…UAT-26 + §0.B.2 V04-01…V04-10).
// Requires a running app + seeded local stack:
//   pnpm db:start && pnpm db:reset && pnpm db:seed:test && pnpm test:e2e
// CI runs these against the same local stack (see .github/workflows/ci.yml).
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev --port 3000",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120000,
        env: {
          E2E_MODE: "1",
        },
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
