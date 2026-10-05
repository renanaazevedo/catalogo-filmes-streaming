import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${APP_PORT}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/mock-tmdb/server.mjs",
      port: 4010,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build && npm run start -- -p ${APP_PORT}`,
      port: APP_PORT,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      env: { TMDB_BASE_URL: "http://localhost:4010/3", TMDB_API_TOKEN: "e2e-token" },
    },
  ],
});
