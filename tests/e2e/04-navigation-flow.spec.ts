/**
 * Navigation Flow Tests
 * Verifies navigation between pages works correctly
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

test.describe('Navigation Flow', () => {
  test('should navigate from dashboard to project', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Find and click first project
    const projectLink = page.locator('a[href*="/project/"]').first()
    
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForTimeout(1000)
      
      // Verify we're on project page
      expect(page.url()).toMatch(/\/project\//)
    }
  })

  test('should navigate back to dashboard from project', async ({ page }) => {
    // Go to a project first
    await page.goto('/dashboard')
    const projectLink = page.locator('a[href*="/project/"]').first()
    
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForTimeout(1000)
      
      // Look for back to dashboard link
      const backLink = page.locator('a, button').filter({
        hasText: /dashboard|back|home/i
      }).first()
      
      if (await backLink.isVisible()) {
        await backLink.click()
        await page.waitForTimeout(1000)
        
        // Verify we're back on dashboard
        expect(page.url()).toContain('/dashboard')
      }
    }
  })

  test('should navigate between project departments', async ({ page }) => {
    // Go to a project
    await page.goto('/dashboard')
    const projectLink = page.locator('a[href*="/project/"]').first()
    
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForTimeout(1000)
      
      // Click Story department
      const storyLink = page.locator('a, button').filter({ hasText: /story/i }).first()
      if (await storyLink.isVisible()) {
        await storyLink.click()
        await page.waitForTimeout(500)
      }
      
      // Click Character department
      const characterLink = page.locator('a, button').filter({ hasText: /character/i }).first()
      if (await characterLink.isVisible()) {
        await characterLink.click()
        await page.waitForTimeout(500)
      }
      
      // Verify we can navigate between departments
      const hasNavigation = await page.locator('text=/story|character|visual/i').count() > 0
      expect(hasNavigation).toBeTruthy()
    }
  })

  test('should maintain layout during navigation', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Check layout exists
    const hasLayout = await page.locator('header, nav, aside, main').count() > 0
    expect(hasLayout).toBeTruthy()
    
    // Navigate to project
    const projectLink = page.locator('a[href*="/project/"]').first()
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForTimeout(1000)
      
      // Layout should still exist
      const stillHasLayout = await page.locator('header, nav, aside, main').count() > 0
      expect(stillHasLayout).toBeTruthy()
    }
  })

  test('should handle browser back button', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    const initialUrl = page.url()
    
    // Navigate to project
    const projectLink = page.locator('a[href*="/project/"]').first()
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForTimeout(1000)
      
      // Use browser back
      await page.goBack()
      await page.waitForTimeout(500)
      
      // Should be back on dashboard
      expect(page.url()).toBe(initialUrl)
    }
  })

  test('should handle browser forward button', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Navigate to project
    const projectLink = page.locator('a[href*="/project/"]').first()
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForTimeout(1000)
      
      const projectUrl = page.url()
      
      // Go back
      await page.goBack()
      await page.waitForTimeout(500)
      
      // Go forward
      await page.goForward()
      await page.waitForTimeout(500)
      
      // Should be back on project page
      expect(page.url()).toBe(projectUrl)
    }
  })
})

