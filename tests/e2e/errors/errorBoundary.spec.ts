import { test, expect } from '@playwright/test'

/**
 * @test Error Boundary E2E Tests
 * @description Tests for React error boundary UI component
 * @coverage Error display, error reporting, reset functionality
 */

test.describe('Error Boundary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  // Test 1: Error Boundary Rendering
  test('should render error boundary when component throws', async ({ page }) => {
    // Trigger an error (implementation-specific)
    await page.evaluate(() => {
      const errorEvent = new CustomEvent('react-error', {
        detail: { message: 'Test error' }
      })
      window.dispatchEvent(errorEvent)
    })

    const errorBoundary = page.locator('[data-testid="error-boundary"]')
    await expect(errorBoundary).toBeVisible({ timeout: 5000 })
  })

  // Test 2: Error Message Display
  test('should display error message to user', async ({ page }) => {
    await page.evaluate(() => {
      throw new Error('Component crashed')
    })

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  // Test 3: Reset Functionality
  test('should have reset button in error boundary', async ({ page }) => {
    await page.evaluate(() => {
      const errorEvent = new CustomEvent('react-error')
      window.dispatchEvent(errorEvent)
    })

    const resetButton = page.locator('[data-testid="error-reset-button"]')
    await expect(resetButton).toBeVisible({ timeout: 5000 })
  })

  // Test 4: Reset Button Click
  test('should reset error boundary on button click', async ({ page }) => {
    await page.evaluate(() => {
      const errorEvent = new CustomEvent('react-error')
      window.dispatchEvent(errorEvent)
    })

    const resetButton = page.locator('[data-testid="error-reset-button"]')
    await resetButton.click({ timeout: 5000 })

    // Error boundary should be hidden after reset
    const errorBoundary = page.locator('[data-testid="error-boundary"]')
    await expect(errorBoundary).not.toBeVisible({ timeout: 5000 })
  })

  // Test 5: Error Reporting
  test('should report error to monitoring service', async ({ page }) => {
    let errorReported = false

    // Intercept error reporting API call
    await page.route('**/api/errors', route => {
      errorReported = true
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
    })

    await page.evaluate(() => {
      throw new Error('Reportable error')
    })

    // Wait for error reporting
    await page.waitForTimeout(500)
    expect(errorReported).toBe(true)
  })

  // Test 6: User-Friendly Error Message
  test('should show user-friendly error message', async ({ page }) => {
    await page.evaluate(() => {
      const errorEvent = new CustomEvent('react-error')
      window.dispatchEvent(errorEvent)
    })

    const errorMessage = page.locator('[data-testid="error-message"]')
    const text = await errorMessage.textContent({ timeout: 5000 })

    expect(text).toContain('Something went wrong')
  })

  // Test 7: Error Details Toggle
  test('should have toggle for error details', async ({ page }) => {
    await page.evaluate(() => {
      const errorEvent = new CustomEvent('react-error')
      window.dispatchEvent(errorEvent)
    })

    const detailsToggle = page.locator('[data-testid="error-details-toggle"]')
    await expect(detailsToggle).toBeVisible({ timeout: 5000 })
  })

  // Test 8: Error Stack Trace
  test('should show stack trace when details expanded', async ({ page }) => {
    await page.evaluate(() => {
      throw new Error('Detailed error')
    })

    const detailsToggle = page.locator('[data-testid="error-details-toggle"]')
    await detailsToggle.click({ timeout: 5000 })

    const stackTrace = page.locator('[data-testid="error-stack-trace"]')
    await expect(stackTrace).toBeVisible({ timeout: 5000 })
  })

  // Test 9: Multiple Error Handling
  test('should handle multiple errors', async ({ page }) => {
    await page.evaluate(() => {
      throw new Error('First error')
    })

    await page.waitForTimeout(100)

    await page.evaluate(() => {
      throw new Error('Second error')
    })

    const errorBoundary = page.locator('[data-testid="error-boundary"]')
    await expect(errorBoundary).toBeVisible({ timeout: 5000 })
  })

  // Test 10: Error Boundary Accessibility
  test('should have accessible error boundary', async ({ page }) => {
    await page.evaluate(() => {
      const errorEvent = new CustomEvent('react-error')
      window.dispatchEvent(errorEvent)
    })

    const errorBoundary = page.locator('[data-testid="error-boundary"]')
    await expect(errorBoundary).toHaveAttribute('role', 'alert', { timeout: 5000 })
  })
})
