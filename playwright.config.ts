import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Blog
 * Isolated to prevent picking up test files from other repos in workspace
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Ignore API errors from build issues
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
