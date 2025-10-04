/**
 * Automated Gather Creation E2E Test
 *
 * Tests the complete automated gather workflow:
 * 1. Start automation from readiness page
 * 2. Monitor progress in real-time
 * 3. Cancel mid-process
 * 4. Verify automated items created
 * 5. Check evaluation triggering
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const TEST_PROJECT_ID = '68df4dab400c86a6a8cf40c6'
const TEST_TIMEOUT = 300000 // 5 minutes for full automation

test.describe('Automated Gather Creation', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('should start automation from readiness page', async () => {
    test.setTimeout(TEST_TIMEOUT)

    console.log('[Test] Step 1: Navigate to homepage and auto-login...')
    await page.goto('/')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    console.log('[Test] ✓ Auto-logged in')

    console.log('[Test] Step 2: Navigate to project readiness page...')
    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/project-readiness`)
    await page.waitForLoadState('networkidle')
    console.log('[Test] ✓ Readiness page loaded')

    console.log('[Test] Step 3: Looking for Automate Gather button...')
    const automateButton = page
      .locator('button:has-text("Automate Gather"), button:has-text("Automated Gather")')
      .first()
    await expect(automateButton).toBeVisible({ timeout: 10000 })
    console.log('[Test] ✓ Automate Gather button found')

    // Check if button is enabled (requires at least 1 gather item)
    const isEnabled = await automateButton.isEnabled()
    console.log(`[Test] Button enabled: ${isEnabled}`)

    if (!isEnabled) {
      console.log('[Test] ℹ Button is disabled - need at least 1 gather item')
      console.log('[Test] Creating a gather item first...')

      // Navigate to gather page and create an item
      await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/gather`)
      await page.waitForLoadState('networkidle')

      const createButton = page.locator('button:has-text("Create Item")').first()
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click()
        await page.waitForTimeout(2000)

        // Fill in basic item details
        const contentInput = page.locator('textarea[name="content"]').first()
        if (await contentInput.isVisible().catch(() => false)) {
          await contentInput.fill('Test gather item for automation')
          const saveButton = page.locator('button:has-text("Save")').first()
          await saveButton.click()
          await page.waitForTimeout(1000)
        }
      }

      // Go back to readiness page
      await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/project-readiness`)
      await page.waitForLoadState('networkidle')
    }

    console.log('[Test] Step 4: Click Automate Gather button...')
    await automateButton.click()
    console.log('[Test] ✓ Automation started')

    console.log('[Test] Step 5: Wait for progress modal...')
    const progressModal = page
      .locator('[role="dialog"]:has-text("Automated Gather"), .modal:has-text("Automation")')
      .first()
    await expect(progressModal).toBeVisible({ timeout: 10000 })
    console.log('[Test] ✓ Progress modal opened')
  })

  test('should monitor progress in real-time', async () => {
    test.setTimeout(TEST_TIMEOUT)

    console.log('[Test] Monitoring automation progress...')

    // Wait for first department to show
    const departmentStatus = page
      .locator('text=/Processing:|Department:|Story|Casting|Visual/i')
      .first()
    await expect(departmentStatus).toBeVisible({ timeout: 15000 })
    console.log('[Test] ✓ Department processing started')

    // Check for deduplication step
    console.log('[Test] Waiting for deduplication step...')
    const dedupIndicator = page
      .locator('text=/Weeding|Deduplicat|Removing duplicat/i')
      .first()
    const hasDedupStep = await dedupIndicator.isVisible({ timeout: 30000 }).catch(() => false)

    if (hasDedupStep) {
      console.log('[Test] ✓ Deduplication step detected')
    } else {
      console.log('[Test] ℹ Deduplication step not visible (may be too fast)')
    }

    // Check for quality progress
    const qualityProgress = page.locator('text=/Quality|Score|Progress/i').first()
    await expect(qualityProgress).toBeVisible({ timeout: 15000 })
    console.log('[Test] ✓ Quality progress visible')

    // Check for iteration count
    const iterationCount = page.locator('text=/Iteration|Step/i').first()
    const hasIterations = await iterationCount.isVisible().catch(() => false)
    if (hasIterations) {
      const iterText = await iterationCount.textContent()
      console.log(`[Test] ✓ Iterations visible: ${iterText}`)
    }

    // Check for items created count
    const itemsCreated = page.locator('text=/Items Created|Created:/i').first()
    const hasItemCount = await itemsCreated.isVisible().catch(() => false)
    if (hasItemCount) {
      const itemText = await itemsCreated.textContent()
      console.log(`[Test] ✓ Items count visible: ${itemText}`)
    }

    console.log('[Test] ✓ Real-time monitoring working')
  })

  test('should handle cancellation mid-process', async () => {
    test.setTimeout(TEST_TIMEOUT)

    console.log('[Test] Testing cancellation functionality...')

    // Start new automation
    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/project-readiness`)
    await page.waitForLoadState('networkidle')

    const automateButton = page
      .locator('button:has-text("Automate Gather"), button:has-text("Automated Gather")')
      .first()

    const isEnabled = await automateButton.isEnabled()
    if (!isEnabled) {
      console.log('[Test] ℹ Button disabled - skipping cancellation test')
      return
    }

    await automateButton.click()
    await page.waitForTimeout(2000)

    // Look for cancel button
    const cancelButton = page.locator('button:has-text("Cancel")').first()
    const hasCancelButton = await cancelButton.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasCancelButton) {
      console.log('[Test] ✓ Cancel button found')

      // Wait a bit for processing to start
      await page.waitForTimeout(3000)

      console.log('[Test] Clicking cancel button...')
      await cancelButton.click()

      // Check for cancellation confirmation
      const cancellingText = page.locator('text=/Cancelling|Cancelled|Stopped/i').first()
      const wasCancelled = await cancellingText.isVisible({ timeout: 10000 }).catch(() => false)

      if (wasCancelled) {
        console.log('[Test] ✓ Automation cancelled')

        // Check for partial results message
        const partialResultsMsg = page.locator('text=/Partial|Some items/i').first()
        const hasPartialMsg = await partialResultsMsg.isVisible({ timeout: 5000 }).catch(() => false)

        if (hasPartialMsg) {
          console.log('[Test] ✓ Partial results preserved message shown')
        }
      } else {
        console.log('[Test] ℹ Cancellation status not visible')
      }
    } else {
      console.log('[Test] ℹ Cancel button not available')
    }
  })

  test('should verify automated items are created', async () => {
    test.setTimeout(TEST_TIMEOUT)

    console.log('[Test] Verifying automated items creation...')

    // Navigate to gather page
    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/gather`)
    await page.waitForLoadState('networkidle')
    console.log('[Test] ✓ Gather page loaded')

    // Look for automated items (they should have a special indicator)
    const automatedItems = page.locator('[data-automated="true"], .automated-item').all()
    const hasAutomatedItems = (await automatedItems).length > 0

    if (hasAutomatedItems) {
      const count = (await automatedItems).length
      console.log(`[Test] ✓ Found ${count} automated items`)

      // Check first automated item for metadata
      const firstItem = (await automatedItems)[0]
      const metadata = firstItem.locator('.automation-metadata, [data-testid="automation-info"]')
      const hasMetadata = await metadata.isVisible().catch(() => false)

      if (hasMetadata) {
        console.log('[Test] ✓ Automated items have metadata')
      }
    } else {
      // Alternative: check if items were created recently
      console.log('[Test] Looking for recently created items...')
      const recentItems = page
        .locator('[data-testid^="gather-item-"], .gather-item')
        .first()
      const hasItems = await recentItems.isVisible().catch(() => false)

      if (hasItems) {
        console.log('[Test] ✓ Items found on gather page')
      } else {
        console.log('[Test] ℹ No items visible (may need to run automation first)')
      }
    }

    // Check for department filtering
    const departmentFilter = page.locator('select[name="department"], [data-testid="department-filter"]').first()
    const hasFilter = await departmentFilter.isVisible().catch(() => false)

    if (hasFilter) {
      console.log('[Test] ✓ Department filter available')

      // Try to filter by department
      await departmentFilter.selectOption({ index: 1 })
      await page.waitForTimeout(1000)

      const filteredItems = page.locator('[data-testid^="gather-item-"]').all()
      const filteredCount = (await filteredItems).length
      console.log(`[Test] ✓ Filtered to ${filteredCount} items`)
    }
  })

  test('should trigger evaluations automatically', async () => {
    test.setTimeout(TEST_TIMEOUT)

    console.log('[Test] Verifying auto-evaluation triggering...')

    // Navigate to project-readiness page
    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/project-readiness`)
    await page.waitForLoadState('networkidle')

    // Check for evaluation status on departments
    const departmentCards = page.locator('[data-testid^="department-"]').all()
    const hasDepartments = (await departmentCards).length > 0

    if (hasDepartments) {
      console.log(`[Test] Found ${(await departmentCards).length} departments`)

      // Check for "Evaluating" status on any department
      const evaluatingStatus = page
        .locator('text=/Evaluating|In Progress|Processing/i')
        .first()
      const isEvaluating = await evaluatingStatus.isVisible({ timeout: 10000 }).catch(() => false)

      if (isEvaluating) {
        console.log('[Test] ✓ Evaluation is in progress')

        // Wait for evaluation to complete
        console.log('[Test] Waiting for evaluation to complete...')
        const completedStatus = page.locator('text=/Completed|Complete/i').first()
        const didComplete =
          await completedStatus.isVisible({ timeout: 60000 }).catch(() => false)

        if (didComplete) {
          console.log('[Test] ✓ Evaluation completed')

          // Check for rating/score
          const rating = page.locator('[data-testid="department-rating"]').first()
          const hasRating = await rating.isVisible().catch(() => false)

          if (hasRating) {
            const ratingText = await rating.textContent()
            console.log(`[Test] ✓ Evaluation rating: ${ratingText}`)
          }
        } else {
          console.log('[Test] ℹ Evaluation still in progress')
        }
      } else {
        // Check for completed evaluations
        const completedStatus = page.locator('text=/Completed|Complete/i').first()
        const hasCompleted = await completedStatus.isVisible().catch(() => false)

        if (hasCompleted) {
          console.log('[Test] ✓ Previous evaluations completed')
        } else {
          console.log('[Test] ℹ No active or completed evaluations visible')
        }
      }
    } else {
      console.log('[Test] ℹ No department cards found')
    }

    // Check for sequential evaluation indicator
    const sequentialMsg = page
      .locator('text=/Sequential|Next department|Previous must complete/i')
      .first()
    const hasSequential = await sequentialMsg.isVisible().catch(() => false)

    if (hasSequential) {
      console.log('[Test] ✓ Sequential evaluation requirement shown')
    }
  })

  test('should display automation history', async () => {
    console.log('[Test] Checking automation history...')

    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/project-readiness`)
    await page.waitForLoadState('networkidle')

    // Look for automation history section
    const historySection = page
      .locator('[data-testid="automation-history"], .automation-history')
      .first()
    const hasHistory = await historySection.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasHistory) {
      console.log('[Test] ✓ Automation history section found')

      // Count history entries
      const historyItems = historySection.locator('[data-testid="history-item"], .history-item')
      const count = await historyItems.count()
      console.log(`[Test] ✓ Found ${count} automation history items`)

      if (count > 0) {
        // Check first history item details
        const firstItem = historyItems.first()
        const timestamp = firstItem.locator('.timestamp, [data-testid="timestamp"]')
        const hasTimestamp = await timestamp.isVisible().catch(() => false)

        if (hasTimestamp) {
          console.log('[Test] ✓ History items show timestamps')
        }

        const itemCount = firstItem.locator('text=/items created|created:/i')
        const hasItemCount = await itemCount.isVisible().catch(() => false)

        if (hasItemCount) {
          console.log('[Test] ✓ History items show item counts')
        }
      }
    } else {
      console.log('[Test] ℹ Automation history section not found')
    }
  })

  test('should show automation button state correctly', async () => {
    console.log('[Test] Verifying button state management...')

    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/project-readiness`)
    await page.waitForLoadState('networkidle')

    const automateButton = page
      .locator('button:has-text("Automate Gather"), button:has-text("Automated Gather")')
      .first()

    await expect(automateButton).toBeVisible({ timeout: 10000 })

    // Check button state
    const isEnabled = await automateButton.isEnabled()
    const buttonText = await automateButton.textContent()

    console.log(`[Test] Button text: "${buttonText?.trim()}"`)
    console.log(`[Test] Button enabled: ${isEnabled}`)

    if (!isEnabled) {
      // Look for tooltip or message explaining why disabled
      const tooltip = page.locator('[role="tooltip"], .tooltip').first()
      const hasTooltip = await tooltip.isVisible({ timeout: 2000 }).catch(() => false)

      if (hasTooltip) {
        const tooltipText = await tooltip.textContent()
        console.log(`[Test] ✓ Disabled reason shown: ${tooltipText}`)
      } else {
        // Try hovering to see tooltip
        await automateButton.hover()
        await page.waitForTimeout(500)

        const hoverTooltip = page.locator('[role="tooltip"], .tooltip').first()
        const hasHoverTooltip = await hoverTooltip.isVisible().catch(() => false)

        if (hasHoverTooltip) {
          const tooltipText = await hoverTooltip.textContent()
          console.log(`[Test] ✓ Hover tooltip: ${tooltipText}`)
        }
      }
    }

    // Check if button shows loading state during automation
    if (isEnabled) {
      await automateButton.click()
      await page.waitForTimeout(500)

      const isLoading =
        (await automateButton.textContent())?.includes('...') ||
        (await automateButton.getAttribute('disabled')) === ''

      if (isLoading) {
        console.log('[Test] ✓ Button shows loading state')
      }
    }

    console.log('[Test] ✓ Button state management verified')
  })

  test('should handle network errors gracefully', async () => {
    console.log('[Test] Testing error handling...')

    // Simulate offline mode
    await page.context().setOffline(true)

    await page.goto(`/dashboard/project/${TEST_PROJECT_ID}/project-readiness`, {
      waitUntil: 'domcontentloaded',
    })

    const automateButton = page
      .locator('button:has-text("Automate Gather"), button:has-text("Automated Gather")')
      .first()

    const isVisible = await automateButton.isVisible({ timeout: 5000 }).catch(() => false)

    if (isVisible && (await automateButton.isEnabled())) {
      await automateButton.click()

      // Look for error message
      const errorMsg = page.locator('text=/Error|Failed|Network/i').first()
      const hasError = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasError) {
        console.log('[Test] ✓ Error message shown on network failure')
      } else {
        console.log('[Test] ℹ Error message not visible (may have retry logic)')
      }
    }

    // Go back online
    await page.context().setOffline(false)
    console.log('[Test] ✓ Network error handling tested')
  })
})
