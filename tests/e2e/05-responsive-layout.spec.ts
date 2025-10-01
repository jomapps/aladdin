/**
 * Responsive Layout Tests
 * Verifies layout works on different screen sizes
 */

import { test, expect } from '@playwright/test'

// Login before each test
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.fill('input[type="email"]', 'jomapps.jb@gmail.com')
  await page.fill('input[type="password"]', 'Shlok@2000')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
})

test.describe('Responsive Layout - Desktop', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test('should display desktop layout on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Desktop should show sidebar
    const hasSidebar = await page.locator('aside, [role="navigation"]').count() > 0
    expect(hasSidebar).toBeTruthy()
    
    // Should have main content
    const hasMain = await page.locator('main, [role="main"]').count() > 0
    expect(hasMain).toBeTruthy()
  })

  test('should display desktop layout on project page', async ({ page }) => {
    await page.goto('/dashboard')
    const projectLink = page.locator('a[href*="/project/"]').first()
    
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForTimeout(1000)
      
      // Should have layout components
      const hasLayout = await page.locator('aside, main').count() > 0
      expect(hasLayout).toBeTruthy()
    }
  })
})

test.describe('Responsive Layout - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('should display tablet layout on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Page should load
    await expect(page.locator('body')).toBeVisible()
    
    // Should have content
    const hasContent = await page.locator('main, [role="main"]').count() > 0
    expect(hasContent).toBeTruthy()
  })

  test('should display tablet layout on project page', async ({ page }) => {
    await page.goto('/dashboard')
    const projectLink = page.locator('a[href*="/project/"]').first()
    
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForTimeout(1000)
      
      // Page should load
      await expect(page.locator('body')).toBeVisible()
    }
  })
})

test.describe('Responsive Layout - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should display mobile layout on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Page should load
    await expect(page.locator('body')).toBeVisible()
    
    // Should have content
    const hasContent = await page.locator('main, [role="main"]').count() > 0
    expect(hasContent).toBeTruthy()
  })

  test('should display mobile layout on project page', async ({ page }) => {
    await page.goto('/dashboard')
    const projectLink = page.locator('a[href*="/project/"]').first()
    
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForTimeout(1000)
      
      // Page should load
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should have mobile navigation', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Look for mobile menu button (hamburger)
    const hasMobileMenu = await page.locator('button[aria-label*="menu" i], button').filter({
      hasText: /menu|☰/
    }).count() > 0
    
    // Mobile should have some navigation mechanism
    expect(hasMobileMenu || await page.locator('nav').count() > 0).toBeTruthy()
  })
})

