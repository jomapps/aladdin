/**
 * Gather Progress Hook
 * Hook for tracking and formatting automation progress
 */

import { useEffect, useState, useCallback } from 'react'
import { useAutomatedGatherStore } from '@/stores/automatedGatherStore'
import { taskService } from '@/lib/task-service/client'
import type { TaskStatus } from '@/lib/task-service/types'

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

/**
 * Hook for tracking automated gather progress
 * Fetches current status from API and formats progress data
 */
export function useGatherProgress(taskId?: string | null): UseGatherProgressReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)

  const store = useAutomatedGatherStore()
  const activeTaskId = taskId || store.taskId

  /**
   * Fetch current progress from API
   */
  const refreshProgress = useCallback(async () => {
    if (!activeTaskId) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const status = await taskService.getTaskStatus(activeTaskId)
      setTaskStatus(status)

      // Update store with latest status
      store.updateProgress(status)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress'
      setError(errorMessage)
      console.error('[useGatherProgress] Error fetching progress:', err)
    } finally {
      setIsLoading(false)
    }
  }, [activeTaskId, store])

  /**
   * Initial fetch on mount and when taskId changes
   */
  useEffect(() => {
    if (activeTaskId) {
      refreshProgress()
    }
  }, [activeTaskId, refreshProgress])

  /**
   * Poll for updates when status is queued or processing
   */
  useEffect(() => {
    if (!activeTaskId || !taskStatus) {
      return
    }

    const isActive = taskStatus.status === 'queued' || taskStatus.status === 'processing'

    if (!isActive) {
      return
    }

    // Poll every 2 seconds
    const interval = setInterval(() => {
      refreshProgress()
    }, 2000)

    return () => clearInterval(interval)
  }, [activeTaskId, taskStatus, refreshProgress])

  return {
    isLoading,
    error,
    progress: store.progress.overallProgress,
    currentDepartment: store.progress.currentDepartment || null,
    completedDepartments: store.progress.completedDepartments,
    failedDepartments: store.progress.failedDepartments,
    status: store.status,
    refreshProgress,
    taskStatus,
  }
}
