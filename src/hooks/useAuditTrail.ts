'use client'

/**
 * useAuditTrail Hook
 *
 * Custom hook for querying and filtering agent execution audit trail.
 * Provides pagination, sorting, and comprehensive filtering capabilities.
 *
 * @example
 * ```tsx
 * const { executions, isLoading, refetch, filters, setFilters } = useAuditTrail({
 *   projectId: 'proj-123',
 *   status: 'completed'
 * })
 * ```
 */

import { useState, useEffect, useCallback } from 'react'

export interface AuditFilters {
  projectId?: string
  episodeId?: string
  conversationId?: string
  departmentId?: string
  agentId?: string
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'revision-needed'
  minQualityScore?: number
  maxQualityScore?: number
  dateStart?: Date
  dateEnd?: Date
  minExecutionTime?: number
  maxExecutionTime?: number
  hasErrors?: boolean
  tags?: string[]
}

export interface AuditOptions {
  limit?: number
  offset?: number
  sortBy?: 'startedAt' | 'completedAt' | 'qualityScore' | 'executionTime'
  sortOrder?: 'asc' | 'desc'
  includeEvents?: boolean
  includeToolCalls?: boolean
  includeRelations?: boolean
}

export interface AuditExecution {
  id: string
  executionId: string
  agent: any
  department: any
  project: any
  episode?: any
  conversationId?: string
  prompt: string
  output?: any
  status: string
  qualityScore?: number
  reviewStatus: string
  startedAt?: Date
  completedAt?: Date
  executionTime?: number
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  error?: any
  events?: any[]
  toolCalls?: any[]
}

export interface AuditResult {
  executions: AuditExecution[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface UseAuditTrailReturn {
  executions: AuditExecution[]
  total: number
  hasMore: boolean
  isLoading: boolean
  error: Error | null
  filters: AuditFilters
  options: AuditOptions
  setFilters: (filters: AuditFilters) => void
  setOptions: (options: AuditOptions) => void
  refetch: () => Promise<void>
  fetchMore: () => Promise<void>
}

export function useAuditTrail(
  initialFilters: AuditFilters = {},
  initialOptions: AuditOptions = {}
): UseAuditTrailReturn {
  const [executions, setExecutions] = useState<AuditExecution[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<AuditFilters>(initialFilters)
  const [options, setOptions] = useState<AuditOptions>({
    limit: 50,
    offset: 0,
    sortBy: 'startedAt',
    sortOrder: 'desc',
    includeToolCalls: true,
    includeRelations: true,
    ...initialOptions,
  })

  // Fetch audit data
  const fetchAudit = useCallback(async (append = false) => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query params
      const params = new URLSearchParams()

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'dateStart' || key === 'dateEnd') {
            params.append(key, (value as Date).toISOString())
          } else if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, String(value))
          }
        }
      })

      // Add options
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/audit?${params.toString()}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch audit trail')
      }

      const result: AuditResult = data.data

      if (append) {
        setExecutions((prev) => [...prev, ...result.executions])
      } else {
        setExecutions(result.executions)
      }

      setTotal(result.total)
      setHasMore(result.hasMore)
    } catch (err) {
      console.error('Failed to fetch audit trail:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch audit trail'))
    } finally {
      setIsLoading(false)
    }
  }, [filters, options])

  // Fetch more (pagination)
  const fetchMore = useCallback(async () => {
    if (!hasMore || isLoading) return

    setOptions((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 50),
    }))

    await fetchAudit(true)
  }, [hasMore, isLoading, fetchAudit])

  // Refetch from beginning
  const refetch = useCallback(async () => {
    setOptions((prev) => ({ ...prev, offset: 0 }))
    await fetchAudit(false)
  }, [fetchAudit])

  // Fetch on mount and when filters/options change
  useEffect(() => {
    fetchAudit(false)
  }, [fetchAudit])

  return {
    executions,
    total,
    hasMore,
    isLoading,
    error,
    filters,
    options,
    setFilters,
    setOptions,
    refetch,
    fetchMore,
  }
}
