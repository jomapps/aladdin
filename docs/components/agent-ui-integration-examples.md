# Agent UI Components - Integration Examples

**Quick Start Guide for Integrating Agent UI Components**

---

## Quick Start: 3-Minute Setup

### 1. Install Dependencies (Already Done)

```bash
# All dependencies already installed:
# - lucide-react (icons)
# - date-fns (date formatting)
# - recharts (charts - optional)
# - tailwindcss (styling)
```

### 2. Import and Use

```tsx
'use client'

import { AgentStatusDashboard } from '@/components/agents'

export default function AgentMonitorPage({ params }) {
  return <AgentStatusDashboard executionId={params.executionId} />
}
```

That's it! 🎉

---

## Complete Integration Examples

### Example 1: Project Dashboard with Agent Monitoring

**File**: `app/dashboard/project/[id]/agents/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { DepartmentDashboard, RecentActivity } from '@/components/agents'
import { useAuditTrail } from '@/hooks/useAuditTrail'

export default function ProjectAgentsPage({ params }: { params: { id: string } }) {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const { executions } = useAuditTrail({ projectId: params.id })

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Project Agents</h1>

      {/* Recent Activity */}
      <RecentActivity
        executions={executions}
        limit={10}
        onViewExecution={(exec) => {
          // Navigate to execution detail
          window.location.href = `/execution/${exec.executionId}`
        }}
      />

      {/* Department Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {['story', 'character', 'visual', 'video', 'audio', 'production'].map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDepartment(dept)}
            className="p-4 border rounded-lg hover:bg-gray-50"
          >
            {dept.charAt(0).toUpperCase() + dept.slice(1)}
          </button>
        ))}
      </div>

      {/* Department Dashboard */}
      {selectedDepartment && (
        <DepartmentDashboard departmentId={selectedDepartment} />
      )}
    </div>
  )
}
```

---

### Example 2: Real-time Execution Monitor

**File**: `app/execution/[executionId]/page.tsx`

```tsx
'use client'

import { AgentStatusDashboard } from '@/components/agents'

export default function ExecutionMonitorPage({
  params,
}: {
  params: { executionId: string }
}) {
  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-600">
        <a href="/dashboard" className="hover:underline">Dashboard</a>
        {' / '}
        <a href="/executions" className="hover:underline">Executions</a>
        {' / '}
        <span className="text-gray-900">{params.executionId}</span>
      </nav>

      {/* Main Dashboard */}
      <AgentStatusDashboard executionId={params.executionId} />
    </div>
  )
}
```

---

### Example 3: Department Management Page

**File**: `app/admin/departments/[departmentId]/page.tsx`

```tsx
'use client'

import { DepartmentDashboard } from '@/components/agents'
import { Button } from '@/components/ui/button'

export default function DepartmentManagementPage({
  params,
}: {
  params: { departmentId: string }
}) {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Department Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">Edit Department</Button>
          <Button>Add Agent</Button>
        </div>
      </div>

      {/* Dashboard */}
      <DepartmentDashboard departmentId={params.departmentId} />
    </div>
  )
}
```

---

### Example 4: Audit Trail Page

**File**: `app/audit/page.tsx`

```tsx
'use client'

import { AuditTrailViewer } from '@/components/agents'

export default function AuditTrailPage({
  searchParams,
}: {
  searchParams: { projectId?: string }
}) {
  return (
    <div className="container mx-auto py-8">
      <AuditTrailViewer projectId={searchParams.projectId} />
    </div>
  )
}
```

---

### Example 5: Custom Analytics Dashboard

**File**: `app/analytics/agents/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import {
  QualityMetrics,
  ExecutionTimeline,
  RecentActivity,
} from '@/components/agents'
import { useAuditTrail } from '@/hooks/useAuditTrail'

export default function AgentAnalyticsPage() {
  const { executions, filters, setFilters } = useAuditTrail({})
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d'>('7d')

  useEffect(() => {
    const now = new Date()
    const start = new Date()

    if (dateRange === '24h') {
      start.setHours(now.getHours() - 24)
    } else if (dateRange === '7d') {
      start.setDate(now.getDate() - 7)
    } else if (dateRange === '30d') {
      start.setDate(now.getDate() - 30)
    }

    setFilters({ dateStart: start, dateEnd: now })
  }, [dateRange, setFilters])

  // Calculate metrics
  const completedExecutions = executions.filter((e) => e.status === 'completed')
  const avgQualityScore =
    completedExecutions.reduce((sum, e) => sum + (e.qualityScore || 0), 0) /
    (completedExecutions.length || 1)

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agent Analytics</h1>

        {/* Date range selector */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="border rounded px-4 py-2"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg bg-white p-6">
          <h3 className="text-sm text-gray-600 mb-2">Total Executions</h3>
          <p className="text-3xl font-bold">{executions.length}</p>
        </div>
        <div className="border rounded-lg bg-white p-6">
          <h3 className="text-sm text-gray-600 mb-2">Success Rate</h3>
          <p className="text-3xl font-bold">
            {((completedExecutions.length / executions.length) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="border rounded-lg bg-white p-6">
          <h3 className="text-sm text-gray-600 mb-2">Avg Quality</h3>
          <p className="text-3xl font-bold">{avgQualityScore.toFixed(0)}%</p>
        </div>
      </div>

      {/* Quality Metrics */}
      <QualityMetrics score={avgQualityScore} />

      {/* Execution Timeline */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Executions</h2>
        <ExecutionTimeline executions={executions.slice(0, 10)} />
      </div>

      {/* Recent Activity */}
      <RecentActivity executions={executions} limit={20} />
    </div>
  )
}
```

---

### Example 6: Embedded Agent Monitor Widget

**File**: `components/dashboard/AgentMonitorWidget.tsx`

```tsx
'use client'

import { useAgentExecution } from '@/hooks/useAgentExecution'
import { AgentCard, Timeline, OutputStream } from '@/components/agents'

export function AgentMonitorWidget({ executionId }: { executionId: string }) {
  const { execution, events, isConnected, error } = useAgentExecution(executionId)

  if (error) {
    return (
      <div className="border border-red-200 rounded-lg bg-red-50 p-4">
        <p className="text-red-700">Failed to load execution</p>
      </div>
    )
  }

  if (!execution) {
    return (
      <div className="border rounded-lg bg-gray-50 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-white p-4 space-y-4">
      {/* Connection indicator */}
      {isConnected && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          Live
        </div>
      )}

      {/* Agent Card */}
      <AgentCard
        agent={execution.agent}
        department={execution.department}
        status={execution.status}
        qualityScore={execution.qualityScore}
      />

      {/* Compact Timeline */}
      <div className="max-h-60 overflow-y-auto">
        <Timeline events={events.slice(-5)} />
      </div>
    </div>
  )
}
```

**Usage**:
```tsx
import { AgentMonitorWidget } from '@/components/dashboard/AgentMonitorWidget'

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AgentMonitorWidget executionId="exec-123" />
      <AgentMonitorWidget executionId="exec-456" />
    </div>
  )
}
```

---

## Common Patterns

### Pattern 1: Department Selector with Dashboard

```tsx
'use client'

import { useState } from 'react'
import { DepartmentDashboard } from '@/components/agents'

const DEPARTMENTS = [
  { id: 'story', name: 'Story', icon: '📖', color: '#8B5CF6' },
  { id: 'character', name: 'Character', icon: '👤', color: '#EC4899' },
  { id: 'visual', name: 'Visual', icon: '🎨', color: '#F59E0B' },
  { id: 'video', name: 'Video', icon: '🎬', color: '#10B981' },
  { id: 'audio', name: 'Audio', icon: '🔊', color: '#3B82F6' },
  { id: 'production', name: 'Production', icon: '🎯', color: '#EF4444' },
]

export function DepartmentSelector() {
  const [selected, setSelected] = useState(DEPARTMENTS[0].id)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.id}
            onClick={() => setSelected(dept.id)}
            className={`
              flex items-center gap-2 px-4 py-2 border-b-2 transition-colors
              ${selected === dept.id ? 'border-current' : 'border-transparent'}
            `}
            style={{ color: selected === dept.id ? dept.color : undefined }}
          >
            <span>{dept.icon}</span>
            <span className="font-medium">{dept.name}</span>
          </button>
        ))}
      </div>

      {/* Dashboard */}
      <DepartmentDashboard departmentId={selected} />
    </div>
  )
}
```

---

### Pattern 2: Filter Presets

```tsx
'use client'

import { useState } from 'react'
import { AuditTrailViewer } from '@/components/agents'
import { useAuditTrail } from '@/hooks/useAuditTrail'

const FILTER_PRESETS = {
  'High Quality': { minQualityScore: 90, status: 'completed' },
  'Recent Failures': { status: 'failed', hasErrors: true },
  'Long Running': { minExecutionTime: 30000 },
  'Pending Review': { reviewStatus: 'pending' },
}

export function AuditWithPresets({ projectId }: { projectId: string }) {
  const { setFilters } = useAuditTrail({ projectId })

  return (
    <div className="space-y-4">
      {/* Preset buttons */}
      <div className="flex gap-2">
        {Object.entries(FILTER_PRESETS).map(([name, preset]) => (
          <button
            key={name}
            onClick={() => setFilters({ projectId, ...preset })}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            {name}
          </button>
        ))}
      </div>

      <AuditTrailViewer projectId={projectId} />
    </div>
  )
}
```

---

### Pattern 3: Execution Detail Modal

```tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { AgentStatusDashboard } from '@/components/agents'
import type { AuditExecution } from '@/hooks/useAuditTrail'

export function ExecutionDetailModal({
  execution,
  onClose,
}: {
  execution: AuditExecution
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Execution Details</h2>
          <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AgentStatusDashboard executionId={execution.executionId} />
        </div>
      </div>
    </div>
  )
}

// Usage
function ExecutionList() {
  const [selectedExecution, setSelectedExecution] = useState<AuditExecution | null>(null)

  return (
    <>
      <ExecutionTimeline
        executions={executions}
        onSelectExecution={setSelectedExecution}
      />

      {selectedExecution && (
        <ExecutionDetailModal
          execution={selectedExecution}
          onClose={() => setSelectedExecution(null)}
        />
      )}
    </>
  )
}
```

---

## Next Steps

1. **Add to your pages**: Copy examples above
2. **Customize styling**: Adjust Tailwind classes
3. **Add navigation**: Wire up routing
4. **Test WebSocket**: Verify real-time updates
5. **Deploy**: Build and deploy

---

## Need Help?

- Check [Full Documentation](/docs/components/agent-ui-components.md)
- Review [Dynamic Agents Spec](/docs/idea/dynamic-agents.md)
- Test with sample data first
