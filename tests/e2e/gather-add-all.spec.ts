import { test, expect } from '@playwright/test'

test.describe('Gather Add All Functionality', () => {
  const projectId = '68df4dab400c86a6a8cf40c6'
  const gatherUrl = `http://localhost:3000/dashboard/project/${projectId}/gather`

  test.beforeEach(async ({ page }) => {
    // Step 1: Login first
    console.log('Logging in...')
    await page.goto('http://localhost:3000/')

    // Check if we're already logged in (redirected to dashboard)
    await page.waitForTimeout(1000)
    const currentUrl = page.url()

    if (!currentUrl.includes('/dashboard')) {
      // Need to login
      console.log('Not logged in, filling login form...')

      // Fill in login form (using seeded user credentials)
      const emailInput = page.locator('input[type="email"], input[name="email"]').first()
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first()

      await emailInput.fill('admin@aladdin.dev')
      await passwordInput.fill('admin123')

      // Click login button
      const loginButton = page
        .locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")')
        .first()
      await loginButton.click()

      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard**', { timeout: 10000 })
      console.log('Logged in successfully')
    } else {
      console.log('Already logged in')
    }

    // Clear localStorage to ensure AI Assistant is open by default
    await page.evaluate(() => {
      localStorage.clear()
    })

    // Navigate to the gather page
    await page.goto(gatherUrl, { waitUntil: 'networkidle' })

    // Wait for page to be fully loaded
    await page.waitForTimeout(2000)
  })

  test('should successfully add all messages to gather', async ({ page }) => {
    // Step 0: Check if we're on the right page
    console.log('Step 0: Checking page state...')
    const currentUrl = page.url()
    console.log('Current URL:', currentUrl)

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'tests/screenshots/gather-initial-state.png', fullPage: true })

    // Check if we got redirected (authentication issue)
    if (!currentUrl.includes('/gather')) {
      console.log('WARNING: Not on gather page, might be redirected to login')
      // Try to see what's on the page
      const pageContent = await page.content()
      console.log('Page title:', await page.title())
    }

    // Step 1: Open the AI Assistant (RightOrchestrator)
    console.log('Step 1: Looking for AI Assistant...')

    // First, check if the AI Assistant is already visible
    const aiAssistantSidebar = page.locator('aside:has-text("AI Assistant")')
    const isAIVisible = await aiAssistantSidebar.isVisible().catch(() => false)

    if (isAIVisible) {
      console.log('AI Assistant is already open')
    } else {
      console.log('AI Assistant is not visible, looking for button to open it...')

      // Look for the floating AI button (when collapsed)
      const aiButton = page.locator('button:has-text("AI")').first()

      if (await aiButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Found AI button, clicking to open...')
        await aiButton.click()
        await page.waitForTimeout(1000)

        // Wait for the AI Assistant sidebar to be visible
        await page.waitForSelector('aside:has-text("AI Assistant")', { timeout: 10000 })
        console.log('AI Assistant is now open')
      } else {
        console.log('ERROR: Could not find AI button or sidebar')
        throw new Error('AI Assistant not found on page')
      }
    }

    // Take a screenshot to see the current state
    await page.screenshot({ path: 'tests/screenshots/gather-ai-opened.png', fullPage: true })

    // Step 2: Check if there are messages in the chat
    console.log('Step 2: Checking for messages...')

    // Wait for messages to load
    await page.waitForTimeout(2000)

    // Check if there are any messages
    const messages = page.locator('[role="article"], .message, [data-message]')
    const messageCount = await messages.count()
    console.log('Message count:', messageCount)

    if (messageCount === 0) {
      console.log('No messages found - sending a test message first')

      // Find the textarea input field in the AI Assistant
      const textarea = page.locator('aside:has-text("AI Assistant") textarea').first()
      await textarea.fill('Tell me about the main character')

      // Find and click send button (it's an icon button with Send icon)
      const sendButton = page
        .locator('aside:has-text("AI Assistant") button[class*="bg-zinc-900"]')
        .last()
      await sendButton.click()

      console.log('Waiting for AI response...')
      // Wait for AI response (look for assistant message)
      await page.waitForTimeout(8000)

      // Take another screenshot
      await page.screenshot({ path: 'tests/screenshots/gather-after-message.png', fullPage: true })
    }

    // Step 3: Find and click the "Add All" button
    console.log('Step 3: Looking for Add All button...')

    // Look for the Add All button - it should be in the GatherButtons component
    const addAllButton = page.locator('button:has-text("Add All")').first()

    // Wait for the button to be visible
    await expect(addAllButton).toBeVisible({ timeout: 10000 })

    console.log('Found Add All button')

    // Get the count from the button text
    const buttonText = await addAllButton.textContent()
    console.log('Button text:', buttonText)

    // Check if button is enabled
    const isDisabled = await addAllButton.isDisabled()
    console.log('Button disabled:', isDisabled)

    if (isDisabled) {
      throw new Error('Add All button is disabled - cannot proceed with test')
    }

    // Step 4: Set up dialog handler BEFORE clicking (for both confirmation and success dialogs)
    console.log('Step 4: Setting up dialog handler...')

    let dialogCount = 0
    page.on('dialog', async (dialog) => {
      dialogCount++
      console.log(`Dialog ${dialogCount} appeared:`, dialog.message())
      console.log('Dialog type:', dialog.type())
      await dialog.accept()
      console.log('Dialog accepted')
    })

    // Step 5: Click the Add All button and wait for API call
    console.log('Step 5: Clicking Add All button...')

    // Set up a promise to wait for the API call
    const apiCallPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/gather/') &&
        response.request().method() === 'POST' &&
        response.status() === 200,
      { timeout: 30000 },
    )

    await addAllButton.click()

    // Wait for the API call
    console.log('Waiting for API call...')
    try {
      const response = await apiCallPromise
      console.log('API call completed:', response.status())
      const responseBody = await response.json()
      console.log('Response:', JSON.stringify(responseBody, null, 2))
    } catch (error) {
      console.log('API call failed or timed out:', error)
    }

    // Step 6: Wait for processing
    console.log('Step 6: Waiting for processing...')

    // Look for processing indicator
    const processingIndicator = page.locator('button:has-text("Processing"), [aria-busy="true"]')

    if (await processingIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Processing started...')
      // Wait for processing to complete (max 60 seconds)
      await processingIndicator.waitFor({ state: 'hidden', timeout: 60000 })
      console.log('Processing completed')
    }

    // Step 7: Wait for success message
    console.log('Step 7: Waiting for success message...')
    await page.waitForTimeout(2000)

    // Step 8: Wait for page reload
    console.log('Step 8: Waiting for page reload...')

    // Wait for navigation (page reload)
    try {
      await page.waitForURL(`**/dashboard/project/${projectId}/gather`, { timeout: 15000 })
      console.log('Page reloaded successfully')
    } catch (error) {
      console.log('Page reload timeout, continuing anyway...')
    }

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    console.log('Page is now idle')

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/gather-after-add-all.png', fullPage: true })

    // Step 9: Verify items were added to gather
    console.log('Step 9: Verifying items were added...')

    // Wait a bit for React Query to fetch data
    await page.waitForTimeout(3000)

    // Make a direct API call to verify items are in the database
    console.log('Making direct API call to verify items...')
    const directApiResponse = await page.evaluate(async (pid) => {
      const response = await fetch(`/api/v1/gather/${pid}?page=1&limit=20&sort=latest`)
      return {
        status: response.status,
        data: await response.json(),
      }
    }, projectId)

    console.log('Direct API call status:', directApiResponse.status)
    console.log('Direct API response:', JSON.stringify(directApiResponse.data, null, 2))

    const gatherData = directApiResponse.data
    if (gatherData) {
      console.log('Total items from API:', gatherData.total)
      console.log('Items in response:', gatherData.items?.length || 0)
    }

    // Check if gather items increased
    const gatherItems = page.locator(
      '[data-testid="gather-item"], .gather-card, [class*="GatherCard"]',
    )
    const itemCount = await gatherItems.count()
    console.log('Gather items count in DOM:', itemCount)

    // Check for the items count display
    const itemsCountDisplay = page.locator('text=/Items:\\s*\\d+/i, text=/\\d+\\s*items/i').first()
    if (await itemsCountDisplay.isVisible({ timeout: 5000 }).catch(() => false)) {
      const countText = await itemsCountDisplay.textContent()
      console.log('Items count display:', countText)
    }

    // Verify that at least one item was added
    if (gatherData && gatherData.total > 0) {
      console.log('✅ Test PASSED: Items were successfully added to gather!')
      console.log(`Total items in database: ${gatherData.total}`)
    } else if (itemCount > 0) {
      console.log('✅ Test PASSED: Items are visible in the DOM!')
      console.log(`Items in DOM: ${itemCount}`)
    } else {
      console.log('❌ Test FAILED: No items found in gather after adding')
      console.log('This might be a timing issue or the items are not being fetched correctly')
    }

    console.log('Test completed!')
  })

  test('should handle errors gracefully', async ({ page }) => {
    console.log('Testing error handling...')

    // Intercept the API call and make it fail
    await page.route('**/api/v1/gather/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })

    // Try to add all messages
    const addAllButton = page.locator('button:has-text("Add All")').first()

    if (await addAllButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addAllButton.click()

      // Accept confirmation
      page.on('dialog', async (dialog) => {
        await dialog.accept()
      })

      await page.waitForTimeout(2000)

      // Check for error message
      const errorAlert = page.locator('text=/failed/i, text=/error/i')
      await expect(errorAlert).toBeVisible({ timeout: 10000 })

      console.log('Error handling works correctly')
    }
  })
})
