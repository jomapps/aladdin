/**
 * Playwright Configuration for Evaluation Flow Tests
 *
 * Specialized config for testing department evaluation workflow
 * with extended timeouts for long-running AI evaluations
 */

import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: '.',
  testMatch: '**/evaluation-flow.spec.ts',

  // Extended timeouts for evaluation workflow
  timeout: 180000, // 3 minutes per test (evaluations can take 30-120 seconds)
  expect: { timeout: 15000 }, // 15 seconds for assertions

  // Fail fast on CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests
  retries: process.env.CI ? 2 : 1,

  // Run tests sequentially (evaluations are resource-intensive)
  workers: 1,
  fullyParallel: false,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report/evaluation' }],
    ['json', { outputFile: 'test-results/evaluation-results.json' }],
    ['list'],
  ],

  // Global test settings
  use: {
    // Base URL
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    // Browser settings
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1920, height: 1080 },

    // Extended timeouts for evaluation workflow
    actionTimeout: 30000, // 30 seconds for actions
    navigationTimeout: 60000, // 60 seconds for navigation

    // Capture settings
    screenshot: 'on', // Always capture screenshots for evaluation tests
    video: 'on', // Always record video for evaluation tests
    trace: 'on', // Always capture trace for evaluation tests

    // Context options
    ignoreHTTPSErrors: true,

    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  // Test projects
  projects: [
    {
      name: 'chromium-evaluation',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  // Web server configuration (optional - uncomment if you want auto-start)
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
})
