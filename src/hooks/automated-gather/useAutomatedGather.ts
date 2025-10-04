/**
 * Automated Gather Hook
 * Main hook for controlling automated department evaluation
 */

import { useState, useCallback } from 'react'
import { useAutomatedGatherStore } from '@/stores/automatedGatherStore'

interface StartAutomationParams {
  projectId: string
  gatherData: any[]
  previousEvaluations?: any[]
  threshold?: number
}

interface UseAutomatedGatherReturn {
  isLoading: boolean
  error: string | null
  startAutomation: (params: StartAutomationParams) => Promise<string | null>
  cancelAutomation: () => Promise<void>
  reset: () => void
}

/**
 * Hook for controlling automated gather process
 */
export function useAutomatedGather(): UseAutomatedGatherReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const store = useAutomatedGatherStore()

  /**
   * Start automated evaluation for all departments
   */
  const startAutomation = useCallback(
    async (params: StartAutomationParams): Promise<string | null> => {
      setIsLoading(true)
      setError(null)

      try {
        // Call API to start automated gather
        const response = await fetch('/api/gather/automate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: params.projectId,
            gatherData: params.gatherData,
            previousEvaluations: params.previousEvaluations || [],
            threshold: params.threshold || 7,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: response.statusText,
          }))
          throw new Error(errorData.error || 'Failed to start automation')
        }

        const data = await response.json()

        // Update store with task ID
        store.startAutomation(data.taskId)

        return data.taskId
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        console.error('[useAutomatedGather] Error starting automation:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [store]
  )

  /**
   * Cancel ongoing automation
   */
  const cancelAutomation = useCallback(async () => {
    const { taskId } = store

    if (!taskId) {
      console.warn('[useAutomatedGather] No active task to cancel')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/gather/automate/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel automation')
      }

      // Update store
      store.cancelAutomation()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel automation'
      setError(errorMessage)
      console.error('[useAutomatedGather] Error canceling automation:', err)
    } finally {
      setIsLoading(false)
    }
  }, [store])

  /**
   * Reset automation state
   */
  const reset = useCallback(() => {
    store.reset()
    setError(null)
  }, [store])

  return {
    isLoading,
    error,
    startAutomation,
    cancelAutomation,
    reset,
  }
}
