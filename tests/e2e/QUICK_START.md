# Dashboard E2E Tests - Quick Start Guide

Get started with dashboard testing in 5 minutes!

## 🚀 Quick Setup

### 1. Install Playwright Browsers

```bash
pnpm exec playwright install
```

### 2. Start Development Server

```bash
pnpm dev
```

### 3. Run Dashboard Tests

```bash
# Run all dashboard tests
pnpm test:e2e:dashboard

# Run in UI mode (recommended for first time)
pnpm test:e2e:dashboard:ui

# Run in headed mode (see the browser)
pnpm test:e2e:dashboard:headed
```

## 📋 Test Commands

### Basic Commands

```bash
# Run all dashboard tests
pnpm test:e2e:dashboard

# Run specific test file
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts

# Run specific test suite
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts -g "Authentication"

# Run on specific browser
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --project=chromium-desktop
```

### Interactive Commands

```bash
# UI Mode - Interactive test runner
pnpm test:e2e:dashboard:ui

# Headed Mode - See browser actions
pnpm test:e2e:dashboard:headed

# Debug Mode - Step through tests
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts --debug
```

### Report Commands

```bash
# View test report
pnpm exec playwright show-report playwright-report/dashboard

# Generate report
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --reporter=html
```

## 🧪 Test Coverage

The dashboard test suite covers:

### ✅ Authentication (4 tests)
- Redirect unauthenticated users
- Login with valid credentials
- Show error for invalid credentials
- Logout functionality

### ✅ Dashboard Main Page (4 tests)
- Display welcome message
- Show navigation elements
- Display quick actions
- Show project statistics

### ✅ Project Creation (4 tests)
- Open create project dialog
- Create project with valid data
- Validate required fields
- Close dialog

### ✅ Navigation (2 tests)
- Navigate to projects page
- Navigate to team page

### ✅ Responsive Design (4 tests)
- Desktop layout
- Tablet layout
- Mobile layout
- Mobile menu toggle

### ✅ User Profile (2 tests)
- Display user information
- Access logout button

**Total: 20+ comprehensive tests**

## 📁 File Structure

```
tests/e2e/
├── dashboard-comprehensive.spec.ts    # Main test suite
├── dashboard.config.ts                # Playwright config
├── DASHBOARD_TESTS.md                 # Full documentation
├── QUICK_START.md                     # This file
└── helpers/
    ├── auth.helper.ts                 # Authentication utilities
    ├── test-data.factory.ts           # Test data generation
    └── dashboard-setup.ts             # Test fixtures
```

## 🔧 Configuration

### Test User

Default test user credentials:
```typescript
{
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
}
```

### Timeouts

- Test timeout: 60 seconds
- Assertion timeout: 10 seconds
- Navigation timeout: 30 seconds

### Browsers

Tests run on:
- Chrome Desktop (1920x1080)
- Firefox Desktop (1920x1080)
- Safari Desktop (1920x1080)
- iPad Pro (Tablet)
- Pixel 5 (Mobile)
- iPhone 13 (Mobile)

## 🎯 Common Use Cases

### Run Tests Before Committing

```bash
# Quick smoke test on Chrome only
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --project=chromium-desktop

# Full test suite
pnpm test:e2e:dashboard
```

### Debug Failing Test

```bash
# Run specific test in debug mode
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts -g "should create a new project" --debug

# Run with slow motion
pnpm exec playwright test tests/e2e/dashboard-comprehensive.spec.ts --headed --slow-mo=1000
```

### Test on Mobile

```bash
# Mobile Chrome
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --project=mobile-chrome

# Mobile Safari
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --project=mobile-safari
```

### Generate Screenshots

```bash
# Run with screenshots on failure
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --screenshot=on

# Screenshots saved to: test-results/
```

## 🐛 Troubleshooting

### Tests Timing Out

**Problem**: Tests fail with timeout errors

**Solution**:
```bash
# Increase timeout
pnpm exec playwright test --config=tests/e2e/dashboard.config.ts --timeout=120000
```

### Authentication Failures

**Problem**: Tests fail at login

**Solution**:
1. Check if dev server is running: `pnpm dev`
2. Verify test user exists in database
3. Check auth API endpoints are working

### Element Not Found

**Problem**: Tests fail with "element not found"

**Solution**:
```bash
# Run in headed mode to see what's happening
pnpm test:e2e:dashboard:headed

# Or use UI mode for interactive debugging
pnpm test:e2e:dashboard:ui
```

### Port Already in Use

**Problem**: Dev server won't start

**Solution**:
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 pnpm dev
```

## 📊 Viewing Results

### HTML Report

```bash
# Generate and open report
pnpm exec playwright show-report playwright-report/dashboard
```

### JSON Results

Results are saved to:
```
test-results/dashboard-results.json
```

### Screenshots & Videos

Failed test artifacts:
```
test-results/
├── screenshots/
├── videos/
└── traces/
```

## 🎓 Next Steps

1. **Read Full Documentation**: See `DASHBOARD_TESTS.md` for detailed information
2. **Explore Helpers**: Check out helper functions in `helpers/` directory
3. **Add Custom Tests**: Extend the test suite with your own tests
4. **Integrate CI/CD**: Add tests to your CI/CD pipeline

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Dashboard Tests Documentation](./DASHBOARD_TESTS.md)
- [Test Helpers](./helpers/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

## 💡 Tips

1. **Use UI Mode** for developing new tests
2. **Use Headed Mode** for debugging
3. **Use Fixtures** for common setup
4. **Use Helper Functions** for reusable actions
5. **Clean Up Test Data** after tests

## 🤝 Contributing

When adding new tests:

1. Follow existing patterns
2. Use helper functions
3. Add proper documentation
4. Test on multiple browsers
5. Clean up test data

## ⚡ Performance Tips

1. Run tests in parallel when possible
2. Use API login instead of UI login for setup
3. Mock external API calls
4. Use test data factories
5. Clean up between tests

---

**Happy Testing! 🎉**

For questions or issues, check the full documentation in `DASHBOARD_TESTS.md`

