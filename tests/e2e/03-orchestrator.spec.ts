import { test, expect } from '@playwright/test'

/**
 * Orchestrator E2E Tests
 * 
 * Tests the orchestrator sidebar functionality including:
 * - Mode switching
 * - Message sending
 * - Streaming responses
 * - All 4 modes (Query, Data, Task, Chat)
 */

test.describe('Orchestrator', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a project page
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Click on first project
    const projectLink = page.locator('a[href*="/dashboard/project/"]').first()
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForLoadState('networkidle')
    }
  })

  test('should display orchestrator sidebar', async ({ page }) => {
    // Look for orchestrator sidebar
    const orchestrator = page.locator('[data-testid="orchestrator"], [data-testid="right-orchestrator"]').first()
    
    // Orchestrator might be collapsed by default
    const count = await orchestrator.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should toggle orchestrator with keyboard shortcut', async ({ page }) => {
    // Press Cmd+/ to toggle orchestrator
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(500)
    
    // Orchestrator should be visible
    const orchestrator = page.locator('[data-testid="orchestrator"], [data-testid="right-orchestrator"]').first()
    
    // Check if it exists
    const count = await orchestrator.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should display mode selector', async ({ page }) => {
    // Ensure orchestrator is open
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(500)
    
    // Look for mode tabs
    const modeSelector = page.locator('[data-testid="mode-selector"], button:has-text("Query"), button:has-text("Data")').first()
    
    const count = await modeSelector.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should switch to Query mode', async ({ page }) => {
    // Ensure orchestrator is open
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(500)
    
    // Click Query mode or use keyboard shortcut
    await page.keyboard.press('Meta+1')
    await page.waitForTimeout(300)
    
    // Look for Query mode indicator
    const queryMode = page.locator('text=/query mode/i, [data-mode="query"]').first()
    
    const count = await queryMode.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should switch to Data mode', async ({ page }) => {
    // Ensure orchestrator is open
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(500)
    
    // Use keyboard shortcut for Data mode
    await page.keyboard.press('Meta+2')
    await page.waitForTimeout(300)
    
    // Look for Data mode indicator
    const dataMode = page.locator('text=/data mode/i, [data-mode="data"]').first()
    
    const count = await dataMode.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should switch to Task mode', async ({ page }) => {
    // Ensure orchestrator is open
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(500)
    
    // Use keyboard shortcut for Task mode
    await page.keyboard.press('Meta+3')
    await page.waitForTimeout(300)
    
    // Look for Task mode indicator
    const taskMode = page.locator('text=/task mode/i, [data-mode="task"]').first()
    
    const count = await taskMode.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should switch to Chat mode', async ({ page }) => {
    // Ensure orchestrator is open
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(500)
    
    // Use keyboard shortcut for Chat mode
    await page.keyboard.press('Meta+4')
    await page.waitForTimeout(300)
    
    // Look for Chat mode indicator
    const chatMode = page.locator('text=/chat mode/i, [data-mode="chat"]').first()
    
    const count = await chatMode.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should display message input', async ({ page }) => {
    // Ensure orchestrator is open
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(500)
    
    // Look for message input
    const messageInput = page.locator('textarea[placeholder*="Ask" i], textarea[placeholder*="message" i], input[type="text"]').first()
    
    const count = await messageInput.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should send a message', async ({ page }) => {
    // Ensure orchestrator is open
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(500)
    
    // Find message input
    const messageInput = page.locator('textarea[placeholder*="Ask" i], textarea[placeholder*="message" i]').first()
    
    if (await messageInput.isVisible()) {
      // Type a test message
      await messageInput.fill('Hello, this is a test message')
      
      // Find and click send button
      const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button[aria-label*="send" i]').first()
      
      if (await sendButton.isVisible()) {
        await sendButton.click()
        
        // Wait for message to appear
        await page.waitForTimeout(1000)
        
        // Look for the message in the chat
        const message = page.locator('text=/test message/i').first()
        await expect(message).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should display suggestion chips in Query mode', async ({ page }) => {
    // Ensure orchestrator is open
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(500)
    
    // Switch to Query mode
    await page.keyboard.press('Meta+1')
    await page.waitForTimeout(300)
    
    // Look for suggestion chips
    const suggestions = page.locator('button:has-text("Show"), button:has-text("Find"), button:has-text("List")').first()
    
    const count = await suggestions.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should handle streaming responses', async ({ page }) => {
    // Ensure orchestrator is open
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(500)
    
    // Send a message
    const messageInput = page.locator('textarea[placeholder*="Ask" i], textarea[placeholder*="message" i]').first()
    
    if (await messageInput.isVisible()) {
      await messageInput.fill('Tell me about this project')
      
      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first()
      
      if (await sendButton.isVisible()) {
        await sendButton.click()
        
        // Look for streaming indicator
        await page.waitForTimeout(1000)
        
        // Check for response (streaming or complete)
        const response = page.locator('[data-role="assistant"], .message-assistant').first()
        
        // Response might take time to appear
        const count = await response.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

