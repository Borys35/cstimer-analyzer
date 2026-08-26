import { defineConfig } from "@playwright/test";

const smoke = Boolean(process.env.SMOKE_TARGET);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 150_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: smoke ? process.env.SMOKE_URL : "http://localhost:3117",
    viewport: { width: 1280, height: 900 },
  },
  webServer: smoke
    ? undefined
    : {
        command: "npx next start -p 3117",
        port: 3117,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
