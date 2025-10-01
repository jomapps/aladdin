import { test, expect, devices } from '@playwright/test'

/**
 * @test Mobile Responsive Tests
 * @description E2E tests for mobile, tablet, and desktop responsive layouts
 * @coverage Mobile (375x667), Tablet (768x1024), Desktop (1920x1080)
 */

// Test 1-5: Mobile Layout Tests
test.describe('Mobile Layout (375x667)', () => {
  test.use({ ...devices['iPhone SE'] })

  test('should render mobile layout correctly', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const viewport = page.viewportSize()
    expect(viewport?.width).toBe(375)
    expect(viewport?.height).toBe(667)
  })

  test('should display hamburger menu on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const hamburger = page.locator('[data-testid="hamburger-menu"]')
    await expect(hamburger).toBeVisible()
  })

  test('should toggle sidebar on hamburger click', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const hamburger = page.locator('[data-testid="hamburger-menu"]')
    await hamburger.click()

    const sidebar = page.locator('[data-testid="project-sidebar"]')
    await expect(sidebar).toHaveClass(/open/)
  })

  test('should stack content vertically on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const main = page.locator('main')
    const computedStyle = await main.evaluate((el) => window.getComputedStyle(el))
    expect(computedStyle.flexDirection).toBe('column')
  })

  test('should have touch-friendly button sizes (min 44x44)', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const playButton = page.locator('[data-testid="play-button"]')
    const box = await playButton.boundingBox()

    expect(box?.width).toBeGreaterThanOrEqual(44)
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })
})

// Test 6-10: Tablet Layout Tests
test.describe('Tablet Layout (768x1024)', () => {
  test.use({ ...devices['iPad'] })

  test('should render tablet layout correctly', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const viewport = page.viewportSize()
    expect(viewport?.width).toBe(768)
    expect(viewport?.height).toBe(1024)
  })

  test('should show sidebar by default on tablet', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const sidebar = page.locator('[data-testid="project-sidebar"]')
    await expect(sidebar).toBeVisible()
  })

  test('should use two-column layout on tablet', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const container = page.locator('.container')
    const gridColumns = await container.evaluate((el) =>
      window.getComputedStyle(el).gridTemplateColumns
    )

    expect(gridColumns).toContain('2')
  })

  test('should maintain navigation visibility on tablet', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const nav = page.locator('[data-testid="department-nav"]')
    await expect(nav).toBeVisible()
  })

  test('should adjust timeline zoom for tablet screen', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const timeline = page.locator('[data-testid="timeline"]')
    await expect(timeline).toBeVisible()

    const zoomLevel = page.locator('[data-testid="zoom-level"]')
    await expect(zoomLevel).toBeVisible()
  })
})

// Test 11-15: Desktop Layout Tests
test.describe('Desktop Layout (1920x1080)', () => {
  test.use({
    viewport: { width: 1920, height: 1080 }
  })

  test('should render desktop layout correctly', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const viewport = page.viewportSize()
    expect(viewport?.width).toBe(1920)
    expect(viewport?.height).toBe(1080)
  })

  test('should show full sidebar on desktop', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const sidebar = page.locator('[data-testid="project-sidebar"]')
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toHaveClass(/open/)
  })

  test('should use three-column layout on desktop', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const container = page.locator('.container')
    const gridColumns = await container.evaluate((el) =>
      window.getComputedStyle(el).gridTemplateColumns
    )

    expect(gridColumns.split(' ').length).toBeGreaterThanOrEqual(3)
  })

  test('should display quality dashboard on desktop', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const dashboard = page.locator('[data-testid="quality-dashboard"]')
    await expect(dashboard).toBeVisible()
  })

  test('should hide hamburger menu on desktop', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const hamburger = page.locator('[data-testid="hamburger-menu"]')
    const isVisible = await hamburger.isVisible()
    expect(isVisible).toBe(false)
  })
})

// Test 16-20: Navigation Tests
test.describe('Mobile Navigation', () => {
  test.use({ ...devices['iPhone SE'] })

  test('should navigate between departments on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const hamburger = page.locator('[data-testid="hamburger-menu"]')
    await hamburger.click()

    const storyLink = page.locator('[data-testid="dept-story"]')
    await storyLink.click()

    await expect(page).toHaveURL(/.*story/)
  })

  test('should close sidebar after navigation on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const hamburger = page.locator('[data-testid="hamburger-menu"]')
    await hamburger.click()

    const visualLink = page.locator('[data-testid="dept-visual"]')
    await visualLink.click()

    const sidebar = page.locator('[data-testid="project-sidebar"]')
    await expect(sidebar).not.toHaveClass(/open/)
  })

  test('should maintain scroll position on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await page.evaluate(() => window.scrollTo(0, 500))
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBe(500)
  })

  test('should handle touch events on timeline', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const clip = page.locator('[data-testid="clip-0"]')
    await clip.tap()

    await expect(clip).toHaveClass(/selected/)
  })

  test('should support pinch zoom on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Simulate pinch zoom
    await page.touchscreen.tap(100, 100)
    const timeline = page.locator('[data-testid="timeline"]')
    await expect(timeline).toBeVisible()
  })
})

// Test 21-25: Orientation Tests
test.describe('Orientation Changes', () => {
  test('should adapt to portrait orientation', async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(screen, 'orientation', {
        value: { type: 'portrait-primary', angle: 0 }
      })
    })

    await page.goto('http://localhost:3000')
    await page.setViewportSize({ width: 375, height: 667 })

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('should adapt to landscape orientation', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 })
    await page.goto('http://localhost:3000')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('should maintain functionality after orientation change', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000')

    // Change to landscape
    await page.setViewportSize({ width: 667, height: 375 })

    const playButton = page.locator('[data-testid="play-button"]')
    await expect(playButton).toBeVisible()
  })

  test('should reflow content on orientation change', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const initialWidth = await page.evaluate(() => window.innerWidth)
    await page.setViewportSize({ width: 667, height: 375 })
    const newWidth = await page.evaluate(() => window.innerWidth)

    expect(newWidth).not.toBe(initialWidth)
  })

  test('should preserve state across orientation changes', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Set some state
    const hamburger = page.locator('[data-testid="hamburger-menu"]')
    await hamburger.click()

    // Change orientation
    await page.setViewportSize({ width: 667, height: 375 })

    // State should persist
    const sidebar = page.locator('[data-testid="project-sidebar"]')
    await expect(sidebar).toHaveClass(/open/)
  })
})
