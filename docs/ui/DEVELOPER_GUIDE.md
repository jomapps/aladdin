# Developer Guide - Aladdin UI System

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Component Structure](#component-structure)
- [State Management Patterns](#state-management-patterns)
- [Adding New Features](#adding-new-features)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Development Workflow](#development-workflow)

## Architecture Overview

Aladdin is built on a modern Next.js 15 stack with a focus on real-time agent execution monitoring and departmental organization.

### Tech Stack

- **Framework**: Next.js 15.4.4 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5.7.3
- **Styling**: Tailwind CSS 4.1.13
- **CMS**: Payload CMS 3.57.0
- **Database**: MongoDB
- **Real-time**: WebSocket (ws 8.18.0)
- **Forms**: React Hook Form 7.63.0
- **State**: React Hooks + Custom Hooks
- **Testing**: Vitest 3.2.3, Playwright 1.54.1

### Architecture Principles

1. **Component-Driven Development**: UI built from reusable, composable components
2. **Real-Time First**: WebSocket-based live updates for agent execution
3. **Type Safety**: Full TypeScript coverage with strict mode
4. **Performance**: Optimized rendering with React 19 features
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Responsive**: Mobile-first design approach

## Project Structure

```
/mnt/d/Projects/aladdin/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (frontend)/         # Public-facing pages
│   │   │   └── dashboard/      # Dashboard pages
│   │   └── (payload)/          # Payload CMS admin
│   ├── components/             # React components
│   │   ├── agents/             # Agent-related components
│   │   ├── auth/               # Authentication components
│   │   ├── dashboard/          # Dashboard components
│   │   └── ui/                 # Base UI components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   │   └── agents/             # Agent-related utilities
│   └── stories/                # Storybook stories
├── docs/                       # Documentation
│   └── ui/                     # UI documentation
└── tests/                      # Test files
```

## Component Structure

### Component Organization

Components are organized by feature/domain:

```typescript
// Agent Components
/components/agents/
├── AgentCard.tsx              // Individual agent display
├── AgentStatusDashboard.tsx   // Full execution dashboard
├── DepartmentDashboard.tsx    // Department overview
├── Timeline.tsx               // Event timeline
├── OutputStream.tsx           // Agent output display
├── ToolCallsLog.tsx          // Tool usage log
├── QualityMetrics.tsx        // Quality scoring
├── ExecutionTimeline.tsx     // Execution visualization
├── RecentActivity.tsx        // Activity feed
└── AuditTrailViewer.tsx      // Audit log viewer
```

### Component Pattern

All components follow this structure:

```typescript
'use client'

/**
 * ComponentName
 *
 * Description of what the component does.
 * Additional context about usage or behavior.
 */

import { ... } from 'react'
import { ... } from '@/...'

interface ComponentNameProps {
  // Props with JSDoc comments
  /** Description of prop */
  propName: PropType
  className?: string  // Always allow className override
}

export function ComponentName({
  propName,
  className
}: ComponentNameProps) {
  // Component implementation

  return (
    <div className={cn('base-classes', className)}>
      {/* Component content */}
    </div>
  )
}
```

### Key Design Patterns

#### 1. Compound Components

Complex components use compound patterns:

```typescript
// AgentStatusDashboard uses multiple sub-components
<AgentStatusDashboard executionId="123">
  <AgentCard />
  <Timeline />
  <OutputStream />
  <ToolCallsLog />
  <QualityMetrics />
</AgentStatusDashboard>
```

#### 2. Render Props Pattern

For flexible rendering:

```typescript
interface TimelineProps {
  events: AgentEvent[]
  renderEvent?: (event: AgentEvent) => React.ReactNode
}
```

#### 3. Custom Hooks

Extract logic to reusable hooks:

```typescript
// useAgentExecution.ts
export function useAgentExecution(executionId: string) {
  const [execution, setExecution] = useState(null)
  const [events, setEvents] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  // WebSocket connection logic
  // Event handling logic

  return { execution, events, isConnected, reconnect }
}
```

## State Management Patterns

### Local State

Use `useState` for component-local state:

```typescript
const [isOpen, setIsOpen] = useState(false)
const [filter, setFilter] = useState<FilterType>('all')
```

### Shared State via Hooks

Custom hooks for shared state:

```typescript
// useAgentExecution - Shared execution state
const { execution, events } = useAgentExecution(executionId)

// useAuditTrail - Shared audit data
const { executions, isLoading } = useAuditTrail({ departmentId })
```

### WebSocket State

Real-time state updates via WebSocket:

```typescript
useEffect(() => {
  const ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)

    if (message.type === 'event') {
      setEvents(prev => [...prev, message.event])
    }
  }

  return () => ws.close()
}, [])
```

### Server State

Fetch server data with error handling:

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/endpoint')
      const data = await response.json()
      setData(data)
    } catch (error) {
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }

  fetchData()
}, [dependencies])
```

## Adding New Features

### Adding a New Agent Component

1. **Create Component File**

```typescript
// /src/components/agents/NewComponent.tsx
'use client'

/**
 * NewComponent
 *
 * Description of the component
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NewComponentProps {
  // Define props
}

export function NewComponent(props: NewComponentProps) {
  // Implementation
}
```

2. **Add Tests**

```typescript
// /tests/components/NewComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { NewComponent } from '@/components/agents/NewComponent'

describe('NewComponent', () => {
  it('renders correctly', () => {
    render(<NewComponent />)
    expect(screen.getByRole('...')).toBeInTheDocument()
  })
})
```

3. **Add Story**

```typescript
// /src/stories/NewComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { NewComponent } from '@/components/agents/NewComponent'

const meta: Meta<typeof NewComponent> = {
  component: NewComponent,
  title: 'Agents/NewComponent',
}

export default meta
type Story = StoryObj<typeof NewComponent>

export const Default: Story = {
  args: {},
}
```

4. **Document Component**

Add to `/mnt/d/Projects/aladdin/docs/ui/COMPONENTS.md`

### Adding a New API Endpoint

1. **Create Route Handler**

```typescript
// /src/app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

2. **Add Types**

```typescript
// /src/types/api.ts
export interface NewEndpointResponse {
  success: boolean
  data?: DataType
  error?: string
}
```

3. **Document API**

Add to `/mnt/d/Projects/aladdin/docs/ui/API_REFERENCE.md`

### Adding a New Custom Hook

1. **Create Hook File**

```typescript
// /src/hooks/useNewFeature.ts
'use client'

import { useState, useEffect } from 'react'

export function useNewFeature(params) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    // Effect logic
  }, [dependencies])

  return { state, actions }
}
```

2. **Add Tests**

```typescript
// /tests/hooks/useNewFeature.test.ts
import { renderHook } from '@testing-library/react'
import { useNewFeature } from '@/hooks/useNewFeature'

describe('useNewFeature', () => {
  it('works correctly', () => {
    const { result } = renderHook(() => useNewFeature())
    expect(result.current.state).toBeDefined()
  })
})
```

## Code Standards

### TypeScript

- **Strict Mode**: Always enabled
- **No `any`**: Use proper types or `unknown`
- **Interface over Type**: Use `interface` for objects
- **Explicit Return Types**: For public APIs

```typescript
// ✅ Good
interface UserData {
  id: string
  name: string
}

function getUser(id: string): Promise<UserData> {
  return fetch(`/api/users/${id}`).then(r => r.json())
}

// ❌ Bad
function getUser(id: any): any {
  return fetch(`/api/users/${id}`).then(r => r.json())
}
```

### Naming Conventions

- **Components**: PascalCase (`AgentCard`)
- **Functions**: camelCase (`fetchExecution`)
- **Hooks**: camelCase with `use` prefix (`useAgentExecution`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`AgentExecution`)

### File Organization

```typescript
// 1. Imports
import { useState } from 'react'
import { ExternalLibrary } from 'external-library'
import { LocalComponent } from '@/components/...'
import { cn } from '@/lib/utils'

// 2. Types
interface ComponentProps { }

// 3. Constants
const MAX_ITEMS = 10

// 4. Component
export function Component() { }
```

### Comments

- **JSDoc**: For public APIs
- **Inline**: For complex logic
- **TODO**: For future improvements

```typescript
/**
 * Fetches agent execution data and subscribes to real-time updates
 *
 * @param executionId - Unique execution identifier
 * @returns Execution data and WebSocket connection state
 *
 * @example
 * ```tsx
 * const { execution, events } = useAgentExecution('exec-123')
 * ```
 */
export function useAgentExecution(executionId: string) {
  // Complex logic explanation
  const reconnectDelay = Math.min(1000 * Math.pow(2, attempts), 10000)

  // TODO: Add retry limit configuration
}
```

## Testing Guidelines

### Unit Tests

Test individual components and functions:

```typescript
import { render, screen } from '@testing-library/react'
import { AgentCard } from '@/components/agents/AgentCard'

describe('AgentCard', () => {
  it('displays agent information', () => {
    const agent = {
      id: '1',
      agentId: 'agent-1',
      name: 'Test Agent',
      isDepartmentHead: false
    }

    render(<AgentCard agent={agent} />)

    expect(screen.getByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByText('agent-1')).toBeInTheDocument()
  })

  it('shows department head badge', () => {
    const agent = {
      ...baseAgent,
      isDepartmentHead: true
    }

    render(<AgentCard agent={agent} />)

    expect(screen.getByText('Head')).toBeInTheDocument()
  })
})
```

### Integration Tests

Test component interactions:

```typescript
describe('AgentStatusDashboard', () => {
  it('fetches and displays execution data', async () => {
    mockFetch('/api/audit', {
      success: true,
      data: { executions: [mockExecution] }
    })

    render(<AgentStatusDashboard executionId="123" />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })
  })
})
```

### E2E Tests

Test full user flows:

```typescript
// tests/e2e/agent-monitoring.spec.ts
import { test, expect } from '@playwright/test'

test('user can monitor agent execution', async ({ page }) => {
  await page.goto('/dashboard/agent/exec-123')

  await expect(page.getByRole('heading', { name: 'Agent Output' }))
    .toBeVisible()

  await expect(page.getByText('Running'))
    .toBeVisible()
})
```

## Development Workflow

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Run development server
pnpm dev
```

### Daily Development

```bash
# Start dev server
pnpm dev

# Run tests in watch mode
pnpm test:watch

# Run linter
pnpm lint

# Type check
pnpm typecheck
```

### Before Committing

```bash
# Run all checks
pnpm lint && pnpm typecheck && pnpm test

# Build to verify
pnpm build
```

### Debugging

#### React DevTools

Install React DevTools browser extension for component inspection.

#### WebSocket Debugging

```typescript
// Enable WebSocket logging
ws.onopen = () => console.log('WebSocket connected')
ws.onmessage = (e) => console.log('Message:', e.data)
ws.onerror = (e) => console.error('Error:', e)
ws.onclose = () => console.log('WebSocket disconnected')
```

#### Network Debugging

Use browser DevTools Network tab to inspect API calls.

### Performance Profiling

```typescript
// Use React Profiler
import { Profiler } from 'react'

<Profiler id="AgentDashboard" onRender={onRenderCallback}>
  <AgentStatusDashboard />
</Profiler>
```

## Best Practices

### 1. Component Composition

Prefer composition over prop drilling:

```typescript
// ✅ Good - Composition
<Dashboard>
  <Sidebar />
  <MainContent>
    <AgentCard />
  </MainContent>
</Dashboard>

// ❌ Bad - Deep prop drilling
<Dashboard
  sidebarProps={...}
  mainContentProps={...}
  agentCardProps={...}
/>
```

### 2. Error Boundaries

Wrap components with error boundaries:

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <AgentStatusDashboard />
</ErrorBoundary>
```

### 3. Loading States

Always handle loading states:

```typescript
if (isLoading) {
  return <Skeleton />
}

if (error) {
  return <ErrorState error={error} />
}

return <Content data={data} />
```

### 4. Memoization

Memoize expensive computations:

```typescript
const sortedAgents = useMemo(
  () => agents.sort((a, b) => a.name.localeCompare(b.name)),
  [agents]
)
```

### 5. Event Handlers

Use `useCallback` for event handlers:

```typescript
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies])
```

## Common Patterns

### Conditional Rendering

```typescript
{isConnected && <ConnectionBadge />}
{status === 'running' ? <RunningIndicator /> : <IdleIndicator />}
{items.length > 0 ? <List items={items} /> : <EmptyState />}
```

### List Rendering

```typescript
<div className="space-y-4">
  {agents.map((agent) => (
    <AgentCard key={agent.id} agent={agent} />
  ))}
</div>
```

### Form Handling

```typescript
const { register, handleSubmit, formState: { errors } } = useForm()

const onSubmit = async (data) => {
  try {
    await submitForm(data)
  } catch (error) {
    setError(error.message)
  }
}

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('field', { required: true })} />
  {errors.field && <span>Required</span>}
</form>
```

## Next Steps

- Read [User Guide](/mnt/d/Projects/aladdin/docs/ui/USER_GUIDE.md)
- Explore [Component Documentation](/mnt/d/Projects/aladdin/docs/ui/COMPONENTS.md)
- Review [API Reference](/mnt/d/Projects/aladdin/docs/ui/API_REFERENCE.md)
- Check [Testing Guide](/mnt/d/Projects/aladdin/docs/ui/TESTING_GUIDE.md)
