/**
 * Authentication Helper for E2E Tests
 * 
 * Provides reusable authentication functions for Playwright tests
 */

import { Page, expect } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  name?: string
}

export const DEFAULT_TEST_USER: TestUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
}

/**
 * Login a user via the UI
 */
export async function loginUser(page: Page, user: TestUser = DEFAULT_TEST_USER): Promise<void> {
  await page.goto('/')
  
  // Wait for login form to be visible
  await page.waitForSelector('input[name="email"], input[type="email"]', { 
    timeout: 10000,
    state: 'visible'
  })
  
  // Fill in credentials
  await page.fill('input[name="email"], input[type="email"]', user.email)
  await page.fill('input[name="password"], input[type="password"]', user.password)
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  
  // Verify we're logged in
  await expect(page.locator('text=/Welcome|Dashboard|Aladdin/i')).toBeVisible({ timeout: 5000 })
}

/**
 * Login via API (faster for tests that don't need to test login UI)
 */
export async function loginUserAPI(page: Page, user: TestUser = DEFAULT_TEST_USER): Promise<void> {
  const response = await page.request.post('/api/users/login', {
    data: {
      email: user.email,
      password: user.password
    }
  })
  
  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`)
  }
  
  // Navigate to dashboard
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
}

/**
 * Logout a user
 */
export async function logoutUser(page: Page): Promise<void> {
  // Look for logout button
  const logoutButton = page.locator(
    'button:has-text("Sign Out"), button:has-text("Logout"), button:has-text("Log Out")'
  )
  
  if (await logoutButton.count() > 0) {
    await logoutButton.first().click()
    
    // Wait for redirect to homepage
    await page.waitForURL('/', { timeout: 10000 })
    
    // Verify we're logged out
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
  } else {
    // Try API logout
    await page.request.post('/api/auth/logout')
    await page.goto('/')
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto('/dashboard')
  
  // If redirected to homepage, not authenticated
  await page.waitForTimeout(2000)
  const url = page.url()
  
  return url.includes('/dashboard')
}

/**
 * Create a test user via API (for test setup)
 */
export async function createTestUser(page: Page, user: TestUser): Promise<void> {
  // This would call your user creation API
  // Implementation depends on your backend
  const response = await page.request.post('/api/users/register', {
    data: {
      email: user.email,
      password: user.password,
      name: user.name || 'Test User'
    }
  })
  
  if (!response.ok() && response.status() !== 409) { // 409 = already exists
    throw new Error(`Failed to create test user: ${response.status()}`)
  }
}

/**
 * Delete a test user via API (for test cleanup)
 */
export async function deleteTestUser(page: Page, email: string): Promise<void> {
  // This would call your user deletion API
  // Implementation depends on your backend
  await page.request.delete(`/api/users/${encodeURIComponent(email)}`)
}

/**
 * Setup authenticated context for tests
 */
export async function setupAuthenticatedContext(page: Page, user: TestUser = DEFAULT_TEST_USER): Promise<void> {
  try {
    // Try API login first (faster)
    await loginUserAPI(page, user)
  } catch (error) {
    // Fallback to UI login
    await loginUser(page, user)
  }
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForFunction(
    () => {
      // Check for auth indicators
      return document.cookie.includes('payload-token') || 
             document.querySelector('[data-authenticated="true"]') !== null
    },
    { timeout }
  )
}

/**
 * Get authentication token from cookies
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies()
  const authCookie = cookies.find(c => c.name === 'payload-token')
  return authCookie?.value || null
}

/**
 * Set authentication token in cookies
 */
export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.context().addCookies([{
    name: 'payload-token',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax'
  }])
}

/**
 * Clear authentication
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.context().clearCookies()
  await page.goto('/')
}

