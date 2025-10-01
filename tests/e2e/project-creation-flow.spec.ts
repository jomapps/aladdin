/**
 * Project Creation Flow E2E Test
 * 
 * Tests the complete workflow:
 * 1. Open dashboard
 * 2. Create a project
 * 3. Save the project
 * 4. View the project in the list
 */

import { test, expect, Page } from '@playwright/test'

const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
}

/**
 * Login helper
 */
async function loginUser(page: Page) {
  await page.goto('/')
  
  // Wait for login form
  await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 })
  
  // Fill credentials
  await page.fill('input[name="email"], input[type="email"]', TEST_USER.email)
  await page.fill('input[name="password"], input[type="password"]', TEST_USER.password)
  
  // Submit
  await page.click('button[type="submit"]')
  
  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

test.describe('Project Creation Flow', () => {
  test('should create a project and see it in the list', async ({ page }) => {
    // Step 1: Login and open dashboard
    console.log('Step 1: Opening dashboard...')
    await loginUser(page)
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    console.log('✓ Dashboard opened')
    
    // Step 2: Click "Create Project" button
    console.log('Step 2: Opening create project dialog...')
    const createButton = page.locator('button:has-text("Create Project"), button:has-text("New Project")')
    await expect(createButton.first()).toBeVisible({ timeout: 10000 })
    await createButton.first().click()
    
    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"], [class*="dialog"]', { timeout: 5000 })
    console.log('✓ Create project dialog opened')
    
    // Step 3: Fill in project details
    console.log('Step 3: Filling in project details...')
    const projectName = `Test Project ${Date.now()}`
    const projectDescription = 'A test project created by Playwright E2E test'
    
    // Fill project name
    const nameInput = page.locator('input[id="name"], input[name="name"]')
    await expect(nameInput).toBeVisible()
    await nameInput.fill(projectName)
    console.log(`✓ Project name: ${projectName}`)
    
    // Fill description (if field exists)
    const descriptionField = page.locator('textarea[id="description"], textarea[name="description"]')
    if (await descriptionField.count() > 0) {
      await descriptionField.fill(projectDescription)
      console.log(`✓ Description: ${projectDescription}`)
    }
    
    // Select type (if dropdown exists)
    const typeSelect = page.locator('select[id="type"], [id="type"]')
    if (await typeSelect.count() > 0) {
      // Try to select "Movie" option
      const movieOption = page.locator('text="Movie"')
      if (await movieOption.count() > 0) {
        await movieOption.click()
        console.log('✓ Type: Movie')
      }
    }
    
    // Fill genre (if field exists)
    const genreInput = page.locator('input[id="genre"], input[name="genre"]')
    if (await genreInput.count() > 0) {
      await genreInput.fill('Fantasy')
      console.log('✓ Genre: Fantasy')
    }
    
    // Step 4: Submit the form
    console.log('Step 4: Submitting project creation...')
    
    // Listen for API call
    const projectCreationPromise = page.waitForResponse(
      response => response.url().includes('/api/v1/projects') && response.request().method() === 'POST',
      { timeout: 15000 }
    )
    
    // Click create button
    const submitButton = page.locator('button[type="submit"]:has-text("Create")')
    await expect(submitButton).toBeVisible()
    await submitButton.click()
    
    // Wait for API response
    const response = await projectCreationPromise
    const responseData = await response.json()
    
    console.log('API Response:', responseData)
    
    // Check if creation was successful
    if (response.status() === 201 || response.status() === 200) {
      console.log('✓ Project created successfully!')
      console.log(`  Project ID: ${responseData.id}`)
      console.log(`  Project Name: ${responseData.name}`)
    } else {
      console.error('✗ Project creation failed!')
      console.error(`  Status: ${response.status()}`)
      console.error(`  Error: ${responseData.error || 'Unknown error'}`)
      throw new Error(`Project creation failed: ${responseData.error || 'Unknown error'}`)
    }
    
    // Wait for dialog to close or redirect
    await page.waitForTimeout(2000)
    
    // Step 5: Check if we were redirected to project page OR if we're still on dashboard
    const currentUrl = page.url()
    console.log(`Current URL: ${currentUrl}`)
    
    if (currentUrl.includes('/dashboard/project/')) {
      console.log('✓ Redirected to project page')
      
      // Verify project page loaded
      await expect(page.locator(`text="${projectName}"`)).toBeVisible({ timeout: 10000 })
      console.log('✓ Project page shows project name')
      
      // Go back to dashboard to check project list
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    } else {
      console.log('✓ Stayed on dashboard')
    }
    
    // Step 6: Verify project appears in the list
    console.log('Step 5: Checking if project appears in list...')
    
    // Look for the project name on the page
    const projectInList = page.locator(`text="${projectName}"`)
    
    // Wait a bit for the page to update
    await page.waitForTimeout(2000)
    
    // Check if project is visible
    const isVisible = await projectInList.isVisible().catch(() => false)
    
    if (isVisible) {
      console.log('✓ Project appears in the list!')
    } else {
      console.log('⚠ Project not immediately visible, checking if we need to navigate...')
      
      // Try clicking "Projects" or "View Projects" button if it exists
      const viewProjectsButton = page.locator('button:has-text("Projects"), a:has-text("Projects"), button:has-text("View Projects")')
      if (await viewProjectsButton.count() > 0) {
        await viewProjectsButton.first().click()
        await page.waitForTimeout(2000)
        
        // Check again
        await expect(projectInList).toBeVisible({ timeout: 10000 })
        console.log('✓ Project appears in the projects list!')
      } else {
        // Try to find any project cards or list items
        const projectCards = page.locator('[data-testid="project-card"], [class*="project"], [class*="card"]')
        const cardCount = await projectCards.count()
        console.log(`Found ${cardCount} project cards/items on page`)
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'test-results/project-list-debug.png', fullPage: true })
        console.log('Screenshot saved to test-results/project-list-debug.png')
        
        // Check if our project is anywhere on the page
        const pageContent = await page.content()
        if (pageContent.includes(projectName)) {
          console.log('✓ Project name found in page content!')
        } else {
          console.log('✗ Project name not found in page content')
          throw new Error('Project was created but does not appear in the list')
        }
      }
    }
    
    console.log('\n✅ Complete workflow test passed!')
    console.log('Summary:')
    console.log('  1. ✓ Opened dashboard')
    console.log('  2. ✓ Opened create project dialog')
    console.log('  3. ✓ Filled in project details')
    console.log('  4. ✓ Submitted and created project')
    console.log('  5. ✓ Project appears in list')
  })

  test('should handle project creation errors gracefully', async ({ page }) => {
    console.log('Testing error handling...')
    await loginUser(page)
    
    // Open create dialog
    const createButton = page.locator('button:has-text("Create Project"), button:has-text("New Project")')
    await createButton.first().click()
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    
    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]:has-text("Create")')
    
    // Check if submit button is disabled when form is empty
    const isDisabled = await submitButton.isDisabled()
    
    if (isDisabled) {
      console.log('✓ Submit button is disabled when form is empty')
    } else {
      // If not disabled, try to submit and expect validation error
      await submitButton.click()
      
      // Look for error message
      const errorMessage = page.locator('text=/required|error|invalid/i')
      await expect(errorMessage).toBeVisible({ timeout: 5000 })
      console.log('✓ Validation error shown for empty form')
    }
  })

  test('should allow canceling project creation', async ({ page }) => {
    console.log('Testing cancel functionality...')
    await loginUser(page)
    
    // Open create dialog
    const createButton = page.locator('button:has-text("Create Project"), button:has-text("New Project")')
    await createButton.first().click()
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    
    // Fill in some data
    const nameInput = page.locator('input[id="name"], input[name="name"]')
    await nameInput.fill('Project to Cancel')
    
    // Click cancel
    const cancelButton = page.locator('button:has-text("Cancel")')
    if (await cancelButton.count() > 0) {
      await cancelButton.click()
      
      // Dialog should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 })
      console.log('✓ Dialog closed after cancel')
    } else {
      // Try escape key
      await page.keyboard.press('Escape')
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 })
      console.log('✓ Dialog closed with Escape key')
    }
  })
})

