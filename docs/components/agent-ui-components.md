# Agent UI Components Documentation

**Version**: 1.0.0
**Last Updated**: January 28, 2025
**Status**: ✅ Complete

---

## Overview

Comprehensive React UI component library for the Aladdin Dynamic Agents system. Provides real-time monitoring, audit trail visualization, and department management interfaces.

### Key Features

- ✅ **Real-time WebSocket Updates** - Live agent execution monitoring
- ✅ **Department Management** - Department head + specialists coordination
- ✅ **Audit Trail** - Complete execution history with advanced filtering
- ✅ **Quality Metrics** - Visual quality assessment and scoring
- ✅ **Tool Call Logging** - Detailed tool execution tracking
- ✅ **Export Functionality** - JSON/CSV export for audit data
- ✅ **Responsive Design** - Mobile-first Tailwind CSS styling
- ✅ **Type-Safe** - Full TypeScript with proper types

---

## Component Architecture

```
src/
├── hooks/
│   ├── useAgentExecution.ts    # Real-time execution monitoring hook
│   └── useAuditTrail.ts         # Audit trail querying hook
│
└── components/agents/
    ├── index.ts                 # Barrel export
    │
    ├── Base Components
    │   ├── AgentCard.tsx        # Individual agent status card
    │   ├── Timeline.tsx         # Event timeline visualization
    │   ├── OutputStream.tsx     # Live output stream display
    │   ├── ToolCallsLog.tsx     # Tool execution log
    │   └── QualityMetrics.tsx   # Quality score visualization
    │
    ├── Dashboard Components
    │   ├── AgentStatusDashboard.tsx    # Real-time agent monitoring
    │   ├── DepartmentDashboard.tsx     # Department overview
    │   └── AuditTrailViewer.tsx        # Audit trail with filters
    │
    └── Timeline Components
        ├── ExecutionTimeline.tsx       # Execution history timeline
        └── RecentActivity.tsx          # Recent executions feed
```

---

## Components Reference

### Custom Hooks

#### `useAgentExecution`

Real-time agent execution monitoring via WebSocket.

**Usage**:
```tsx
import { useAgentExecution } from '@/hooks/useAgentExecution'

function MyComponent() {
  const { execution, events, isConnected, isLoading, error, reconnect } =
    useAgentExecution('exec-123')

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{execution.agent.name}</h1>
      <p>Status: {execution.status}</p>
      <p>Events: {events.length}</p>
      {!isConnected && <button onClick={reconnect}>Reconnect</button>}
    </div>
  )
}
```

**Returns**:
- `execution`: Current execution data
- `events`: Array of real-time events
- `isConnected`: WebSocket connection status
- `isLoading`: Loading state
- `error`: Error object if failed
- `reconnect`: Function to manually reconnect

**Features**:
- Automatic WebSocket connection
- Auto-reconnection with exponential backoff
- Real-time event streaming
- Execution state updates

---

#### `useAuditTrail`

Comprehensive audit trail querying with filtering and pagination.

**Usage**:
```tsx
import { useAuditTrail } from '@/hooks/useAuditTrail'

function AuditLog() {
  const {
    executions,
    total,
    hasMore,
    isLoading,
    filters,
    setFilters,
    fetchMore
  } = useAuditTrail({
    projectId: 'proj-123',
    status: 'completed',
    minQualityScore: 80
  })

  return (
    <div>
      <h1>Total: {total} executions</h1>
      {executions.map(exec => (
        <div key={exec.id}>{exec.agent.name}</div>
      ))}
      {hasMore && <button onClick={fetchMore}>Load More</button>}
    </div>
  )
}
```

**Filter Options**:
- `projectId`: Filter by project
- `departmentId`: Filter by department
- `agentId`: Filter by agent
- `status`: Execution status
- `reviewStatus`: Review status
- `minQualityScore` / `maxQualityScore`: Quality range
- `dateStart` / `dateEnd`: Date range
- `minExecutionTime` / `maxExecutionTime`: Duration range
- `hasErrors`: Filter by error status
- `tags`: Filter by tags

**Query Options**:
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset
- `sortBy`: Sort field
- `sortOrder`: Sort direction (asc/desc)
- `includeEvents`: Include event data
- `includeToolCalls`: Include tool call data

---

### Base Components

#### `AgentCard`

Displays individual agent status with visual indicators.

**Props**:
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

**Example**:
```tsx
<AgentCard
  agent={{
    id: '1',
    agentId: 'story-head-001',
    name: 'Story Department Head',
    isDepartmentHead: true
  }}
  department={{
    name: 'Story Department',
    color: '#8B5CF6',
    icon: '📖'
  }}
  status="running"
  qualityScore={85}
  executionTime={2500}
/>
```

---

#### `Timeline`

Chronological event timeline visualization.

**Props**:
```typescript
interface TimelineProps {
  events: AgentEvent[]
  className?: string
}
```

**Example**:
```tsx
<Timeline events={events} />
```

**Supported Event Types**:
- `orchestration-start` / `orchestration-complete`
- `department-start` / `department-complete`
- `agent-start` / `agent-thinking` / `agent-complete`
- `tool-call` / `tool-result`
- `quality-check`
- `review-status`
- `error`

---

#### `OutputStream`

Live agent output stream with auto-scrolling.

**Props**:
```typescript
interface OutputStreamProps {
  events: AgentEvent[]
  autoScroll?: boolean
  className?: string
}
```

**Example**:
```tsx
<OutputStream events={events} autoScroll={true} />
```

**Features**:
- Auto-scroll to bottom
- Syntax highlighting for JSON
- Terminal-like styling
- Scroll-to-bottom button when user scrolls up

---

#### `ToolCallsLog`

Displays all tool calls with expandable details.

**Props**:
```typescript
interface ToolCallsLogProps {
  events: AgentEvent[]
  className?: string
}
```

**Example**:
```tsx
<ToolCallsLog events={events} />
```

**Features**:
- Expandable tool call details
- Input/output display
- Success/failure indicators
- Execution time tracking

---

#### `QualityMetrics`

Visual quality assessment display.

**Props**:
```typescript
interface QualityMetricsProps {
  score?: number
  breakdown?: {
    accuracy?: number
    completeness?: number
    coherence?: number
    creativity?: number
  }
  threshold?: number
  className?: string
}
```

**Example**:
```tsx
<QualityMetrics
  score={85}
  breakdown={{
    accuracy: 90,
    completeness: 85,
    coherence: 88,
    creativity: 78
  }}
  threshold={80}
/>
```

---

### Dashboard Components

#### `AgentStatusDashboard`

Real-time agent execution monitoring dashboard.

**Props**:
```typescript
interface AgentStatusDashboardProps {
  executionId: string
  className?: string
}
```

**Example**:
```tsx
<AgentStatusDashboard executionId="exec-123" />
```

**Features**:
- Real-time WebSocket connection
- Live event updates
- Agent card with status
- Event timeline
- Output stream
- Tool calls log
- Quality metrics
- Task details
- Connection status indicator
- Manual reconnect

---

#### `DepartmentDashboard`

Department overview with head and specialists.

**Props**:
```typescript
interface DepartmentDashboardProps {
  departmentId: string
  className?: string
}
```

**Example**:
```tsx
<DepartmentDashboard departmentId="story" />
```

**Features**:
- Department header with metrics
- Department head card
- Specialist agents grid
- Recent activity feed
- Status filtering
- Performance metrics
- Quality score tracking

---

#### `AuditTrailViewer`

Comprehensive audit trail with filtering and export.

**Props**:
```typescript
interface AuditTrailViewerProps {
  projectId?: string
  className?: string
}
```

**Example**:
```tsx
<AuditTrailViewer projectId="proj-123" />
```

**Features**:
- Advanced filtering
- Date range selection
- Status filtering
- Quality score filtering
- Export to JSON/CSV
- Paginated execution list
- Detailed execution view
- Filter presets
- Reset filters

---

### Timeline Components

#### `ExecutionTimeline`

Execution history timeline with visual bars.

**Props**:
```typescript
interface ExecutionTimelineProps {
  executions: AuditExecution[]
  onSelectExecution?: (execution: AuditExecution) => void
  className?: string
}
```

**Example**:
```tsx
<ExecutionTimeline
  executions={executions}
  onSelectExecution={(exec) => console.log(exec)}
/>
```

---

#### `RecentActivity`

Compact recent executions feed.

**Props**:
```typescript
interface RecentActivityProps {
  executions: AuditExecution[]
  limit?: number
  onViewExecution?: (execution: AuditExecution) => void
  className?: string
}
```

**Example**:
```tsx
<RecentActivity
  executions={executions}
  limit={10}
  onViewExecution={(exec) => navigate(`/execution/${exec.id}`)}
/>
```

---

## Usage Examples

### Basic Agent Monitoring

```tsx
import { AgentStatusDashboard } from '@/components/agents'

export default function AgentMonitorPage({ params }: { params: { executionId: string } }) {
  return (
    <div className="container mx-auto py-8">
      <AgentStatusDashboard executionId={params.executionId} />
    </div>
  )
}
```

---

### Department Overview Page

```tsx
import { DepartmentDashboard } from '@/components/agents'

export default function DepartmentPage({ params }: { params: { departmentId: string } }) {
  return (
    <div className="container mx-auto py-8">
      <DepartmentDashboard departmentId={params.departmentId} />
    </div>
  )
}
```

---

### Project Audit Trail

```tsx
import { AuditTrailViewer } from '@/components/agents'

export default function ProjectAuditPage({ params }: { params: { projectId: string } }) {
  return (
    <div className="container mx-auto py-8">
      <AuditTrailViewer projectId={params.projectId} />
    </div>
  )
}
```

---

### Custom Dashboard with Multiple Components

```tsx
import {
  AgentCard,
  Timeline,
  OutputStream,
  QualityMetrics,
  RecentActivity
} from '@/components/agents'
import { useAgentExecution, useAuditTrail } from '@/hooks'

export default function CustomDashboard({ executionId, projectId }: Props) {
  const { execution, events, isConnected } = useAgentExecution(executionId)
  const { executions } = useAuditTrail({ projectId })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column */}
      <div className="space-y-6">
        <AgentCard
          agent={execution.agent}
          department={execution.department}
          status={execution.status}
          qualityScore={execution.qualityScore}
        />
        <Timeline events={events} />
      </div>

      {/* Right column */}
      <div className="space-y-6">
        <OutputStream events={events} />
        <QualityMetrics score={execution.qualityScore} />
        <RecentActivity executions={executions} limit={5} />
      </div>
    </div>
  )
}
```

---

## Styling & Theming

All components use Tailwind CSS with the project's design system:

### Department Colors

Components automatically style based on department colors:
- Story: `#8B5CF6` (Purple)
- Character: `#EC4899` (Pink)
- Visual: `#F59E0B` (Orange)
- Video: `#10B981` (Green)
- Audio: `#3B82F6` (Blue)
- Production: `#EF4444` (Red)

### Status Colors

- Pending: Gray
- Running: Blue (with pulse animation)
- Completed: Green
- Failed: Red
- Cancelled: Gray

---

## WebSocket Integration

Components automatically connect to the WebSocket server at `/api/ws`.

**Connection Flow**:
1. Component mounts
2. WebSocket connection established
3. Subscribe to execution/conversation events
4. Receive real-time updates
5. Automatic reconnection on disconnect

**WebSocket Events**:
```typescript
// Subscribe to execution
ws.send(JSON.stringify({
  type: 'subscribe',
  executionId: 'exec-123'
}))

// Receive events
{
  type: 'event',
  event: {
    type: 'agent-complete',
    agentId: 'story-head-001',
    timestamp: '2025-01-28T12:00:00Z',
    // ... event data
  }
}
```

---

## API Integration

Components integrate with these API endpoints:

- `GET /api/audit` - Query audit trail
- `GET /api/audit/export` - Export audit data
- `GET /api/departments/:id` - Get department details
- `GET /api/agents` - Get agents list
- `WS /api/ws` - WebSocket connection

---

## Performance Considerations

### Optimization Features

- **Virtual scrolling** for large event lists (Timeline)
- **Pagination** for audit trail (50 items per page)
- **Lazy loading** for execution details
- **Debounced filtering** to reduce API calls
- **Memoized components** to prevent re-renders
- **Auto-scroll optimization** in OutputStream

### Best Practices

1. Use `limit` parameter in `useAuditTrail` to control data volume
2. Enable `includeEvents` and `includeToolCalls` only when needed
3. Unsubscribe from WebSocket when component unmounts (automatic)
4. Use pagination for large datasets
5. Filter data on server-side, not client-side

---

## Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react'
import { AgentCard } from '@/components/agents'

describe('AgentCard', () => {
  it('renders agent information', () => {
    render(
      <AgentCard
        agent={{ id: '1', agentId: 'test', name: 'Test Agent', isDepartmentHead: false }}
        department={{ name: 'Test Dept', color: '#000', icon: '🔧' }}
        status="running"
      />
    )

    expect(screen.getByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
  })
})
```

---

## Troubleshooting

### Common Issues

**WebSocket not connecting**:
- Check WebSocket server is running at `/api/ws`
- Verify CORS settings for WebSocket
- Check browser console for connection errors
- Try manual reconnect with `reconnect()` function

**Events not updating**:
- Verify executionId is correct
- Check WebSocket connection status
- Ensure event streaming is enabled in backend
- Check browser network tab for WebSocket messages

**Slow performance**:
- Reduce pagination limit
- Disable event/tool call inclusion
- Use virtual scrolling for large lists
- Optimize filters to reduce data volume

---

## Future Enhancements

- [ ] Real-time collaboration (multiple users viewing same execution)
- [ ] Custom chart types for metrics
- [ ] Export to PDF with full execution details
- [ ] Advanced search with full-text search
- [ ] Saved filter presets
- [ ] Execution comparison view
- [ ] Performance benchmarking dashboard
- [ ] Agent performance analytics
- [ ] Department performance comparison
- [ ] Custom event filters and alerts

---

## Related Documentation

- [Dynamic Agents Architecture](/docs/idea/dynamic-agents.md)
- [Event Streaming System](/docs/architecture/event-streaming.md)
- [Audit Trail API](/docs/api/audit-trail.md)
- [WebSocket Protocol](/docs/protocols/websocket.md)

---

**Questions or Issues?**
Contact: Development Team
