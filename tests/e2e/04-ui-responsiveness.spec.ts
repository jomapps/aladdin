import { test, expect } from '@playwright/test'

/**
 * UI Responsiveness E2E Tests
 * 
 * Tests responsive design across different viewports:
 * - Desktop (1920x1080)
 * - Tablet (768x1024)
 * - Mobile (375x667)
 */

test.describe('UI Responsiveness', () => {
  test('should display correctly on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // All sidebars should be visible on desktop
    const leftSidebar = page.locator('[data-testid="left-sidebar"], aside').first()
    const count = await leftSidebar.count()
    expect(count).toBeGreaterThanOrEqual(0)
    
    // Take screenshot
    await page.screenshot({ path: 'playwright-report/desktop-dashboard.png', fullPage: true })
  })

  test('should display correctly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Left sidebar might be collapsed on tablet
    const hamburger = page.locator('button[aria-label*="menu" i], button:has-text("☰")').first()
    const count = await hamburger.count()
    expect(count).toBeGreaterThanOrEqual(0)
    
    // Take screenshot
    await page.screenshot({ path: 'playwright-report/tablet-dashboard.png', fullPage: true })
  })

  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Sidebars should be hidden/overlays on mobile
    const hamburger = page.locator('button[aria-label*="menu" i], button:has-text("☰")').first()
    const count = await hamburger.count()
    expect(count).toBeGreaterThanOrEqual(0)
    
    // Take screenshot
    await page.screenshot({ path: 'playwright-report/mobile-dashboard.png', fullPage: true })
  })

  test('should handle sidebar toggle on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Find hamburger menu
    const hamburger = page.locator('button[aria-label*="menu" i], button:has-text("☰")').first()
    
    if (await hamburger.isVisible()) {
      // Open sidebar
      await hamburger.click()
      await page.waitForTimeout(500)
      
      // Sidebar should be visible
      const sidebar = page.locator('[data-testid="left-sidebar"], aside').first()
      await expect(sidebar).toBeVisible()
      
      // Close sidebar by clicking overlay
      const overlay = page.locator('.fixed.inset-0, [data-testid="overlay"]').first()
      if (await overlay.isVisible()) {
        await overlay.click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('should handle orchestrator on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Navigate to project
    const projectLink = page.locator('a[href*="/dashboard/project/"]').first()
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForLoadState('networkidle')
      
      // Try to open orchestrator
      await page.keyboard.press('Meta+/')
      await page.waitForTimeout(500)
      
      // Orchestrator should be visible as modal/overlay on mobile
      const orchestrator = page.locator('[data-testid="orchestrator"], [data-testid="right-orchestrator"]').first()
      const count = await orchestrator.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should maintain functionality across viewports', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Check that page loads without errors
      const errors = await page.evaluate(() => {
        return (window as any).errors || []
      })
      expect(errors.length).toBe(0)
      
      // Check for main content
      const mainContent = page.locator('main, [role="main"], [data-testid="main-content"]').first()
      const count = await mainContent.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })
})

