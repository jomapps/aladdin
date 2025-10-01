/**
 * E2E Tests: Orchestrator Query Mode
 * Full end-to-end tests using Playwright
 */

import { test, expect } from '@playwright/test'

test.describe('Orchestrator Query Mode E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to project page
    await page.goto('/dashboard/project/test-project-123')
  })

  test('should open orchestrator and perform search', async ({ page }) => {
    // Step 1: Open orchestrator
    await page.click('[data-testid="orchestrator-toggle"]')

    // Step 2: Verify orchestrator panel is visible
    await expect(page.locator('[data-testid="right-orchestrator"]')).toBeVisible()

    // Step 3: Ensure query mode is active
    await expect(page.locator('[data-testid="query-mode"]')).toBeVisible()

    // Step 4: Enter search query
    await page.fill('[data-testid="query-input"]', 'test search query')

    // Step 5: Submit search
    await page.click('[data-testid="query-submit"]')

    // Step 6: Wait for results
    await page.waitForSelector('[data-testid="query-results"]', {
      state: 'visible',
      timeout: 5000
    })

    // Step 7: Verify results are displayed
    const results = page.locator('[data-testid^="result-"]')
    await expect(results).toHaveCount(expect.any(Number))
  })

  test('should switch between orchestrator modes', async ({ page }) => {
    // Open orchestrator
    await page.click('[data-testid="orchestrator-toggle"]')

    // Start in query mode
    await expect(page.locator('[data-testid="query-mode"]')).toBeVisible()

    // Switch to data mode
    await page.click('[data-testid="mode-data"]')
    await expect(page.locator('[data-testid="data-mode"]')).toBeVisible()

    // Switch to task mode
    await page.click('[data-testid="mode-task"]')
    await expect(page.locator('[data-testid="task-mode"]')).toBeVisible()

    // Switch to chat mode
    await page.click('[data-testid="mode-chat"]')
    await expect(page.locator('[data-testid="chat-mode"]')).toBeVisible()

    // Switch back to query mode
    await page.click('[data-testid="mode-query"]')
    await expect(page.locator('[data-testid="query-mode"]')).toBeVisible()
  })

  test('should display loading state during search', async ({ page }) => {
    await page.click('[data-testid="orchestrator-toggle"]')

    // Mock slow API response
    await page.route('**/api/search**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ results: [] })
      })
    })

    await page.fill('[data-testid="query-input"]', 'test')
    await page.click('[data-testid="query-submit"]')

    // Verify loading indicator appears
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible()

    // Wait for loading to complete
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible({
      timeout: 3000
    })
  })

  test('should handle search errors', async ({ page }) => {
    await page.click('[data-testid="orchestrator-toggle"]')

    // Mock API error
    await page.route('**/api/search**', route =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Search failed' })
      })
    )

    await page.fill('[data-testid="query-input"]', 'test')
    await page.click('[data-testid="query-submit"]')

    // Verify error message is displayed
    await expect(page.locator('text=/error|failed/i')).toBeVisible({
      timeout: 3000
    })
  })

  test('should close orchestrator', async ({ page }) => {
    // Open orchestrator
    await page.click('[data-testid="orchestrator-toggle"]')
    await expect(page.locator('[data-testid="right-orchestrator"]')).toBeVisible()

    // Close orchestrator
    await page.click('[data-testid="close-orchestrator"]')

    // Verify it's closed (check for CSS class or visibility)
    await expect(page.locator('[data-testid="right-orchestrator"]')).toHaveClass(/closed/)
  })

  test('should support keyboard shortcuts', async ({ page }) => {
    // Test keyboard shortcut to open orchestrator (e.g., Ctrl+K)
    await page.keyboard.press('Control+K')

    await expect(page.locator('[data-testid="right-orchestrator"]')).toBeVisible()

    // Test Escape to close
    await page.keyboard.press('Escape')

    await expect(page.locator('[data-testid="right-orchestrator"]')).toHaveClass(/closed/)
  })

  test('should maintain query state when switching modes', async ({ page }) => {
    await page.click('[data-testid="orchestrator-toggle"]')

    // Enter query
    await page.fill('[data-testid="query-input"]', 'test query')

    // Switch to data mode
    await page.click('[data-testid="mode-data"]')

    // Switch back to query mode
    await page.click('[data-testid="mode-query"]')

    // Verify query is still there (if that's the expected behavior)
    const inputValue = await page.inputValue('[data-testid="query-input"]')
    expect(inputValue).toBe('test query')
  })

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Open orchestrator
    await page.click('[data-testid="orchestrator-toggle"]')

    // Verify orchestrator is visible on mobile
    await expect(page.locator('[data-testid="right-orchestrator"]')).toBeVisible()

    // Perform search
    await page.fill('[data-testid="query-input"]', 'mobile test')
    await page.click('[data-testid="query-submit"]')

    // Verify results on mobile
    await page.waitForSelector('[data-testid="query-results"]', { timeout: 5000 })
  })
})
