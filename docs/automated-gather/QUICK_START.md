# Automated Gather - Quick Start Guide

## 🚀 Overview

The automated gather system provides three React hooks for managing automated department evaluations:

1. **`useAutomatedGather`** - Start/cancel automation
2. **`useGatherProgress`** - Track progress
3. **`useGatherWebSocket`** - Real-time updates

## 📦 Installation

```bash
# Hooks are already installed in the project
# Import from: @/hooks/automated-gather
```

## 🎯 Basic Usage (3 Steps)

### Step 1: Import Hooks

```tsx
import {
  useAutomatedGather,
  useGatherProgress,
  useGatherWebSocket
} from '@/hooks/automated-gather'
import { useAutomatedGatherStore } from '@/stores/automatedGatherStore'
```

### Step 2: Use Hooks in Component

```tsx
function AutomatedGatherPanel() {
  // Control hook
  const { startAutomation, cancelAutomation, isLoading, error } = useAutomatedGather()

  // Progress hook
  const { progress, status, completedDepartments } = useGatherProgress()

  // Get task ID from store
  const taskId = useAutomatedGatherStore(state => state.taskId)

  // WebSocket hook for real-time updates
  useGatherWebSocket(taskId, {
    enabled: status === 'queued' || status === 'processing',
    onEvent: (event) => {
      console.log('Event:', event.type)
    }
  })

  // ... component logic
}
```

### Step 3: Start Automation

```tsx
const handleStart = async () => {
  const taskId = await startAutomation({
    projectId: 'your-project-id',
    gatherData: yourGatherData,
    threshold: 7
  })

  if (taskId) {
    console.log('Started:', taskId)
  }
}
```

## 📊 Complete Example

```tsx
'use client'

import { useAutomatedGather, useGatherProgress, useGatherWebSocket } from '@/hooks/automated-gather'
import { useAutomatedGatherStore } from '@/stores/automatedGatherStore'

export function AutomatedGatherExample() {
  const { startAutomation, cancelAutomation, reset, isLoading, error } = useAutomatedGather()
  const { progress, status, currentDepartment, completedDepartments, failedDepartments } = useGatherProgress()
  const taskId = useAutomatedGatherStore(state => state.taskId)

  // Real-time updates
  useGatherWebSocket(taskId, {
    enabled: status === 'queued' || status === 'processing',
    onEvent: (event) => {
      if (event.type === 'automated-gather-complete') {
        alert('Automation complete!')
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
    }
  })

  const handleStart = async () => {
    await startAutomation({
      projectId: 'proj_123',
      gatherData: [
        { content: 'User story 1' },
        { content: 'User story 2' }
      ],
      threshold: 7
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={handleStart}
          disabled={isLoading || status === 'processing'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Start Automation
        </button>

        {status === 'processing' && (
          <button
            onClick={cancelAutomation}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cancel
          </button>
        )}

        {status === 'completed' && (
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reset
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Progress Bar */}
      {taskId && (
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Department */}
      {currentDepartment && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            Processing: <strong>{currentDepartment}</strong>
          </p>
        </div>
      )}

      {/* Department Summary */}
      {taskId && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 uppercase">Completed</p>
            <p className="text-3xl font-bold text-green-700">{completedDepartments.length}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 uppercase">Failed</p>
            <p className="text-3xl font-bold text-red-700">{failedDepartments.length}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 uppercase">Status</p>
            <p className="text-xl font-semibold text-blue-700 capitalize">{status}</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

## 🔧 Hook API Reference

### useAutomatedGather()

```typescript
const {
  isLoading: boolean,
  error: string | null,
  startAutomation: (params: StartAutomationParams) => Promise<string | null>,
  cancelAutomation: () => Promise<void>,
  reset: () => void
} = useAutomatedGather()
```

### useGatherProgress(taskId?)

```typescript
const {
  isLoading: boolean,
  error: string | null,
  progress: number,              // 0-100
  currentDepartment: string | null,
  completedDepartments: string[],
  failedDepartments: string[],
  status: string | null,
  refreshProgress: () => Promise<void>,
  taskStatus: TaskStatus | null
} = useGatherProgress(taskId?)
```

### useGatherWebSocket(taskId, options)

```typescript
useGatherWebSocket(
  taskId: string | null,
  options?: {
    enabled?: boolean,
    onEvent?: (event: AutomatedGatherEvent) => void,
    onError?: (error: Error) => void
  }
)
```

## 📡 WebSocket Events

```typescript
type AutomatedGatherEvent = {
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
```

## 🌐 API Endpoints Required

### POST /api/gather/automate

```typescript
// Request
{
  projectId: string
  gatherData: any[]
  previousEvaluations?: any[]
  threshold?: number
}

// Response
{
  taskId: string
}
```

### DELETE /api/gather/automate/[taskId]

```typescript
// Response
{
  success: boolean
}
```

## ✅ Best Practices

1. **Always handle errors**: Display error messages to users
2. **Reset on new automation**: Call `reset()` before starting new automation
3. **Enable WebSocket conditionally**: Only when task is active
4. **Show progress visually**: Use progress bars and status indicators
5. **Cleanup on unmount**: Hooks handle this automatically
6. **Use toast notifications**: Show feedback on WebSocket events
7. **Disable controls**: Prevent actions during loading states

## 🐛 Troubleshooting

### Progress not updating
- Check if polling is active (should poll every 2s when task is active)
- Verify task service API is responding
- Check browser console for errors

### WebSocket not connecting
- Verify WebSocket endpoint: `ws://localhost:3000/api/ws`
- Check browser console for connection errors
- Ensure `enabled` prop is true

### Start automation fails
- Check API endpoint `/api/gather/automate` exists
- Verify task service is running
- Check request payload format

## 📚 Additional Resources

- [Complete Usage Guide](../examples/automated-gather-usage.md)
- [Implementation Details](./HOOKS_IMPLEMENTATION.md)
- [Task Service Docs](/celery-redis/docs/how-to-use-celery-redis.md)

---

**Ready to use!** Import hooks and start building your automated gather UI.
