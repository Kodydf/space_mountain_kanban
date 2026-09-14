import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // The DB is wiped before a fresh container starts so each cold-start
    // test run begins from known seed data (board state is now a real,
    // persistent database, not fresh in-memory state per page load).
    command: "rm -f ../backend/data/kanban.db && bash ../scripts/start.sh && docker logs -f space-mountain-kanban",
    url: "http://localhost:8000",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
