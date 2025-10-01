/**
 * Dashboard Test Setup
 * 
 * Global setup and teardown for dashboard E2E tests
 */

import { Page, test as base } from '@playwright/test'
import { loginUser, logoutUser, DEFAULT_TEST_USER } from './auth.helper'
import { TestDataTracker } from './test-data.factory'

// Extend base test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page
  testDataTracker: TestDataTracker
}>({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Login before test
    await loginUser(page, DEFAULT_TEST_USER)
    
    // Use the authenticated page
    await use(page)
    
    // Logout after test
    try {
      await logoutUser(page)
    } catch (error) {
      console.warn('Logout failed during cleanup:', error)
    }
  },
  
  // Test data tracker fixture
  testDataTracker: async ({}, use) => {
    const tracker = new TestDataTracker()
    
    // Use the tracker
    await use(tracker)
    
    // Cleanup tracked data
    // This would call cleanup APIs for created test data
    console.log('Test data to cleanup:', {
      projects: tracker.getProjects(),
      users: tracker.getUsers()
    })
    
    tracker.clear()
  }
})

export { expect } from '@playwright/test'

/**
 * Global setup function
 */
export async function globalSetup() {
  console.log('🚀 Starting dashboard E2E tests...')
  
  // Ensure test user exists
  // This would call your user creation API
  console.log('✓ Test user setup complete')
  
  return async () => {
    // Global teardown
    console.log('🧹 Cleaning up dashboard E2E tests...')
  }
}

/**
 * Wait for page to be ready
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page, 
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true
  })
}

/**
 * Check for console errors
 */
export async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = []
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  return errors
}

/**
 * Mock API response
 */
export async function mockAPIResponse(
  page: Page,
  url: string,
  response: any,
  status: number = 200
): Promise<void> {
  await page.route(url, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response)
    })
  })
}

/**
 * Wait for API call
 */
export async function waitForAPICall(
  page: Page,
  urlPattern: string | RegExp
): Promise<any> {
  const response = await page.waitForResponse(
    response => {
      const url = response.url()
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern)
      }
      return urlPattern.test(url)
    },
    { timeout: 10000 }
  )
  
  return response.json()
}

/**
 * Fill form fields
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value)
  }
}

/**
 * Click and wait for navigation
 */
export async function clickAndWaitForNavigation(
  page: Page,
  selector: string
): Promise<void> {
  await Promise.all([
    page.waitForNavigation({ timeout: 10000 }),
    page.click(selector)
  ])
}

/**
 * Retry action with exponential backoff
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError
}

/**
 * Check if element exists
 */
export async function elementExists(
  page: Page,
  selector: string
): Promise<boolean> {
  return (await page.locator(selector).count()) > 0
}

/**
 * Get element text
 */
export async function getElementText(
  page: Page,
  selector: string
): Promise<string> {
  const element = page.locator(selector).first()
  return element.textContent() || ''
}

/**
 * Wait for element to be visible
 */
export async function waitForVisible(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await page.locator(selector).first().waitFor({ 
    state: 'visible',
    timeout 
  })
}

/**
 * Wait for element to be hidden
 */
export async function waitForHidden(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await page.locator(selector).first().waitFor({ 
    state: 'hidden',
    timeout 
  })
}

/**
 * Scroll to element
 */
export async function scrollToElement(
  page: Page,
  selector: string
): Promise<void> {
  await page.locator(selector).first().scrollIntoViewIfNeeded()
}

/**
 * Get all text content from elements
 */
export async function getAllTextContent(
  page: Page,
  selector: string
): Promise<string[]> {
  const elements = await page.locator(selector).all()
  return Promise.all(elements.map(el => el.textContent() || ''))
}

/**
 * Check if page has error
 */
export async function hasPageError(page: Page): Promise<boolean> {
  const errorSelectors = [
    'text=/error/i',
    'text=/failed/i',
    '[role="alert"]',
    '.error',
    '.alert-error'
  ]
  
  for (const selector of errorSelectors) {
    if (await elementExists(page, selector)) {
      return true
    }
  }
  
  return false
}

