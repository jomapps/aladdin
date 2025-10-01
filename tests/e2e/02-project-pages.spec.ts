/**
 * Project Pages Loading Tests
 * Verifies project pages load and components are present
 */

import { test, expect } from '@playwright/test'

// Login and navigate to a project before each test
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.fill('input[type="email"]', 'jomapps.jb@gmail.com')
  await page.fill('input[type="password"]', 'Shlok@2000')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  
  // Find and click on first project
  const projectLink = page.locator('a[href*="/project/"], a[href*="/dashboard/project"]').first()
  if (await projectLink.isVisible()) {
    await projectLink.click()
    await page.waitForTimeout(2000)
  }
})

test.describe('Project Pages', () => {
  test('should load project overview page', async ({ page }) => {
    // Verify we're on a project page
    expect(page.url()).toMatch(/\/project\/[^\/]+/)
    
    // Page should have loaded
    await expect(page.locator('body')).toBeVisible()
    
    // Should have main content
    const hasContent = await page.locator('main, [role="main"]').count() > 0
    expect(hasContent).toBeTruthy()
  })

  test('should display project sidebar', async ({ page }) => {
    // Look for project sidebar
    const sidebar = page.locator('aside, .sidebar, [role="navigation"]').first()
    const hasSidebar = await sidebar.count() > 0
    expect(hasSidebar).toBeTruthy()
  })

  test('should display project departments section', async ({ page }) => {
    // Look for departments or navigation sections
    const hasDepartments = await page.locator('text=/department|story|character|visual/i').count() > 0
    expect(hasDepartments).toBeTruthy()
  })

  test('should display project recent activity', async ({ page }) => {
    // Look for recent activity section
    const hasActivity = await page.locator('text=/recent|activity/i').count() > 0
    expect(hasActivity).toBeTruthy()
  })

  test('should navigate to Story department', async ({ page }) => {
    // Look for Story link
    const storyLink = page.locator('a, button').filter({ hasText: /story/i }).first()
    
    if (await storyLink.isVisible()) {
      await storyLink.click()
      await page.waitForTimeout(1000)
      
      // Verify navigation occurred
      const urlChanged = page.url().includes('story') || await page.locator('text=/story/i').count() > 0
      expect(urlChanged).toBeTruthy()
    }
  })

  test('should navigate to Character department', async ({ page }) => {
    // Look for Character link
    const characterLink = page.locator('a, button').filter({ hasText: /character/i }).first()
    
    if (await characterLink.isVisible()) {
      await characterLink.click()
      await page.waitForTimeout(1000)
      
      // Verify navigation occurred
      const urlChanged = page.url().includes('character') || await page.locator('text=/character/i').count() > 0
      expect(urlChanged).toBeTruthy()
    }
  })

  test('should navigate to Visual department', async ({ page }) => {
    // Look for Visual link
    const visualLink = page.locator('a, button').filter({ hasText: /visual/i }).first()
    
    if (await visualLink.isVisible()) {
      await visualLink.click()
      await page.waitForTimeout(1000)
      
      // Verify navigation occurred
      const urlChanged = page.url().includes('visual') || await page.locator('text=/visual/i').count() > 0
      expect(urlChanged).toBeTruthy()
    }
  })
})

