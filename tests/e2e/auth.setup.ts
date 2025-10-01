import { test as setup, expect } from '@playwright/test'
import path from 'path'

/**
 * Authentication Setup for E2E Tests
 * 
 * This file handles login and saves the authenticated state
 * so other tests can reuse it without logging in again.
 */

const authFile = path.join(__dirname, '../.auth/user.json')

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/')
  
  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  
  // Fill in credentials
  await page.fill('input[type="email"]', 'jomapps.jb@gmail.com')
  await page.fill('input[type="password"]', 'Shlok@2000')
  
  // Click login button
  await page.click('button[type="submit"]')
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 })
  
  // Verify we're logged in by checking for user menu or dashboard elements
  await expect(page.locator('text=/dashboard|projects/i')).toBeVisible({ timeout: 10000 })
  
  // Save authenticated state
  await page.context().storageState({ path: authFile })
  
  console.log('✅ Authentication successful - state saved')
})

