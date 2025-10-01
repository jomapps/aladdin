/**
 * useTaskMode Hook
 * Task execution mode specific logic
 */

'use client'

import { useEffect } from 'react'
import { useOrchestratorStore, TaskProgress } from '@/stores/orchestratorStore'

export function useTaskMode() {
  const { currentTask, setCurrentTask } = useOrchestratorStore()

  // Simulate task progress updates (in real implementation, this would come from WebSocket)
  useEffect(() => {
    if (!currentTask || currentTask.status === 'complete' || currentTask.status === 'failed') {
      return
    }

    // This is a placeholder - real implementation would receive updates via WebSocket
    const interval = setInterval(() => {
      setCurrentTask({
        ...currentTask,
        progress: Math.min(currentTask.progress + 5, 100),
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentTask, setCurrentTask])

  return {
    currentTask,
    setCurrentTask,
  }
}
