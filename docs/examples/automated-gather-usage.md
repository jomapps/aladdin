# Automated Gather Hooks Usage

This document demonstrates how to use the automated gather hooks for managing automated department evaluations.

## Overview

The automated gather system consists of three main hooks:

1. **`useAutomatedGather`** - Control automation (start/cancel)
2. **`useGatherProgress`** - Track progress and status
3. **`useGatherWebSocket`** - Real-time updates via WebSocket

## State Management

The system uses Zustand for state management with the following structure:

```typescript
// Store: src/stores/automatedGatherStore.ts
{
  taskId: string | null
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | null
  progress: {
    currentDepartment?: string
    completedDepartments: string[]
    failedDepartments: string[]
    overallProgress: number // 0-100
    departments: {
      [slug: string]: {
        departmentSlug: string
        departmentName: string
        status: 'pending' | 'processing' | 'completed' | 'failed'
        progress: number
        currentStep?: string
        qualityScore?: number
        error?: string
      }
    }
  }
}
```

## Basic Usage

### Simple Start/Stop Control

```tsx
import { useAutomatedGather } from '@/hooks/automated-gather'

function AutomatedGatherButton() {
  const { startAutomation, cancelAutomation, isLoading, error } = useAutomatedGather()

  const handleStart = async () => {
    const taskId = await startAutomation({
      projectId: 'proj_123',
      gatherData: [...], // Your gather data
      threshold: 7,
    })

    if (taskId) {
      console.log('Automation started:', taskId)
    }
  }

  return (
    <div>
      <button onClick={handleStart} disabled={isLoading}>
        Start Automated Gather
      </button>
      <button onClick={cancelAutomation} disabled={isLoading}>
        Cancel
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
```

### Progress Tracking

```tsx
import { useGatherProgress } from '@/hooks/automated-gather'

function ProgressTracker() {
  const {
    progress,
    currentDepartment,
    completedDepartments,
    failedDepartments,
    status,
    isLoading,
  } = useGatherProgress()

  return (
    <div>
      <h3>Overall Progress: {progress.toFixed(0)}%</h3>
      <p>Status: {status}</p>

      {currentDepartment && (
        <p>Current: {currentDepartment}</p>
      )}

      <div>
        <h4>Completed ({completedDepartments.length})</h4>
        <ul>
          {completedDepartments.map(dept => (
            <li key={dept}>{dept}</li>
          ))}
        </ul>
      </div>

      {failedDepartments.length > 0 && (
        <div>
          <h4>Failed ({failedDepartments.length})</h4>
          <ul>
            {failedDepartments.map(dept => (
              <li key={dept}>{dept}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

### Real-time Updates with WebSocket

```tsx
import { useGatherWebSocket } from '@/hooks/automated-gather'
import { useAutomatedGatherStore } from '@/stores/automatedGatherStore'

function LiveProgressMonitor() {
  const taskId = useAutomatedGatherStore(state => state.taskId)

  useGatherWebSocket(taskId, {
    enabled: true,
    onEvent: (event) => {
      console.log('WebSocket event:', event.type, event.data)

      // Show toast notifications
      if (event.type === 'automated-gather-complete') {
        toast.success('Automation completed!')
      } else if (event.type === 'automated-gather-error') {
        toast.error('Automation failed')
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
    },
  })

  return <div>Live updates active</div>
}
```

## Complete Example Component

```tsx
'use client'

import { useState } from 'react'
import { useAutomatedGather, useGatherProgress, useGatherWebSocket } from '@/hooks/automated-gather'
import { useAutomatedGatherStore } from '@/stores/automatedGatherStore'

export function AutomatedGatherPanel() {
  const { startAutomation, cancelAutomation, reset, isLoading, error } = useAutomatedGather()
  const { progress, currentDepartment, status, completedDepartments, failedDepartments } = useGatherProgress()
  const taskId = useAutomatedGatherStore(state => state.taskId)
  const departments = useAutomatedGatherStore(state => state.progress.departments)

  // Enable WebSocket when automation is active
  useGatherWebSocket(taskId, {
    enabled: status === 'queued' || status === 'processing',
    onEvent: (event) => {
      console.log('Event received:', event)
    },
  })

  const handleStart = async () => {
    const taskId = await startAutomation({
      projectId: 'proj_123',
      gatherData: [...], // Your gather data
      threshold: 7,
    })

    if (!taskId) {
      console.error('Failed to start automation')
    }
  }

  const handleCancel = async () => {
    await cancelAutomation()
  }

  const handleReset = () => {
    reset()
  }

  const isActive = status === 'queued' || status === 'processing'

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleStart}
          disabled={isLoading || isActive}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isActive ? 'Running...' : 'Start Automation'}
        </button>

        {isActive && (
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Cancel
          </button>
        )}

        {status === 'completed' && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Reset
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {taskId && (
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Overall Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Department */}
          {currentDepartment && (
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-700">
                Currently processing: <strong>{currentDepartment}</strong>
              </p>
            </div>
          )}

          {/* Department Details */}
          <div className="space-y-2">
            <h3 className="font-semibold">Departments</h3>
            {Object.values(departments).map((dept) => (
              <div
                key={dept.departmentSlug}
                className="p-3 border rounded"
              >
                <div className="flex justify-between items-center">
                  <span>{dept.departmentName}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    dept.status === 'completed' ? 'bg-green-100 text-green-700' :
                    dept.status === 'failed' ? 'bg-red-100 text-red-700' :
                    dept.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {dept.status}
                  </span>
                </div>

                {dept.status === 'processing' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${dept.progress}%` }}
                      />
                    </div>
                    {dept.currentStep && (
                      <p className="text-xs text-gray-600 mt-1">{dept.currentStep}</p>
                    )}
                  </div>
                )}

                {dept.qualityScore !== undefined && (
                  <p className="text-sm text-gray-600 mt-1">
                    Quality Score: {dept.qualityScore}
                  </p>
                )}

                {dept.error && (
                  <p className="text-sm text-red-600 mt-1">{dept.error}</p>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-green-700">Completed</p>
              <p className="text-2xl font-bold text-green-800">{completedDepartments.length}</p>
            </div>
            <div className="p-4 bg-red-50 rounded">
              <p className="text-sm text-red-700">Failed</p>
              <p className="text-2xl font-bold text-red-800">{failedDepartments.length}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-700">Remaining</p>
              <p className="text-2xl font-bold text-blue-800">
                {Object.keys(departments).length - completedDepartments.length - failedDepartments.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

## API Integration

### Start Automation Endpoint

```typescript
// app/api/gather/automate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '@/lib/task-service/client'

export async function POST(request: NextRequest) {
  const body = await request.json()

  const response = await taskService.submitAutomatedGather({
    projectId: body.projectId,
    gatherData: body.gatherData,
    previousEvaluations: body.previousEvaluations,
    threshold: body.threshold,
  })

  return NextResponse.json({ taskId: response.task_id })
}
```

### Cancel Automation Endpoint

```typescript
// app/api/gather/automate/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '@/lib/task-service/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  await taskService.cancelTask(params.taskId)
  return NextResponse.json({ success: true })
}
```

## WebSocket Event Format

```typescript
// Automated gather events sent via WebSocket
{
  type: 'automated-gather-start' | 'automated-gather-progress' | 'automated-gather-complete' | 'automated-gather-error',
  taskId: string,
  data: {
    department: string,
    departmentName: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    progress: number,
    currentStep: string,
    qualityScore: number,
    error: string,
    timestamp: string,
  }
}
```

## Testing

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAutomatedGather } from '@/hooks/automated-gather'

describe('useAutomatedGather', () => {
  it('should start automation', async () => {
    const { result } = renderHook(() => useAutomatedGather())

    await act(async () => {
      const taskId = await result.current.startAutomation({
        projectId: 'test',
        gatherData: [],
      })

      expect(taskId).toBeTruthy()
      expect(result.current.isLoading).toBe(false)
    })
  })
})
```

## Best Practices

1. **Always check for errors**: Handle error states in your UI
2. **Cleanup on unmount**: Hooks handle cleanup automatically
3. **Use WebSocket for real-time**: Don't rely solely on polling
4. **Reset state**: Call `reset()` when starting new automation
5. **Show progress**: Display department-level progress for better UX
6. **Handle reconnection**: WebSocket hook handles this automatically
7. **Toast notifications**: Use with WebSocket events for user feedback
