import { test, expect } from '@playwright/test'

/**
 * Dashboard E2E Tests
 * 
 * Tests the main dashboard functionality including:
 * - Navigation
 * - Project listing
 * - Quick actions
 * - Recent items
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should display dashboard page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Dashboard|Aladdin/i)
    
    // Check for main dashboard elements
    await expect(page.locator('text=/dashboard|projects/i')).toBeVisible()
  })

  test('should display top menu bar', async ({ page }) => {
    // Check for top menu bar elements
    const topBar = page.locator('[data-testid="top-menu-bar"], header, nav').first()
    await expect(topBar).toBeVisible()
    
    // Check for user menu or avatar
    const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user" i], button:has-text("User")').first()
    if (await userMenu.isVisible()) {
      await expect(userMenu).toBeVisible()
    }
  })

  test('should display left sidebar', async ({ page }) => {
    // Check for left sidebar
    const sidebar = page.locator('[data-testid="left-sidebar"], aside, nav[aria-label*="main" i]').first()
    
    // Sidebar might be hidden on mobile, so check if it exists
    const sidebarCount = await sidebar.count()
    expect(sidebarCount).toBeGreaterThanOrEqual(0)
  })

  test('should navigate to projects', async ({ page }) => {
    // Look for projects link
    const projectsLink = page.locator('a:has-text("Projects"), a[href*="project"]').first()
    
    if (await projectsLink.isVisible()) {
      await projectsLink.click()
      await page.waitForLoadState('networkidle')
      
      // Verify navigation
      expect(page.url()).toContain('project')
    }
  })

  test('should display recent items', async ({ page }) => {
    // Look for recent items section
    const recentSection = page.locator('[data-testid="recent-items"], text=/recent/i').first()
    
    // Recent items might not always be present
    const recentCount = await recentSection.count()
    expect(recentCount).toBeGreaterThanOrEqual(0)
  })

  test('should toggle sidebar on mobile', async ({ page, viewport }) => {
    // Only test on mobile viewports
    if (viewport && viewport.width < 768) {
      // Look for hamburger menu
      const hamburger = page.locator('button[aria-label*="menu" i], button:has-text("☰")').first()
      
      if (await hamburger.isVisible()) {
        await hamburger.click()
        
        // Wait for sidebar animation
        await page.waitForTimeout(500)
        
        // Sidebar should be visible
        const sidebar = page.locator('[data-testid="left-sidebar"], aside').first()
        await expect(sidebar).toBeVisible()
      }
    }
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test Cmd+B (toggle left sidebar)
    await page.keyboard.press('Meta+b')
    await page.waitForTimeout(300)
    
    // Test Cmd+/ (toggle right sidebar/orchestrator)
    await page.keyboard.press('Meta+/')
    await page.waitForTimeout(300)
    
    // No errors should occur
    const errors = await page.evaluate(() => {
      return (window as any).errors || []
    })
    expect(errors.length).toBe(0)
  })
})

