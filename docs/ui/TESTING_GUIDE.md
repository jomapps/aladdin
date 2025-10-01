# Testing Guide

## Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Testing Patterns](#testing-patterns)
- [Mocking Strategies](#mocking-strategies)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)

## Overview

Aladdin uses a comprehensive testing strategy with Vitest for unit/integration tests and Playwright for E2E tests.

### Test Stack

- **Unit/Integration**: Vitest 3.2.3 + Testing Library
- **E2E**: Playwright 1.54.1
- **Coverage**: Vitest coverage
- **DOM**: jsdom 26.1.0

### Test Structure

```
/mnt/d/Projects/aladdin/
├── src/
│   └── components/
│       └── agents/
│           └── AgentCard.tsx
└── tests/
    ├── unit/
    │   └── components/
    │       └── AgentCard.test.tsx
    ├── integration/
    │   └── agent-dashboard.test.tsx
    └── e2e/
        └── agent-monitoring.spec.ts
```

## Testing Philosophy

### Testing Pyramid

```
        ┌─────────────┐
        │     E2E     │  10% - Critical user flows
        ├─────────────┤
        │ Integration │  30% - Component interactions
        ├─────────────┤
        │    Unit     │  60% - Individual functions/components
        └─────────────┘
```

### What to Test

**✅ DO TEST:**
- User interactions (clicks, inputs, navigation)
- Component rendering with different props
- State changes and side effects
- API calls and responses
- Error handling
- Accessibility features
- Edge cases and boundary conditions

**❌ DON'T TEST:**
- Implementation details (internal state, methods)
- Third-party library internals
- Trivial code (getters, setters)
- CSS styling (use visual regression instead)

## Unit Testing

### Component Testing

Test individual components in isolation.

#### Basic Component Test

```typescript
// tests/unit/components/AgentCard.test.tsx
import { render, screen } from '@testing-library/react'
import { AgentCard } from '@/components/agents/AgentCard'

describe('AgentCard', () => {
  const mockAgent = {
    id: '1',
    agentId: 'agent-research-001',
    name: 'Research Lead',
    isDepartmentHead: true
  }

  const mockDepartment = {
    name: 'Research',
    color: '#3B82F6',
    icon: '🔬'
  }

  it('renders agent information', () => {
    render(
      <AgentCard
        agent={mockAgent}
        department={mockDepartment}
        status="running"
      />
    )

    expect(screen.getByText('Research Lead')).toBeInTheDocument()
    expect(screen.getByText('agent-research-001')).toBeInTheDocument()
    expect(screen.getByText('Head')).toBeInTheDocument()
  })

  it('shows correct status badge', () => {
    const { rerender } = render(
      <AgentCard
        agent={mockAgent}
        department={mockDepartment}
        status="running"
      />
    )

    expect(screen.getByText('Running')).toBeInTheDocument()

    rerender(
      <AgentCard
        agent={mockAgent}
        department={mockDepartment}
        status="completed"
      />
    )

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('displays quality score when provided', () => {
    render(
      <AgentCard
        agent={mockAgent}
        department={mockDepartment}
        status="completed"
        qualityScore={92}
      />
    )

    expect(screen.getByText(/Quality: 92%/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <AgentCard
        agent={mockAgent}
        department={mockDepartment}
        status="running"
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
```

#### Testing User Interactions

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('AgentForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<AgentForm onSubmit={onSubmit} />)

    // Fill form
    await user.type(screen.getByLabelText('Name'), 'Test Agent')
    await user.type(screen.getByLabelText('Agent ID'), 'agent-001')
    await user.selectOptions(screen.getByLabelText('Department'), 'research')

    // Submit
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test Agent',
      agentId: 'agent-001',
      department: 'research'
    })
  })

  it('shows validation errors', async () => {
    const user = userEvent.setup()

    render(<AgentForm onSubmit={vi.fn()} />)

    // Submit empty form
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Agent ID is required')).toBeInTheDocument()
  })
})
```

### Hook Testing

Test custom hooks with `renderHook`.

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useAgentExecution } from '@/hooks/useAgentExecution'

// Mock fetch
global.fetch = vi.fn()

describe('useAgentExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches execution data on mount', async () => {
    const mockExecution = {
      id: 'exec-1',
      executionId: 'exec-001',
      status: 'running',
      agent: { id: '1', name: 'Test Agent' }
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { executions: [mockExecution] }
      })
    })

    const { result } = renderHook(() => useAgentExecution('exec-001'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.execution).toEqual(mockExecution)
    expect(result.current.error).toBeNull()
  })

  it('handles fetch error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useAgentExecution('exec-001'))

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.error.message).toBe('Network error')
  })
})
```

## Integration Testing

Test component interactions and data flow.

### Dashboard Integration Test

```typescript
// tests/integration/agent-dashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { AgentStatusDashboard } from '@/components/agents/AgentStatusDashboard'

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null
  onmessage: ((event: any) => void) | null = null
  onclose: (() => void) | null = null
  onerror: ((error: any) => void) | null = null

  send = vi.fn()
  close = vi.fn()

  // Simulate connection
  connect() {
    setTimeout(() => this.onopen?.(), 0)
  }

  // Simulate message
  sendMessage(data: any) {
    setTimeout(() => {
      this.onmessage?.({ data: JSON.stringify(data) })
    }, 0)
  }
}

global.WebSocket = MockWebSocket as any

describe('AgentStatusDashboard Integration', () => {
  const mockExecutionId = 'exec-001'

  beforeEach(() => {
    // Mock fetch for initial data
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          executions: [{
            id: 'exec-1',
            executionId: mockExecutionId,
            status: 'pending',
            agent: {
              id: '1',
              agentId: 'agent-001',
              name: 'Test Agent',
              isDepartmentHead: false
            },
            department: {
              id: 'dept-1',
              name: 'Research',
              color: '#3B82F6',
              icon: '🔬'
            },
            prompt: 'Test task',
            events: []
          }]
        }
      })
    })
  })

  it('displays execution data and connects to WebSocket', async () => {
    render(<AgentStatusDashboard executionId={mockExecutionId} />)

    // Should show loading initially
    expect(screen.getByText(/Loading execution data/)).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    // Should show agent card
    expect(screen.getByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('receives and displays real-time events', async () => {
    const ws = new MockWebSocket()
    global.WebSocket = vi.fn(() => ws) as any

    render(<AgentStatusDashboard executionId={mockExecutionId} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    // Simulate WebSocket connection
    ws.connect()

    // Simulate agent start event
    ws.sendMessage({
      type: 'event',
      event: {
        id: 'event-1',
        type: 'agent-start',
        timestamp: new Date().toISOString(),
        message: 'Starting execution'
      }
    })

    await waitFor(() => {
      expect(screen.getByText('Running')).toBeInTheDocument()
    })

    // Simulate completion event
    ws.sendMessage({
      type: 'event',
      event: {
        id: 'event-2',
        type: 'agent-complete',
        timestamp: new Date().toISOString(),
        message: 'Completed',
        qualityScore: 92,
        executionTime: 2500
      }
    })

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText(/92%/)).toBeInTheDocument()
    })
  })

  it('handles WebSocket disconnection', async () => {
    const ws = new MockWebSocket()
    global.WebSocket = vi.fn(() => ws) as any

    render(<AgentStatusDashboard executionId={mockExecutionId} />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    ws.connect()

    await waitFor(() => {
      expect(screen.getByText(/Live updates active/)).toBeInTheDocument()
    })

    // Simulate disconnect
    ws.onclose?.()

    await waitFor(() => {
      expect(screen.getByText(/WebSocket disconnected/)).toBeInTheDocument()
    })
  })
})
```

## E2E Testing

Test complete user flows with Playwright.

### Setup

```typescript
// tests/e2e/setup.ts
import { test as base } from '@playwright/test'

export const test = base.extend({
  // Authenticated context
  authenticatedPage: async ({ page }, use) => {
    // Login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await use(page)
  }
})
```

### Agent Monitoring E2E Test

```typescript
// tests/e2e/agent-monitoring.spec.ts
import { test, expect } from './setup'

test.describe('Agent Monitoring', () => {
  test('user can view agent execution in real-time', async ({ authenticatedPage: page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')

    // Click on a department
    await page.click('text=Research')

    // Should see department dashboard
    await expect(page.locator('h1')).toContainText('Research')

    // Click on an agent execution
    await page.click('text=Research Lead')

    // Should see execution dashboard
    await expect(page.locator('h3')).toContainText('Execution Timeline')
    await expect(page.locator('h3')).toContainText('Agent Output')

    // Wait for WebSocket connection
    await expect(page.locator('text=Live updates active')).toBeVisible({
      timeout: 5000
    })

    // Check agent card
    await expect(page.locator('text=Research Lead')).toBeVisible()

    // Check for status badge
    const statusBadge = page.locator('[class*="status-badge"]').first()
    await expect(statusBadge).toBeVisible()
  })

  test('user can filter department executions', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/department/research')

    // Should see filter dropdown
    const filter = page.locator('select')
    await expect(filter).toBeVisible()

    // Select "Running" filter
    await filter.selectOption('running')

    // Should only show running executions
    const statusBadges = page.locator('text=Running')
    const count = await statusBadges.count()
    expect(count).toBeGreaterThan(0)

    // Should not show completed executions
    const completedBadges = page.locator('text=Completed')
    await expect(completedBadges).toHaveCount(0)
  })

  test('handles connection errors gracefully', async ({ authenticatedPage: page }) => {
    // Block WebSocket connections
    await page.route('**/api/ws', route => route.abort())

    await page.goto('/dashboard/execution/exec-001')

    // Should show connection error
    await expect(page.locator('text=WebSocket disconnected')).toBeVisible({
      timeout: 10000
    })

    // Should have reconnect button
    const reconnectButton = page.locator('button:has-text("Reconnect")')
    await expect(reconnectButton).toBeVisible()
  })
})
```

## Testing Patterns

### AAA Pattern

Arrange, Act, Assert:

```typescript
test('updates agent status', async () => {
  // Arrange
  const { result } = renderHook(() => useAgentStatus('agent-1'))

  // Act
  act(() => {
    result.current.updateStatus('completed')
  })

  // Assert
  expect(result.current.status).toBe('completed')
})
```

### Test Fixtures

Reusable test data:

```typescript
// tests/fixtures/agents.ts
export const mockAgent = {
  id: '1',
  agentId: 'agent-research-001',
  name: 'Research Lead',
  isDepartmentHead: true
}

export const mockDepartment = {
  id: 'dept-1',
  name: 'Research',
  color: '#3B82F6',
  icon: '🔬'
}

export const mockExecution = {
  id: 'exec-1',
  executionId: 'exec-001',
  agent: mockAgent,
  department: mockDepartment,
  status: 'running',
  prompt: 'Test task'
}
```

## Mocking Strategies

### Mock Fetch

```typescript
// Mock successful response
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, data: mockData })
})

// Mock error response
global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

// Mock specific endpoint
global.fetch = vi.fn((url) => {
  if (url.includes('/api/agents')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: mockAgents })
    })
  }
  return Promise.reject(new Error('Not found'))
})
```

### Mock WebSocket

```typescript
class MockWebSocket {
  onopen = vi.fn()
  onmessage = vi.fn()
  onclose = vi.fn()
  onerror = vi.fn()
  send = vi.fn()
  close = vi.fn()

  simulate(event: string, data?: any) {
    if (event === 'open') this.onopen()
    if (event === 'message') this.onmessage({ data: JSON.stringify(data) })
    if (event === 'close') this.onclose()
    if (event === 'error') this.onerror(data)
  }
}

global.WebSocket = MockWebSocket as any
```

### Mock Timers

```typescript
import { vi } from 'vitest'

test('delays execution', () => {
  vi.useFakeTimers()

  const callback = vi.fn()
  setTimeout(callback, 1000)

  expect(callback).not.toHaveBeenCalled()

  vi.advanceTimersByTime(1000)

  expect(callback).toHaveBeenCalled()

  vi.useRealTimers()
})
```

## Coverage Requirements

### Targets

- **Overall**: 80% coverage
- **Components**: 85% coverage
- **Hooks**: 90% coverage
- **Utils**: 95% coverage

### Run Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View in browser
pnpm test:coverage --ui
```

### Coverage Configuration

```typescript
// vitest.config.mts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
})
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ✅ Good - Test behavior
test('displays agent name', () => {
  render(<AgentCard agent={mockAgent} />)
  expect(screen.getByText('Research Lead')).toBeInTheDocument()
})

// ❌ Bad - Test implementation
test('sets state correctly', () => {
  const { result } = renderHook(() => useState('initial'))
  expect(result.current[0]).toBe('initial') // Testing internal state
})
```

### 2. Use Accessibility Queries

```typescript
// ✅ Good - Accessible queries
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email')
screen.getByText('Welcome')

// ❌ Bad - Implementation details
screen.getByClassName('submit-button')
screen.getByTestId('email-input')
```

### 3. Avoid Testing Implementation Details

```typescript
// ✅ Good - Test user-visible behavior
test('form submits on Enter key', async () => {
  render(<Form onSubmit={handleSubmit} />)
  const input = screen.getByRole('textbox')

  await userEvent.type(input, 'test{Enter}')

  expect(handleSubmit).toHaveBeenCalled()
})

// ❌ Bad - Test internal methods
test('handleKeyPress calls submit', () => {
  const instance = new Form()
  instance.handleKeyPress({ key: 'Enter' })
  // Testing internal method
})
```

### 4. Keep Tests Isolated

```typescript
// ✅ Good - Reset between tests
beforeEach(() => {
  vi.clearAllMocks()
  cleanup()
})

// ❌ Bad - Shared state
let sharedData = {}
test('test 1', () => { sharedData.value = 1 })
test('test 2', () => { expect(sharedData.value).toBe(1) }) // Depends on test 1
```

### 5. Use Descriptive Test Names

```typescript
// ✅ Good - Clear description
test('displays validation error when email is invalid', () => {})
test('redirects to dashboard after successful login', () => {})

// ❌ Bad - Vague description
test('works correctly', () => {})
test('test 1', () => {})
```

## Next Steps

- Review [Developer Guide](/mnt/d/Projects/aladdin/docs/ui/DEVELOPER_GUIDE.md) for development patterns
- Check [Component Documentation](/mnt/d/Projects/aladdin/docs/ui/COMPONENTS.md) for component APIs
- See [Examples](/mnt/d/Projects/aladdin/docs/ui/examples/) for testing patterns
