# Orchestrator UI Test Suite

Comprehensive test suite for the Orchestrator UI system with unit, integration, E2E, accessibility, and performance tests.

## 📁 Test Structure

```
tests/ui/
├── unit/                           # Unit tests for isolated components
│   ├── layout/                     # Layout component tests
│   │   ├── TopMenuBar.test.tsx
│   │   ├── LeftSidebar.test.tsx
│   │   └── RightOrchestrator.test.tsx
│   ├── orchestrator/               # Orchestrator mode tests
│   │   ├── QueryMode.test.tsx
│   │   ├── DataMode.test.tsx
│   │   ├── TaskMode.test.tsx
│   │   └── ChatMode.test.tsx
│   ├── stores/                     # State management tests
│   │   ├── layoutStore.test.ts
│   │   └── orchestratorStore.test.ts
│   └── hooks/                      # Custom hooks tests
│       ├── useOrchestratorChat.test.ts
│       └── useStreamingResponse.test.ts
├── integration/                    # Integration tests
│   ├── orchestrator-query-flow.test.tsx
│   ├── orchestrator-data-flow.test.tsx
│   ├── orchestrator-task-flow.test.tsx
│   ├── sidebar-interaction.test.tsx
│   ├── keyboard-shortcuts.test.tsx
│   └── realtime-updates.test.tsx
├── e2e/                           # End-to-end tests (Playwright)
│   ├── orchestrator-query.spec.ts
│   ├── orchestrator-data.spec.ts
│   ├── orchestrator-task.spec.ts
│   ├── orchestrator-chat.spec.ts
│   ├── navigation.spec.ts
│   └── responsive.spec.ts
├── visual/                        # Visual regression tests
│   ├── layout-desktop.spec.ts
│   ├── layout-tablet.spec.ts
│   ├── layout-mobile.spec.ts
│   ├── orchestrator-modes.spec.ts
│   └── animations.spec.ts
├── a11y/                          # Accessibility tests
│   ├── keyboard-navigation.test.tsx
│   ├── screen-reader.test.tsx
│   ├── contrast.test.ts
│   ├── aria.test.tsx
│   └── focus.test.tsx
├── performance/                   # Performance tests
│   ├── initial-load.test.ts
│   ├── streaming.test.ts
│   ├── animation.test.ts
│   └── bundle-size.test.ts
└── README.md                      # This file
```

## 🚀 Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test:int
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## 📊 Test Coverage Requirements

- **Layout Components**: 85%+
- **Orchestrator Components**: 90%+
- **Stores**: 95%+
- **Hooks**: 90%+
- **Overall Project**: 85%+

## 🧪 Testing Tools

### Unit & Integration Tests
- **Vitest**: Fast unit test framework
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation

### E2E Tests
- **Playwright**: End-to-end browser testing
- **Multiple browsers**: Chromium, Firefox, Safari

### Accessibility Tests
- **axe-core**: Automated accessibility testing
- **@testing-library/jest-dom**: DOM matchers

### Visual Tests
- **Playwright Screenshots**: Visual regression testing

## 📝 Test Patterns

### Unit Test Pattern (AAA)
```typescript
describe('Component', () => {
  it('should do something', () => {
    // Arrange
    const props = { ... }

    // Act
    render(<Component {...props} />)

    // Assert
    expect(screen.getByTestId('element')).toBeInTheDocument()
  })
})
```

### Integration Test Pattern
```typescript
it('should complete full workflow', async () => {
  const user = userEvent.setup()

  // Step 1: Setup
  render(<FullApp />)

  // Step 2: User actions
  await user.click(screen.getByRole('button'))
  await user.type(screen.getByRole('textbox'), 'input')

  // Step 3: Verify outcome
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeVisible()
  })
})
```

### E2E Test Pattern
```typescript
test('e2e workflow', async ({ page }) => {
  // Navigate
  await page.goto('/path')

  // Interact
  await page.click('[data-testid="button"]')
  await page.fill('[data-testid="input"]', 'text')

  // Verify
  await expect(page.locator('[data-testid="result"]')).toBeVisible()
})
```

## 🎯 Test Scenarios

### Query Mode Flow
1. Open orchestrator
2. Switch to query mode
3. Type search query
4. Submit search
5. View streaming results
6. Perform actions on results

### Data Mode Flow
1. Open orchestrator
2. Switch to data mode
3. Select files to upload
4. Monitor upload progress
5. View uploaded files
6. Remove files

### Task Mode Flow
1. Open orchestrator
2. Switch to task mode
3. Create new task
4. Monitor task execution
5. View task results
6. Cancel running tasks

### Chat Mode Flow
1. Open orchestrator
2. Switch to chat mode
3. Send message to AI
4. Receive streaming response
5. Continue conversation
6. View message history

## 🔍 Testing Best Practices

1. **Isolation**: Each test should be independent
2. **Clear Names**: Test names should describe behavior
3. **Fast Execution**: Unit tests should run quickly
4. **User-Centric**: Test from user's perspective
5. **Edge Cases**: Test boundary conditions
6. **Error States**: Test error handling
7. **Accessibility**: Test keyboard and screen reader support
8. **Performance**: Test load times and responsiveness

## 🐛 Debugging Tests

### Debug Single Test
```bash
npm run test -- --run --reporter=verbose QueryMode.test
```

### Debug with Playwright UI
```bash
npx playwright test --ui
```

### View Test Coverage
```bash
npm run test:coverage
open coverage/index.html
```

## 📈 CI/CD Integration

Tests run automatically on:
- Every pull request
- Main branch commits
- Scheduled nightly runs

### CI Configuration
- Unit/Integration tests must pass
- E2E tests must pass
- Coverage must meet thresholds
- No accessibility violations
- Performance budgets met

## 🔄 Updating Tests

When adding new features:
1. Write tests first (TDD)
2. Add unit tests for new components
3. Add integration tests for workflows
4. Add E2E tests for critical paths
5. Update accessibility tests
6. Update performance tests

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🤝 Contributing

1. Follow existing test patterns
2. Maintain coverage thresholds
3. Add tests for bug fixes
4. Update README with new patterns
5. Run full test suite before PR

## 📞 Support

For test-related questions:
- Check existing tests for examples
- Review testing best practices
- Consult team documentation
- Ask in #testing channel
