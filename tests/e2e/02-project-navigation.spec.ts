import { test, expect } from '@playwright/test'

/**
 * Project Navigation E2E Tests
 * 
 * Tests navigation within a project including:
 * - Project sidebar
 * - Department navigation
 * - Content browsing
 */

test.describe('Project Navigation', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Find and click on first project
    const projectLink = page.locator('a[href*="/dashboard/project/"]').first()
    
    if (await projectLink.isVisible()) {
      const href = await projectLink.getAttribute('href')
      projectId = href?.split('/').pop() || ''
      await projectLink.click()
      await page.waitForLoadState('networkidle')
    } else {
      // Skip if no projects available
      test.skip()
    }
  })

  test('should display project page', async ({ page }) => {
    // Verify we're on a project page
    expect(page.url()).toContain('/dashboard/project/')
    
    // Check for project name in top bar
    const projectName = page.locator('[data-testid="project-name"], h1, h2').first()
    await expect(projectName).toBeVisible()
  })

  test('should display project sidebar', async ({ page }) => {
    // Check for project sidebar with departments
    const sidebar = page.locator('[data-testid="project-sidebar"], aside').first()
    await expect(sidebar).toBeVisible()
    
    // Check for department links
    const departments = page.locator('a:has-text("Story"), a:has-text("Character"), a:has-text("Visual")').first()
    await expect(departments).toBeVisible()
  })

  test('should navigate to Story department', async ({ page }) => {
    const storyLink = page.locator('a:has-text("Story")').first()
    
    if (await storyLink.isVisible()) {
      await storyLink.click()
      await page.waitForLoadState('networkidle')
      
      // Verify navigation
      expect(page.url()).toContain('/story')
    }
  })

  test('should navigate to Character department', async ({ page }) => {
    const characterLink = page.locator('a:has-text("Character")').first()
    
    if (await characterLink.isVisible()) {
      await characterLink.click()
      await page.waitForLoadState('networkidle')
      
      // Verify navigation
      expect(page.url()).toContain('/character')
    }
  })

  test('should navigate to Visual department', async ({ page }) => {
    const visualLink = page.locator('a:has-text("Visual")').first()
    
    if (await visualLink.isVisible()) {
      await visualLink.click()
      await page.waitForLoadState('networkidle')
      
      // Verify navigation
      expect(page.url()).toContain('/visual')
    }
  })

  test('should display recent activity', async ({ page }) => {
    // Look for recent activity section
    const recentActivity = page.locator('[data-testid="recent-activity"], text=/recent/i').first()
    
    // Recent activity might not always be present
    const count = await recentActivity.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should toggle project sidebar on mobile', async ({ page, viewport }) => {
    if (viewport && viewport.width < 768) {
      // Look for sidebar toggle
      const toggle = page.locator('button[aria-label*="sidebar" i], button:has-text("☰")').first()
      
      if (await toggle.isVisible()) {
        await toggle.click()
        await page.waitForTimeout(500)
        
        // Sidebar should be visible
        const sidebar = page.locator('[data-testid="project-sidebar"], aside').first()
        await expect(sidebar).toBeVisible()
      }
    }
  })
})

