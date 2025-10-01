/**
 * Comprehensive Dashboard E2E Tests
 * 
 * Tests the complete dashboard functionality including:
 * - Authentication flow
 * - Dashboard navigation
 * - Project creation and management
 * - Quick actions
 * - User profile and logout
 * - Responsive behavior
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
}

const BASE_URL = 'http://localhost:3000'

/**
 * Authentication helper - logs in a user
 */
async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/')
  
  // Wait for login form
  await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 })
  
  // Fill in credentials
  await page.fill('input[name="email"], input[type="email"]', email)
  await page.fill('input[name="password"], input[type="password"]', password)
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

/**
 * Logout helper
 */
async function logoutUser(page: Page) {
  // Look for logout button (could be in nav or menu)
  const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), button:has-text("Log Out")')
  
  if (await logoutButton.count() > 0) {
    await logoutButton.first().click()
    await page.waitForURL('/', { timeout: 10000 })
  }
}

test.describe('Dashboard - Authentication', () => {
  test('should redirect unauthenticated users to homepage', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to homepage
    await page.waitForURL('/', { timeout: 10000 })
    
    // Should show login form
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
  })

  test('should allow user to login and access dashboard', async ({ page }) => {
    await loginUser(page, TEST_USER.email, TEST_USER.password)
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Verify dashboard content is visible
    await expect(page.locator('text=/Welcome back|Dashboard|Aladdin/i')).toBeVisible()
  })

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.goto('/')
    
    await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com')
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=/invalid|error|failed|incorrect/i')).toBeVisible({ timeout: 5000 })
  })

  test('should logout user successfully', async ({ page }) => {
    await loginUser(page, TEST_USER.email, TEST_USER.password)
    
    // Logout
    await logoutUser(page)
    
    // Should be back on homepage
    await expect(page).toHaveURL('/')
    
    // Try to access dashboard - should redirect
    await page.goto('/dashboard')
    await page.waitForURL('/', { timeout: 10000 })
  })
})

test.describe('Dashboard - Main Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_USER.email, TEST_USER.password)
  })

  test('should display welcome message with user name', async ({ page }) => {
    // Check for welcome message
    const welcomeText = page.locator('text=/Welcome back/i')
    await expect(welcomeText).toBeVisible()
  })

  test('should display dashboard navigation', async ({ page }) => {
    // Check for Aladdin branding
    await expect(page.locator('text=Aladdin')).toBeVisible()
    
    // Check for user info in nav
    await expect(page.locator('text=' + TEST_USER.email)).toBeVisible()
  })

  test('should display quick actions section', async ({ page }) => {
    // Look for quick action cards
    const quickActions = page.locator('text=/New Project|Quick Actions|Create/i')
    await expect(quickActions.first()).toBeVisible()
  })

  test('should display project statistics cards', async ({ page }) => {
    // Look for stat cards (Projects, Scenes, etc.)
    const statsSection = page.locator('[class*="card"], [class*="Card"]')
    await expect(statsSection.first()).toBeVisible()
  })
})

test.describe('Dashboard - Project Creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_USER.email, TEST_USER.password)
  })

  test('should open create project dialog', async ({ page }) => {
    // Click on New Project button
    const newProjectButton = page.locator('button:has-text("New Project"), button:has-text("Create Project")')
    await newProjectButton.first().click()
    
    // Dialog should open
    await expect(page.locator('[role="dialog"], [class*="dialog"]')).toBeVisible({ timeout: 5000 })
  })

  test('should create a new project with valid data', async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`
    const projectDescription = 'A test project for E2E testing'
    
    // Open dialog
    const newProjectButton = page.locator('button:has-text("New Project"), button:has-text("Create Project")')
    await newProjectButton.first().click()
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"], [class*="dialog"]', { timeout: 5000 })
    
    // Fill in project details
    await page.fill('input[name="name"], input[placeholder*="name" i]', projectName)
    
    const descriptionField = page.locator('textarea[name="description"], textarea[placeholder*="description" i]')
    if (await descriptionField.count() > 0) {
      await descriptionField.fill(projectDescription)
    }
    
    // Submit
    await page.click('button[type="submit"], button:has-text("Create")')
    
    // Should redirect to project page or show success
    await page.waitForTimeout(2000)
    
    // Verify project was created (either redirected or see it in list)
    const projectExists = await page.locator(`text="${projectName}"`).count() > 0
    expect(projectExists).toBeTruthy()
  })

  test('should validate required fields in project creation', async ({ page }) => {
    // Open dialog
    const newProjectButton = page.locator('button:has-text("New Project"), button:has-text("Create Project")')
    await newProjectButton.first().click()
    
    await page.waitForSelector('[role="dialog"], [class*="dialog"]', { timeout: 5000 })
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"], button:has-text("Create")')
    
    // Should show validation error
    await expect(page.locator('text=/required|enter|provide/i')).toBeVisible({ timeout: 3000 })
  })

  test('should close project creation dialog', async ({ page }) => {
    // Open dialog
    const newProjectButton = page.locator('button:has-text("New Project"), button:has-text("Create Project")')
    await newProjectButton.first().click()
    
    await page.waitForSelector('[role="dialog"], [class*="dialog"]', { timeout: 5000 })
    
    // Close dialog (X button or Cancel)
    const closeButton = page.locator('button:has-text("Cancel"), button[aria-label="Close"]')
    if (await closeButton.count() > 0) {
      await closeButton.first().click()
    } else {
      await page.keyboard.press('Escape')
    }
    
    // Dialog should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe('Dashboard - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_USER.email, TEST_USER.password)
  })

  test('should navigate to projects page', async ({ page }) => {
    const projectsLink = page.locator('a:has-text("Projects"), button:has-text("Projects")')
    
    if (await projectsLink.count() > 0) {
      await projectsLink.first().click()
      await page.waitForTimeout(1000)
      
      // Should show projects content
      await expect(page.locator('text=/Project|All Projects/i')).toBeVisible()
    }
  })

  test('should navigate to team page', async ({ page }) => {
    const teamLink = page.locator('a:has-text("Team"), button:has-text("Team")')
    
    if (await teamLink.count() > 0) {
      await teamLink.first().click()
      await page.waitForURL('**/team', { timeout: 5000 })
    }
  })
})

test.describe('Dashboard - Responsive Design', () => {
  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await loginUser(page, TEST_USER.email, TEST_USER.password)
    
    // Desktop layout should be visible
    await expect(page.locator('body')).toBeVisible()
    
    // Navigation should be visible
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible()
  })

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await loginUser(page, TEST_USER.email, TEST_USER.password)
    
    // Page should load
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginUser(page, TEST_USER.email, TEST_USER.password)
    
    // Page should load
    await expect(page.locator('body')).toBeVisible()
    
    // Mobile menu button should be visible
    const mobileMenuButton = page.locator('button[aria-label*="menu" i], button:has-text("Menu")')
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton.first()).toBeVisible()
    }
  })

  test('should toggle mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginUser(page, TEST_USER.email, TEST_USER.password)
    
    // Find and click mobile menu button
    const mobileMenuButton = page.locator('button[aria-label*="menu" i], button:has-text("Menu")')
    
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.first().click()
      await page.waitForTimeout(500)
      
      // Menu should be visible
      const menu = page.locator('[role="menu"], [class*="mobile"]')
      if (await menu.count() > 0) {
        await expect(menu.first()).toBeVisible()
      }
    }
  })
})

test.describe('Dashboard - User Profile', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_USER.email, TEST_USER.password)
  })

  test('should display user email in navigation', async ({ page }) => {
    await expect(page.locator(`text="${TEST_USER.email}"`)).toBeVisible()
  })

  test('should have logout button accessible', async ({ page }) => {
    const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout")')
    await expect(logoutButton.first()).toBeVisible()
  })
})

