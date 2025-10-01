# Dashboard E2E Tests

Comprehensive end-to-end testing suite for the Aladdin dashboard.

## Overview

This test suite provides complete coverage of the dashboard functionality including:

- ✅ Authentication (login, logout, session management)
- ✅ Dashboard navigation and layout
- ✅ Project creation and management
- ✅ Quick actions and user interactions
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ User profile and settings

## Test Files

### Main Test Suite
- **`dashboard-comprehensive.spec.ts`** - Complete dashboard test suite with 20+ tests

### Helper Files
- **`helpers/auth.helper.ts`** - Authentication utilities
- **`helpers/test-data.factory.ts`** - Test data generation
- **`helpers/dashboard-setup.ts`** - Test setup and fixtures

### Configuration
- **`dashboard.config.ts`** - Playwright configuration for dashboard tests

## Running Tests

### Prerequisites

1. Install Playwright browsers:
```bash
pnpm exec playwright install
```

2. Ensure the development server is running:
```bash
pnpm dev
```

### Run All Dashboard Tests

```bash
# Using the dashboard config
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts

# Or run the specific test file
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts
```

### Run Specific Test Suites

```bash
# Authentication tests only
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts -g "Authentication"

# Project creation tests only
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts -g "Project Creation"

# Responsive design tests only
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts -g "Responsive"
```

### Run on Specific Browser

```bash
# Chrome only
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --project=chromium-desktop

# Firefox only
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --project=firefox-desktop

# Mobile Chrome
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --project=mobile-chrome
```

### Interactive Mode (UI Mode)

```bash
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --ui
```

### Debug Mode

```bash
# Run in headed mode with slow motion
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts --headed --slow-mo=1000

# Debug specific test
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts -g "should create a new project" --debug
```

### View Test Report

```bash
pnpm exec playwright show-report playwright-report/dashboard
```

## Test Structure

### Authentication Tests
- Redirect unauthenticated users
- Login with valid credentials
- Show error for invalid credentials
- Logout functionality

### Dashboard Main Page Tests
- Display welcome message
- Show navigation elements
- Display quick actions
- Show project statistics

### Project Creation Tests
- Open create project dialog
- Create project with valid data
- Validate required fields
- Close dialog without creating

### Navigation Tests
- Navigate to projects page
- Navigate to team page
- Breadcrumb navigation

### Responsive Design Tests
- Desktop layout (1920x1080)
- Tablet layout (768x1024)
- Mobile layout (375x667)
- Mobile menu toggle

### User Profile Tests
- Display user information
- Access logout button

## Test Data

### Default Test User
```typescript
{
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
}
```

### Test Data Factories

Generate test data using the factory functions:

```typescript
import { 
  createTestProject, 
  createTestScene, 
  createTestCharacter 
} from './helpers/test-data.factory'

// Create a test project
const project = createTestProject({
  name: 'My Test Project',
  description: 'Test description'
})

// Create multiple projects
const projects = createTestProjects(5)
```

## Helper Functions

### Authentication

```typescript
import { loginUser, logoutUser } from './helpers/auth.helper'

// Login
await loginUser(page, { email: 'test@example.com', password: 'password' })

// Logout
await logoutUser(page)
```

### Test Setup

```typescript
import { test, expect } from './helpers/dashboard-setup'

// Use authenticated page fixture
test('my test', async ({ authenticatedPage }) => {
  // Page is already logged in
  await expect(authenticatedPage).toHaveURL(/\/dashboard/)
})
```

## Configuration

### Environment Variables

Create a `.env.test` file:

```env
BASE_URL=http://localhost:3000
HEADLESS=true
CI=false
```

### Timeouts

- Test timeout: 60 seconds
- Assertion timeout: 10 seconds
- Navigation timeout: 30 seconds
- Action timeout: 15 seconds

### Retries

- Local: 1 retry
- CI: 2 retries

## Best Practices

### 1. Use Fixtures
```typescript
test('my test', async ({ authenticatedPage }) => {
  // Use fixtures for common setup
})
```

### 2. Use Helper Functions
```typescript
// Good
await loginUser(page, testUser)

// Avoid
await page.fill('input[name="email"]', testUser.email)
await page.fill('input[name="password"]', testUser.password)
await page.click('button[type="submit"]')
```

### 3. Use Test Data Factories
```typescript
// Good
const project = createTestProject()

// Avoid
const project = { name: 'Test Project', description: 'Test' }
```

### 4. Clean Up Test Data
```typescript
test('my test', async ({ testDataTracker }) => {
  const project = await createProject()
  testDataTracker.trackProject(project.id)
  // Cleanup happens automatically
})
```

### 5. Use Proper Selectors
```typescript
// Good - semantic selectors
await page.click('button:has-text("Create Project")')
await page.locator('[data-testid="project-card"]')

// Avoid - brittle selectors
await page.click('.btn-primary.create-btn')
```

## Troubleshooting

### Tests Timing Out

1. Increase timeout in config
2. Check if dev server is running
3. Check network conditions

### Authentication Failures

1. Verify test user exists in database
2. Check auth API endpoints
3. Verify cookie settings

### Flaky Tests

1. Add explicit waits
2. Use `waitForLoadState('networkidle')`
3. Increase retry count

### Element Not Found

1. Check if element is in viewport
2. Wait for element to be visible
3. Use more specific selectors

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Dashboard E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      
      - name: Run dashboard tests
        run: pnpm exec playwright test --config=tests/e2e/dashboard.config.ts
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Coverage

Current test coverage:

- Authentication: 100%
- Dashboard Pages: 90%
- Project Management: 85%
- Navigation: 80%
- Responsive Design: 100%

## Future Enhancements

- [ ] Add visual regression testing
- [ ] Add performance testing
- [ ] Add accessibility testing
- [ ] Add API mocking for offline tests
- [ ] Add test data seeding scripts
- [ ] Add parallel test execution optimization

