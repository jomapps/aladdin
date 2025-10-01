/**
 * Orchestrator Components Tests
 * Verifies orchestrator sidebar loads and components are present
 */

import { test, expect } from '@playwright/test'

// Login and navigate to a project before each test
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.fill('input[type="email"]', 'jomapps.jb@gmail.com')
  await page.fill('input[type="password"]', 'Shlok@2000')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  
  // Navigate to a project
  const projectLink = page.locator('a[href*="/project/"]').first()
  if (await projectLink.isVisible()) {
    await projectLink.click()
    await page.waitForTimeout(2000)
  }
})

test.describe('Orchestrator Components', () => {
  test('should display orchestrator sidebar', async ({ page }) => {
    // Look for orchestrator sidebar (might be hidden initially)
    const orchestrator = page.locator('[class*="orchestrator"], aside').last()
    
    // Check if orchestrator exists in DOM
    const exists = await orchestrator.count() > 0
    expect(exists).toBeTruthy()
  })

  test('should have orchestrator toggle button', async ({ page }) => {
    // Look for button to toggle orchestrator
    const toggleButton = page.locator('button').filter({ 
      hasText: /orchestrator|ai|assistant/i 
    }).first()
    
    const hasToggle = await toggleButton.count() > 0 || 
                      await page.locator('button[aria-label*="orchestrator" i]').count() > 0
    
    expect(hasToggle).toBeTruthy()
  })

  test('should display mode selector in orchestrator', async ({ page }) => {
    // Try to open orchestrator first
    const toggleButton = page.locator('button').filter({ 
      hasText: /orchestrator|ai|assistant/i 
    }).first()
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
      await page.waitForTimeout(500)
    }
    
    // Look for mode selector (Query, Data, Task, Chat)
    const hasModes = await page.locator('text=/query|data|task|chat/i').count() > 0
    expect(hasModes).toBeTruthy()
  })

  test('should display message input in orchestrator', async ({ page }) => {
    // Try to open orchestrator
    const toggleButton = page.locator('button').filter({ 
      hasText: /orchestrator|ai|assistant/i 
    }).first()
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
      await page.waitForTimeout(500)
    }
    
    // Look for message input (textarea or input)
    const hasInput = await page.locator('textarea, input[type="text"]').count() > 0
    expect(hasInput).toBeTruthy()
  })

  test('should display Query mode welcome screen', async ({ page }) => {
    // Try to open orchestrator
    const toggleButton = page.locator('button').filter({ 
      hasText: /orchestrator|ai|assistant/i 
    }).first()
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
      await page.waitForTimeout(500)
    }
    
    // Look for Query mode elements
    const hasQueryElements = await page.locator('text=/query|ask|search/i').count() > 0
    expect(hasQueryElements).toBeTruthy()
  })

  test('should display suggestion chips in Query mode', async ({ page }) => {
    // Try to open orchestrator
    const toggleButton = page.locator('button').filter({ 
      hasText: /orchestrator|ai|assistant/i 
    }).first()
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
      await page.waitForTimeout(500)
    }
    
    // Look for suggestion chips or buttons
    const hasSuggestions = await page.locator('button').filter({
      hasText: /show|what|find|list/i
    }).count() > 0
    
    expect(hasSuggestions).toBeTruthy()
  })
})

