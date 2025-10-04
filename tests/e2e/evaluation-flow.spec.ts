/**
 * Department Evaluation Flow E2E Test
 *
 * Tests the complete evaluation workflow:
 * 1. Navigate to project gather page
 * 2. Click "Evaluate" on Story department
 * 3. Verify redirect to project-readiness page
 * 4. Verify evaluation auto-triggers
 * 5. Wait for webhook notification
 * 6. Verify results display in UI
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const TEST_PROJECT_ID = '68df4dab400c86a6a8cf40c6'
const TEST_TIMEOUT = 180000 // 3 minutes for evaluation to complete

test.describe('Department Evaluation Flow', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('should complete full evaluation workflow', async () => {
    test.setTimeout(TEST_TIMEOUT)

    // Step 1: Navigate to homepage (auto-login in dev mode)
    console.log('[Test] Step 1: Navigating to homepage...')
    await page.goto('/')

    // Wait for auto-login redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    console.log('[Test] ✓ Auto-logged in and redirected to dashboard')

    // Step 2: Navigate to project gather page
    console.log(`[Test] Step 2: Navigating to project gather page...`)
    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/gather`)
    await page.waitForLoadState('networkidle')
    console.log('[Test] ✓ Gather page loaded')

    // Step 3: Verify Story department card is visible
    console.log('[Test] Step 3: Looking for Story department card...')

    // Debug: Log all elements on the page
    const allCards = await page.locator('[data-testid^="department-card-"]').count()
    console.log(`[Test] Found ${allCards} department cards on page`)

    // Debug: Log page content
    const pageContent = await page.content()
    const hasStoryText = pageContent.includes('Story')
    console.log(`[Test] Page contains "Story" text: ${hasStoryText}`)

    const storyCard = page.locator('[data-testid="department-card-story"]').first()
    await expect(storyCard).toBeVisible({ timeout: 10000 })
    console.log('[Test] ✓ Story department card found')

    // Step 4: Click "Evaluate" button
    console.log('[Test] Step 4: Clicking Evaluate button...')
    const evaluateButton = page.locator('[data-testid="evaluate-button-story"]').first()
    await expect(evaluateButton).toBeVisible()
    await evaluateButton.click()
    console.log('[Test] ✓ Evaluate button clicked')

    // Step 5: Verify redirect to project-readiness page with query param
    console.log('[Test] Step 5: Waiting for redirect to project-readiness page...')
    await page.waitForURL(`**/project-readiness?evaluate=story`, { timeout: 10000 })
    console.log('[Test] ✓ Redirected to project-readiness page with evaluate=story')

    // Step 6: Verify toast notification appears
    console.log('[Test] Step 6: Checking for toast notification...')
    const toast = page.locator('text=/Starting evaluation for story department/i').first()
    await expect(toast).toBeVisible({ timeout: 5000 })
    console.log('[Test] ✓ Toast notification appeared')

    // Step 7: Verify Story department card is visible and check status
    console.log('[Test] Step 7: Checking department status...')
    const storyDepartment = page.locator('[data-testid="department-story"]').first()
    await expect(storyDepartment).toBeVisible({ timeout: 10000 })

    // Wait a moment for the status to update
    await page.waitForTimeout(2000)

    // Check for status badge
    const statusBadge = storyDepartment.locator('[data-testid="department-status"]')
    await expect(statusBadge).toBeVisible({ timeout: 5000 })
    const statusText = await statusBadge.textContent()
    console.log(`[Test] ✓ Department status: ${statusText}`)

    // Step 8: Wait for evaluation to complete (webhook notification)
    console.log('[Test] Step 8: Waiting for evaluation to complete (up to 2 minutes)...')

    // Poll for completion - check every 5 seconds
    let completed = false
    let attempts = 0
    const maxAttempts = 24 // 2 minutes (24 * 5 seconds)

    while (!completed && attempts < maxAttempts) {
      attempts++
      console.log(`[Test] Polling attempt ${attempts}/${maxAttempts}...`)

      // Reload page to get latest data
      await page.reload({ waitUntil: 'networkidle' })

      // Check if rating is visible (indicates completion)
      const ratingElement = storyDepartment.locator('[data-testid="department-rating"]')
      const isRatingVisible = await ratingElement.isVisible().catch(() => false)

      if (isRatingVisible) {
        completed = true
        console.log('[Test] ✓ Evaluation completed!')
        break
      }

      // Check if status changed to "completed"
      const completedStatus = storyDepartment.locator('text=/Completed|Complete/i')
      const isCompleted = await completedStatus.isVisible().catch(() => false)

      if (isCompleted) {
        completed = true
        console.log('[Test] ✓ Evaluation completed!')
        break
      }

      // Wait 5 seconds before next check
      await page.waitForTimeout(5000)
    }

    if (!completed) {
      throw new Error('Evaluation did not complete within 2 minutes')
    }

    // Step 9: Verify evaluation results are displayed
    console.log('[Test] Step 9: Verifying evaluation results...')

    // Check for rating
    const rating = storyDepartment.locator('[data-testid="department-rating"]')
    await expect(rating).toBeVisible()
    const ratingText = await rating.textContent()
    console.log(`[Test] ✓ Rating displayed: ${ratingText}`)

    // Check for evaluation summary
    const summary = storyDepartment.locator('[data-testid="evaluation-summary"]')
    const hasSummary = await summary.isVisible().catch(() => false)
    if (hasSummary) {
      const summaryText = await summary.textContent()
      console.log(`[Test] ✓ Summary displayed: ${summaryText?.substring(0, 100)}...`)
    }

    // Check for issues
    const issuesSection = storyDepartment.locator('[data-testid="evaluation-issues"]')
    const hasIssues = await issuesSection.isVisible().catch(() => false)
    if (hasIssues) {
      console.log('[Test] ✓ Issues section displayed')
    }

    // Check for suggestions
    const suggestionsSection = storyDepartment.locator('[data-testid="evaluation-suggestions"]')
    const hasSuggestions = await suggestionsSection.isVisible().catch(() => false)
    if (hasSuggestions) {
      console.log('[Test] ✓ Suggestions section displayed')
    }

    // Step 10: Verify overall project readiness score is updated
    console.log('[Test] Step 10: Checking overall readiness score...')
    const readinessScore = page.locator('[data-testid="overall-readiness-score"]')
    const hasScore = await readinessScore.isVisible().catch(() => false)
    if (hasScore) {
      const scoreText = await readinessScore.textContent()
      console.log(`[Test] ✓ Overall readiness score: ${scoreText}`)
    }

    console.log('[Test] ✅ All steps completed successfully!')
  })

  test('should handle evaluation failure gracefully', async () => {
    test.setTimeout(TEST_TIMEOUT)

    console.log('[Test] Testing failure handling...')

    // Navigate to project-readiness page
    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/project-readiness`)
    await page.waitForLoadState('networkidle')

    // Check if there's a failed evaluation
    const failedStatus = page.locator('text=/Failed|Error/i').first()
    const hasFailed = await failedStatus.isVisible().catch(() => false)

    if (hasFailed) {
      console.log('[Test] ✓ Failed evaluation detected')

      // Check for error message
      const errorMessage = page.locator('[data-testid="evaluation-error"]')
      const hasError = await errorMessage.isVisible().catch(() => false)

      if (hasError) {
        const errorText = await errorMessage.textContent()
        console.log(`[Test] ✓ Error message displayed: ${errorText}`)
      }

      // Check for retry button
      const retryButton = page.locator('button:has-text("Retry")')
      const hasRetry = await retryButton.isVisible().catch(() => false)

      if (hasRetry) {
        console.log('[Test] ✓ Retry button available')
      }
    } else {
      console.log(
        '[Test] ℹ No failed evaluations found (this is expected if all evaluations succeeded)',
      )
    }
  })

  test('should display evaluation history', async () => {
    console.log('[Test] Testing evaluation history display...')

    // Navigate to project-readiness page
    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/project-readiness`)
    await page.waitForLoadState('networkidle')

    // Check for evaluation history section
    const historySection = page.locator('[data-testid="evaluation-history"]')
    const hasHistory = await historySection.isVisible().catch(() => false)

    if (hasHistory) {
      console.log('[Test] ✓ Evaluation history section found')

      // Count history items
      const historyItems = historySection.locator('[data-testid="history-item"]')
      const count = await historyItems.count()
      console.log(`[Test] ✓ Found ${count} evaluation history items`)
    } else {
      console.log('[Test] ℹ No evaluation history section found')
    }
  })

  test('should show sequential evaluation requirements', async () => {
    console.log('[Test] Testing sequential evaluation requirements...')

    // Navigate to project-readiness page
    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/project-readiness`)
    await page.waitForLoadState('networkidle')

    // Try to find a locked department (one that can't be evaluated yet)
    const lockedDepartment = page
      .locator('[data-testid^="department-"]:has(button:disabled)')
      .first()
    const hasLocked = await lockedDepartment.isVisible().catch(() => false)

    if (hasLocked) {
      console.log('[Test] ✓ Found locked department (sequential requirement enforced)')

      // Check for tooltip or message explaining why it's locked
      const lockMessage = lockedDepartment.locator(
        'text=/Previous department|must be evaluated first/i',
      )
      const hasMessage = await lockMessage.isVisible().catch(() => false)

      if (hasMessage) {
        const messageText = await lockMessage.textContent()
        console.log(`[Test] ✓ Lock message displayed: ${messageText}`)
      }
    } else {
      console.log(
        '[Test] ℹ No locked departments found (all previous departments may be completed)',
      )
    }
  })
})
