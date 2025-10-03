import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

// Minimal config to run only the orchestrator chat e2e and start the dev server
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/orchestrator-chat.e2e.spec.ts',

  timeout: 120_000,
  expect: { timeout: 15_000 },

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report/orchestrator' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1366, height: 900 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  outputDir: 'test-results/orchestrator',
})

