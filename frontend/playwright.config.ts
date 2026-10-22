import { defineConfig } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${port}`;

/**
 * Run `npm run build` first; the tests drive the production server (`npm run start`).
 *   npm run e2e    smoke tests at 375px and 1440px
 *   npm run a11y   axe + structure audit of every route at 375, 1024 and 1440px
 * Set PW_CHANNEL=chrome to use an installed Chrome instead of the downloaded Chromium.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    channel: process.env.PW_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run start -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "mobile-375", testMatch: /smoke\.spec\.ts/, use: { viewport: { width: 375, height: 812 } } },
    { name: "desktop-1440", testMatch: /smoke\.spec\.ts/, use: { viewport: { width: 1440, height: 900 } } },
    { name: "http-client", testMatch: /http-client\.spec\.ts/ },
    { name: "a11y", testMatch: /a11y\.spec\.ts/, timeout: 60_000 },
  ],
});
