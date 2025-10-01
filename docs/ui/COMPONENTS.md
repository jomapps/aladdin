# Component Documentation

## Table of Contents

- [Agent Components](#agent-components)
- [UI Components](#ui-components)
- [Dashboard Components](#dashboard-components)
- [Auth Components](#auth-components)
- [Component Patterns](#component-patterns)

## Agent Components

### AgentCard

Displays individual agent status with visual indicators.

**File**: `/src/components/agents/AgentCard.tsx`

#### Props

```typescript
interface AgentCardProps {
  agent: {
    id: string
    agentId: string
    name: string
    isDepartmentHead: boolean
  }
  department: {
    name: string
    color: string
    icon: string
  }
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  qualityScore?: number
  executionTime?: number
  className?: string
}
```

#### Usage

```tsx
import { AgentCard } from '@/components/agents/AgentCard'

<AgentCard
  agent={{
    id: '1',
    agentId: 'agent-research-001',
    name: 'Research Lead',
    isDepartmentHead: true
  }}
  department={{
    name: 'Research',
    color: '#3B82F6',
    icon: '🔬'
  }}
  status="running"
  qualityScore={92}
  executionTime={1500}
/>
```

#### Features

- Color-coded department indicator
- Animated status badges
- Department head badge
- Quality and execution time metrics
- Hover effects for interactivity

---

### AgentStatusDashboard

Real-time agent execution monitoring dashboard with WebSocket integration.

**File**: `/src/components/agents/AgentStatusDashboard.tsx`

#### Props

```typescript
interface AgentStatusDashboardProps {
  executionId: string
  className?: string
}
```

#### Usage

```tsx
import { AgentStatusDashboard } from '@/components/agents/AgentStatusDashboard'

<AgentStatusDashboard executionId="exec-123" />
```

#### Features

- **Real-Time Updates**: WebSocket connection for live events
- **Auto-Reconnect**: Exponential backoff reconnection
- **Loading States**: Skeleton UI during data fetch
- **Error Handling**: Retry mechanism for failures
- **Connection Status**: Visual indicators for WebSocket state

#### Sub-Components

- `AgentCard`: Agent information display
- `Timeline`: Execution event timeline
- `OutputStream`: Real-time output stream
- `ToolCallsLog`: Tool usage logging
- `QualityMetrics`: Performance metrics

---

### DepartmentDashboard

Department overview showing head agent and specialist agents.

**File**: `/src/components/agents/DepartmentDashboard.tsx`

#### Props

```typescript
interface DepartmentDashboardProps {
  departmentId: string
  className?: string
}
```

#### Usage

```tsx
import { DepartmentDashboard } from '@/components/agents/DepartmentDashboard'

<DepartmentDashboard departmentId="dept-research" />
```

#### Features

- **Department Metrics**: Quality, duration, execution count
- **Status Filtering**: Filter executions by status
- **Head Agent Display**: Special section for department head
- **Specialist Grid**: All department agents in responsive grid
- **Recent Activity**: Timeline of recent executions

---

### Timeline

Visual timeline of agent execution events.

**File**: `/src/components/agents/Timeline.tsx`

#### Props

```typescript
interface TimelineProps {
  events: AgentEvent[]
  className?: string
}

interface AgentEvent {
  id: string
  type: string
  timestamp: Date
  data?: any
  message?: string
}
```

#### Usage

```tsx
import { Timeline } from '@/components/agents/Timeline'

<Timeline
  events={[
    { id: '1', type: 'agent-start', timestamp: new Date(), message: 'Starting...' },
    { id: '2', type: 'tool-call', timestamp: new Date(), data: { tool: 'web_search' } },
    { id: '3', type: 'agent-complete', timestamp: new Date(), message: 'Completed!' }
  ]}
/>
```

#### Event Types

- `agent-start`: Execution started
- `tool-call`: Agent used a tool
- `output`: Agent generated output
- `error`: Error occurred
- `agent-complete`: Execution finished

---

### OutputStream

Real-time agent output display with syntax highlighting.

**File**: `/src/components/agents/OutputStream.tsx`

#### Props

```typescript
interface OutputStreamProps {
  events: AgentEvent[]
  autoScroll?: boolean
  className?: string
}
```

#### Usage

```tsx
import { OutputStream } from '@/components/agents/OutputStream'

<OutputStream
  events={events}
  autoScroll={true}
/>
```

#### Features

- Auto-scrolling to latest output
- Pause/resume auto-scroll
- Copy to clipboard
- Syntax highlighting for code
- Timestamp for each output

---

### ToolCallsLog

Displays agent tool usage with details.

**File**: `/src/components/agents/ToolCallsLog.tsx`

#### Props

```typescript
interface ToolCallsLogProps {
  events: AgentEvent[]
  className?: string
}
```

#### Usage

```tsx
import { ToolCallsLog } from '@/components/agents/ToolCallsLog'

<ToolCallsLog events={events} />
```

#### Displayed Information

- Tool name
- Input parameters
- Output result
- Duration
- Success/failure status
- Timestamp

---

### QualityMetrics

Visual display of agent performance metrics.

**File**: `/src/components/agents/QualityMetrics.tsx`

#### Props

```typescript
interface QualityMetricsProps {
  score?: number
  breakdown?: {
    accuracy?: number
    completeness?: number
    coherence?: number
    creativity?: number
  }
  className?: string
}
```

#### Usage

```tsx
import { QualityMetrics } from '@/components/agents/QualityMetrics'

<QualityMetrics
  score={92}
  breakdown={{
    accuracy: 95,
    completeness: 88,
    coherence: 93,
    creativity: 90
  }}
/>
```

#### Features

- Overall score with color coding
- Breakdown by dimension
- Progress bars for each metric
- Threshold indicators

---

### ExecutionTimeline

Visual timeline component for execution flow.

**File**: `/src/components/agents/ExecutionTimeline.tsx`

#### Props

```typescript
interface ExecutionTimelineProps {
  executions: Array<{
    id: string
    status: string
    startedAt: Date
    completedAt?: Date
  }>
  className?: string
}
```

#### Usage

```tsx
import { ExecutionTimeline } from '@/components/agents/ExecutionTimeline'

<ExecutionTimeline executions={executionHistory} />
```

---

### RecentActivity

Feed of recent agent executions.

**File**: `/src/components/agents/RecentActivity.tsx`

#### Props

```typescript
interface RecentActivityProps {
  executions: AgentExecution[]
  limit?: number
  className?: string
}
```

#### Usage

```tsx
import { RecentActivity } from '@/components/agents/RecentActivity'

<RecentActivity
  executions={executions}
  limit={10}
/>
```

---

### AuditTrailViewer

Complete audit log viewer with filtering.

**File**: `/src/components/agents/AuditTrailViewer.tsx`

#### Props

```typescript
interface AuditTrailViewerProps {
  userId?: string
  departmentId?: string
  agentId?: string
  className?: string
}
```

#### Usage

```tsx
import { AuditTrailViewer } from '@/components/agents/AuditTrailViewer'

<AuditTrailViewer departmentId="dept-research" />
```

#### Features

- Filter by user, department, agent
- Pagination
- Export capabilities
- Search functionality
- Date range filtering

---

## UI Components

### Button

Base button component with variants.

**File**: `/src/components/ui/button.tsx`

#### Props

```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}
```

#### Usage

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

#### Variants

- **default**: Primary action button
- **destructive**: Dangerous actions (delete, etc.)
- **outline**: Secondary actions
- **ghost**: Minimal styling
- **link**: Text link style

---

### Input

Text input component with validation.

**File**: `/src/components/ui/input.tsx`

#### Props

```typescript
interface InputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  error?: string
  className?: string
}
```

#### Usage

```tsx
import { Input } from '@/components/ui/input'

<Input
  type="text"
  placeholder="Enter text..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={errors.field}
/>
```

---

### Card

Container component for content grouping.

**File**: `/src/components/ui/card.tsx`

#### Props

```typescript
interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline'
}
```

#### Usage

```tsx
import { Card } from '@/components/ui/card'

<Card>
  <h3>Title</h3>
  <p>Content</p>
</Card>
```

---

### Label

Form label component.

**File**: `/src/components/ui/label.tsx`

#### Props

```typescript
interface LabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}
```

#### Usage

```tsx
import { Label } from '@/components/ui/label'

<Label htmlFor="email" required>
  Email Address
</Label>
```

---

### Form

Form wrapper with validation.

**File**: `/src/components/ui/form.tsx`

#### Props

```typescript
interface FormProps {
  children: React.ReactNode
  onSubmit: (data: any) => void
  className?: string
}
```

#### Usage

```tsx
import { Form } from '@/components/ui/form'

<Form onSubmit={handleSubmit}>
  <Input name="email" />
  <Button type="submit">Submit</Button>
</Form>
```

---

## Dashboard Components

### DashboardNav

Main navigation component.

**File**: `/src/components/dashboard/DashboardNav.tsx`

#### Props

```typescript
interface DashboardNavProps {
  currentPath: string
  className?: string
}
```

#### Usage

```tsx
import { DashboardNav } from '@/components/dashboard/DashboardNav'

<DashboardNav currentPath="/dashboard" />
```

---

## Auth Components

### LoginForm

User authentication form.

**File**: `/src/components/auth/LoginForm.tsx`

#### Props

```typescript
interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
  className?: string
}
```

#### Usage

```tsx
import { LoginForm } from '@/components/auth/LoginForm'

<LoginForm
  onSuccess={() => router.push('/dashboard')}
  onError={(error) => console.error(error)}
/>
```

---

## Component Patterns

### Compound Components

Building complex components from smaller ones:

```tsx
<AgentStatusDashboard executionId="123">
  {/* Composed of: */}
  <AgentCard />
  <Timeline />
  <OutputStream />
  <ToolCallsLog />
  <QualityMetrics />
</AgentStatusDashboard>
```

### Render Props

Flexible rendering:

```tsx
<Timeline
  events={events}
  renderEvent={(event) => (
    <CustomEventDisplay event={event} />
  )}
/>
```

### Children as Function

Advanced composition:

```tsx
<DataProvider>
  {({ data, loading, error }) => (
    loading ? <Spinner /> :
    error ? <Error /> :
    <Content data={data} />
  )}
</DataProvider>
```

### Controlled Components

Full control over component state:

```tsx
const [value, setValue] = useState('')

<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Uncontrolled Components

Let component manage its own state:

```tsx
<Input
  defaultValue="initial"
  ref={inputRef}
/>
```

## Styling Patterns

### Class Name Composition

Use `cn()` utility for conditional classes:

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)} />
```

### Variant-Based Styling

```tsx
const variants = {
  default: 'bg-blue-500',
  destructive: 'bg-red-500',
  outline: 'border border-gray-300'
}

<Button className={variants[variant]} />
```

### Responsive Classes

```tsx
<div className="
  w-full
  md:w-1/2
  lg:w-1/3
  xl:w-1/4
" />
```

## Accessibility Patterns

### ARIA Labels

```tsx
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>
```

### Keyboard Navigation

```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
/>
```

### Screen Reader Support

```tsx
<span className="sr-only">
  Loading...
</span>
```

## Error Handling

### Error Boundaries

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

### Error States

```tsx
if (error) {
  return <ErrorState error={error} retry={retry} />
}
```

## Loading States

### Skeleton Loaders

```tsx
if (isLoading) {
  return <Skeleton className="h-20 w-full" />
}
```

### Spinners

```tsx
<div className="flex justify-center">
  <Loader2 className="h-8 w-8 animate-spin" />
</div>
```

## Best Practices

1. **Always provide `className` prop** for customization
2. **Use TypeScript interfaces** for props
3. **Document with JSDoc comments**
4. **Handle loading and error states**
5. **Make components accessible**
6. **Keep components focused** (single responsibility)
7. **Use semantic HTML**
8. **Test components thoroughly**

## Next Steps

- Review [Developer Guide](/mnt/d/Projects/aladdin/docs/ui/DEVELOPER_GUIDE.md) for implementation patterns
- Check [State Management Guide](/mnt/d/Projects/aladdin/docs/ui/STATE_MANAGEMENT.md) for state patterns
- See [Testing Guide](/mnt/d/Projects/aladdin/docs/ui/TESTING_GUIDE.md) for component testing
