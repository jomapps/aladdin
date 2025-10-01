/**
 * useOptimisticUpdate Hook
 *
 * Hook for optimistic UI updates with automatic rollback on error
 */

'use client'

import { useCallback } from 'react'
import { queryClient } from '@/lib/react-query/client'
import { QueryKey } from '@tanstack/react-query'

interface OptimisticUpdateOptions<TData, TVariables> {
  queryKey: QueryKey
  updater: (oldData: TData | undefined, variables: TVariables) => TData
  onError?: (error: Error, variables: TVariables, context: any) => void
  onSuccess?: (data: any, variables: TVariables, context: any) => void
}

export function useOptimisticUpdate<TData = unknown, TVariables = unknown>({
  queryKey,
  updater,
  onError,
  onSuccess,
}: OptimisticUpdateOptions<TData, TVariables>) {
  const mutate = useCallback(
    async (variables: TVariables, mutationFn: (vars: TVariables) => Promise<any>) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey)

      // Optimistically update to the new value
      queryClient.setQueryData<TData>(queryKey, (old) => updater(old, variables))

      try {
        // Perform the actual mutation
        const result = await mutationFn(variables)

        // Call success handler
        if (onSuccess) {
          onSuccess(result, variables, { previousData })
        }

        return result
      } catch (error) {
        // Rollback to previous data on error
        queryClient.setQueryData(queryKey, previousData)

        // Call error handler
        if (onError) {
          onError(error as Error, variables, { previousData })
        }

        throw error
      } finally {
        // Always refetch after mutation
        queryClient.invalidateQueries({ queryKey })
      }
    },
    [queryKey, updater, onError, onSuccess]
  )

  return { mutate }
}
