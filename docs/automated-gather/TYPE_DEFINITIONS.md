# Automated Gather Type Definitions

## 📦 Core Types

### Store State Types

```typescript
// src/stores/automatedGatherStore.ts

/**
 * Department progress tracking
 */
export interface DepartmentProgress {
  departmentSlug: string
  departmentName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  currentStep?: string
  qualityScore?: number
  startedAt?: string
  completedAt?: string
  error?: string
}

/**
 * Overall automation progress
 */
export interface AutomationProgress {
  currentDepartment?: string
  completedDepartments: string[]
  failedDepartments: string[]
  overallProgress: number // 0-100
  departments: Record<string, DepartmentProgress>
}

/**
 * Main store state
 */
export interface AutomatedGatherState {
  // Current automation task
  taskId: string | null
  status: TaskStatusValue | null

  // Progress tracking
  progress: AutomationProgress

  // Real-time updates
  lastUpdate: string | null

  // Actions
  startAutomation: (taskId: string) => void
  updateProgress: (status: TaskStatus) => void
  updateDepartmentProgress: (department: DepartmentProgress) => void
  setStatus: (status: TaskStatusValue) => void
  cancelAutomation: () => void
  reset: () => void
}
```

### Hook Types

```typescript
// src/hooks/automated-gather/useAutomatedGather.ts

/**
 * Parameters for starting automation
 */
interface StartAutomationParams {
  projectId: string
  gatherData: any[]
  previousEvaluations?: any[]
  threshold?: number
}

/**
 * Return type for useAutomatedGather hook
 */
interface UseAutomatedGatherReturn {
  isLoading: boolean
  error: string | null
  startAutomation: (params: StartAutomationParams) => Promise<string | null>
  cancelAutomation: () => Promise<void>
  reset: () => void
}
```

```typescript
// src/hooks/automated-gather/useGatherProgress.ts

/**
 * Return type for useGatherProgress hook
 */
interface UseGatherProgressReturn {
  isLoading: boolean
  error: string | null
  progress: number
  currentDepartment: string | null
  completedDepartments: string[]
  failedDepartments: string[]
  status: string | null
  refreshProgress: () => Promise<void>
  taskStatus: TaskStatus | null
}
```

```typescript
// src/hooks/automated-gather/useGatherWebSocket.ts

/**
 * WebSocket event for automated gather
 */
interface AutomatedGatherEvent {
  type: 'automated-gather-start' | 'automated-gather-progress' | 'automated-gather-complete' | 'automated-gather-error'
  taskId: string
  data?: {
    department?: string
    departmentName?: string
    status?: 'pending' | 'processing' | 'completed' | 'failed'
    progress?: number
    currentStep?: string
    qualityScore?: number
    error?: string
    timestamp?: string
  }
}

/**
 * Options for useGatherWebSocket hook
 */
interface UseGatherWebSocketOptions {
  enabled?: boolean
  onEvent?: (event: AutomatedGatherEvent) => void
  onError?: (error: Error) => void
}
```

## 🔗 Task Service Types

### Task Status Types (from @/lib/task-service/types)

```typescript
/**
 * Task status values
 */
export type TaskStatusValue = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

/**
 * Task status response
 */
export interface TaskStatus {
  task_id: string
  project_id: string
  status: TaskStatusValue
  progress?: number
  current_step?: string
  result?: TaskResult
  error?: string
  started_at?: string
  completed_at?: string
  processing_time?: number
}

/**
 * Task submission response
 */
export interface TaskResponse {
  task_id: string
  status: TaskStatusValue
  project_id: string
  estimated_duration?: number
  queue_position?: number
  created_at: string
}

/**
 * Task error response
 */
export interface TaskError {
  error: string
  message: string
  details?: Record<string, any>
  retry_after?: number
}
```

## 📡 API Types

### Request Types

```typescript
/**
 * POST /api/gather/automate request body
 */
interface AutomateGatherRequest {
  projectId: string
  gatherData: GatherDataItem[]
  previousEvaluations?: PreviousEvaluation[]
  threshold?: number
}

interface GatherDataItem {
  content: string
  summary?: string
  context?: string
  imageUrl?: string
  documentUrl?: string
}

interface PreviousEvaluation {
  department: string
  rating: number
  summary: string
}
```

### Response Types

```typescript
/**
 * POST /api/gather/automate response
 */
interface AutomateGatherResponse {
  taskId: string
  status: TaskStatusValue
  estimatedDuration?: number
}

/**
 * DELETE /api/gather/automate/[taskId] response
 */
interface CancelAutomationResponse {
  success: boolean
  message?: string
}

/**
 * Error response
 */
interface ApiErrorResponse {
  error: string
  message: string
  statusCode: number
}
```

## 🌐 WebSocket Types

### Message Types

```typescript
/**
 * WebSocket message types
 */
type WebSocketMessageType = 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'event'

/**
 * WebSocket message structure
 */
interface WebSocketMessage {
  type: WebSocketMessageType
  channel?: string
  taskId?: string
  event?: AutomatedGatherEvent
  timestamp?: string
}

/**
 * WebSocket subscription message
 */
interface SubscriptionMessage {
  type: 'subscribe'
  channel: 'automated-gather'
  taskId: string
}

/**
 * WebSocket event message
 */
interface EventMessage {
  type: 'event'
  event: AutomatedGatherEvent
  timestamp: string
}
```

## 🎨 UI Component Types

### Component Props

```typescript
/**
 * Progress bar component props
 */
interface ProgressBarProps {
  progress: number // 0-100
  status?: TaskStatusValue
  showPercentage?: boolean
  className?: string
}

/**
 * Department card component props
 */
interface DepartmentCardProps {
  department: DepartmentProgress
  onClick?: () => void
  isExpanded?: boolean
}

/**
 * Control buttons component props
 */
interface AutomationControlsProps {
  onStart: () => Promise<void>
  onCancel: () => Promise<void>
  onReset: () => void
  isLoading: boolean
  status: TaskStatusValue | null
  disabled?: boolean
}
```

## 🔧 Utility Types

### Helper Types

```typescript
/**
 * Department status for display
 */
type DepartmentStatusDisplay = {
  status: DepartmentProgress['status']
  label: string
  color: 'gray' | 'blue' | 'green' | 'red'
  icon?: string
}

/**
 * Progress update payload
 */
type ProgressUpdate = {
  taskId: string
  department: string
  progress: number
  step: string
}

/**
 * Automation summary
 */
type AutomationSummary = {
  totalDepartments: number
  completed: number
  failed: number
  pending: number
  overallProgress: number
  estimatedTimeRemaining?: number
}
```

## 🧪 Test Types

### Mock Types

```typescript
/**
 * Mock task status for testing
 */
interface MockTaskStatus {
  task_id: string
  status: TaskStatusValue
  progress: number
  current_step: string
}

/**
 * Mock WebSocket event
 */
interface MockWebSocketEvent {
  type: AutomatedGatherEvent['type']
  taskId: string
  data?: Partial<AutomatedGatherEvent['data']>
}

/**
 * Test fixture
 */
interface AutomationTestFixture {
  taskId: string
  departments: DepartmentProgress[]
  events: MockWebSocketEvent[]
}
```

## 📋 Type Usage Examples

### Store Usage

```typescript
import { useAutomatedGatherStore } from '@/stores/automatedGatherStore'
import type { DepartmentProgress } from '@/stores/automatedGatherStore'

// Get specific department
const department = useAutomatedGatherStore(
  state => state.progress.departments['engineering']
)

// Update department
const updateDept = useAutomatedGatherStore(state => state.updateDepartmentProgress)
updateDept({
  departmentSlug: 'engineering',
  departmentName: 'Engineering',
  status: 'processing',
  progress: 50
})
```

### Hook Usage

```typescript
import { useAutomatedGather, useGatherProgress, useGatherWebSocket } from '@/hooks/automated-gather'

// Control hook
const { startAutomation, error } = useAutomatedGather()

// Progress hook
const { progress, completedDepartments }: UseGatherProgressReturn = useGatherProgress()

// WebSocket hook
useGatherWebSocket(taskId, {
  onEvent: (event: AutomatedGatherEvent) => {
    console.log(event.type)
  }
})
```

### API Usage

```typescript
// Start automation
const response: AutomateGatherResponse = await fetch('/api/gather/automate', {
  method: 'POST',
  body: JSON.stringify({
    projectId: 'proj_123',
    gatherData: [],
    threshold: 7
  } as AutomateGatherRequest)
}).then(r => r.json())

// Cancel automation
const cancelResponse: CancelAutomationResponse = await fetch(
  `/api/gather/automate/${taskId}`,
  { method: 'DELETE' }
).then(r => r.json())
```

## 🔍 Type Guards

### Type Checking Functions

```typescript
/**
 * Check if department is complete
 */
function isDepartmentComplete(dept: DepartmentProgress): boolean {
  return dept.status === 'completed'
}

/**
 * Check if automation is active
 */
function isAutomationActive(status: TaskStatusValue | null): boolean {
  return status === 'queued' || status === 'processing'
}

/**
 * Type guard for WebSocket event
 */
function isAutomatedGatherEvent(event: any): event is AutomatedGatherEvent {
  return (
    typeof event === 'object' &&
    'type' in event &&
    event.type.startsWith('automated-gather-') &&
    'taskId' in event
  )
}
```

## 📊 Type Mapping

### Status to Display Mapping

```typescript
const statusDisplayMap: Record<DepartmentProgress['status'], DepartmentStatusDisplay> = {
  pending: {
    status: 'pending',
    label: 'Pending',
    color: 'gray',
    icon: 'clock'
  },
  processing: {
    status: 'processing',
    label: 'Processing',
    color: 'blue',
    icon: 'spinner'
  },
  completed: {
    status: 'completed',
    label: 'Completed',
    color: 'green',
    icon: 'check'
  },
  failed: {
    status: 'failed',
    label: 'Failed',
    color: 'red',
    icon: 'x'
  }
}
```

---

**Type Safety**: All types are fully documented with TSDoc comments for IntelliSense support.
