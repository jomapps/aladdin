/**
 * useQueryMode Hook
 * Query mode specific logic and state
 */

'use client'

import { useState, useCallback } from 'react'

export interface QueryFilters {
  entityTypes: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  minRelevance?: number
}

export function useQueryMode() {
  const [filters, setFilters] = useState<QueryFilters>({
    entityTypes: [],
  })

  const [isSearching, setIsSearching] = useState(false)

  const toggleEntityType = useCallback((entityType: string) => {
    setFilters((prev) => ({
      ...prev,
      entityTypes: prev.entityTypes.includes(entityType)
        ? prev.entityTypes.filter((t) => t !== entityType)
        : [...prev.entityTypes, entityType],
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({ entityTypes: [] })
  }, [])

  return {
    filters,
    setFilters,
    toggleEntityType,
    clearFilters,
    isSearching,
    setIsSearching,
  }
}
