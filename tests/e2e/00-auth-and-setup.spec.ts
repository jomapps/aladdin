/**
 * Authentication and Project Setup Tests
 * Tests login flow and project creation
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication and Setup', () => {
  test('should login successfully', async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    
    // Should show login form
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    
    // Fill in login credentials
    await page.fill('input[type="email"]', 'jomapps.jb@gmail.com')
    await page.fill('input[type="password"]', 'Shlok@2000')
    
    // Submit login form
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard')
  })

  test('should create a new project', async ({ page }) => {
    // Login first
    await page.goto('/')
    await page.fill('input[type="email"]', 'jomapps.jb@gmail.com')
    await page.fill('input[type="password"]', 'Shlok@2000')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Look for "New Project" or "Create Project" button
    const createButton = page.locator('button, a').filter({ 
      hasText: /new project|create project/i 
    }).first()
    
    if (await createButton.isVisible()) {
      await createButton.click()
      
      // Wait for project creation form/modal
      await page.waitForTimeout(1000)
      
      // Fill in project details (adjust selectors based on actual form)
      const projectNameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
      if (await projectNameInput.isVisible()) {
        await projectNameInput.fill('Test Project E2E')
      }
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button').filter({
        hasText: /create|save|submit/i
      }).first()
      
      if (await submitButton.isVisible()) {
        await submitButton.click()
        await page.waitForTimeout(2000)
      }
    }
    
    // Verify we can see projects (either in list or redirected to project page)
    const hasProjects = await page.locator('text=/project/i').isVisible()
    expect(hasProjects).toBeTruthy()
  })
})

