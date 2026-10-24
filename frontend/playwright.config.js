/* eslint-env node */
import { defineConfig, devices } from "@playwright/test";

// End-to-end tests for the storefront (5173) and admin portal (5174).
// The backend runs with MONGODB_URI and SMTP unset, so it uses the local JSON store
// and never touches a real database or sends email. Tests that place orders or send
// enquiries write to backend/src/data/*.json; review or discard those changes afterwards.
const noExternalServices = { MONGODB_URI: "", SMTP_HOST: "", SMTP_USER: "", SMTP_PASS: "" };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    // Uses the locally installed Chrome so no browser download is needed.
    channel: process.env.PW_CHANNEL || "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: "node src/server.js",
      cwd: "../backend",
      url: "http://localhost:5000/api/health",
      reuseExistingServer: true,
      env: noExternalServices,
    },
    {
      command: "npx vite --port 5173",
      url: "http://localhost:5173",
      reuseExistingServer: true,
    },
    {
      command: "npx vite --config vite.admin.config.js --port 5174",
      url: "http://localhost:5174",
      reuseExistingServer: true,
    },
  ],
});
