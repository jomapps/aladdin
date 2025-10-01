/**
 * Page Loading Tests
 * Verifies all pages load successfully and key components are present
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

test.describe('Page Loading', () => {
  test('should load login page', async ({ page }) => {
    // Logout or go to home
    await page.goto('/')
    
    // Verify login page components
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should load dashboard page', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Verify page loaded
    expect(page.url()).toContain('/dashboard')
    
    // Check for main layout components
    await expect(page.locator('body')).toBeVisible()
    
    // Should have some content (projects, cards, etc.)
    const hasContent = await page.locator('main, [role="main"], .main-content').count() > 0
    expect(hasContent).toBeTruthy()
  })

  test('should load dashboard with top menu bar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Look for top menu/header elements
    const header = page.locator('header, nav, [role="banner"]').first()
    const hasHeader = await header.count() > 0
    expect(hasHeader).toBeTruthy()
  })

  test('should load dashboard with left sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Look for sidebar elements
    const sidebar = page.locator('aside, [role="navigation"], .sidebar').first()
    const hasSidebar = await sidebar.count() > 0
    expect(hasSidebar).toBeTruthy()
  })

  test('should load dashboard with recent items section', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Look for recent items or activity
    const hasRecentSection = await page.locator('text=/recent/i').count() > 0
    expect(hasRecentSection).toBeTruthy()
  })
})

