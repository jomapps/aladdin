/**
 * Playwright Configuration for Dashboard Tests
 * 
 * Specialized configuration for comprehensive dashboard testing
 */

import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/dashboard-comprehensive.spec.ts',
  
  // Test execution settings
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },
  
  // Fail fast on CI
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 1,
  
  // Parallel execution
  workers: process.env.CI ? 2 : undefined,
  fullyParallel: false, // Run tests in sequence for dashboard tests
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report/dashboard' }],
    ['json', { outputFile: 'test-results/dashboard-results.json' }],
    ['list']
  ],
  
  // Global test settings
  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Browser settings
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1280, height: 720 },
    
    // Interaction settings
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Capture settings
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Context options
    ignoreHTTPSErrors: true,
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },
  
  // Test projects for different browsers and devices
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Tablet
    {
      name: 'tablet',
      use: { 
        ...devices['iPad Pro'],
      },
    },
    
    // Mobile
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 13'],
      },
    },
  ],
  
  // Web server configuration
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  // Output directories
  outputDir: 'test-results/dashboard',
})

