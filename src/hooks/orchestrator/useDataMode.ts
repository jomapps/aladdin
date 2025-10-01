/**
 * useDataMode Hook
 * Data ingestion mode specific logic
 */

'use client'

import { useState, useCallback } from 'react'
import { DataPreview } from '@/stores/orchestratorStore'

export function useDataMode() {
  const [preview, setPreview] = useState<DataPreview | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)

  const validateData = useCallback(async (data: any, projectId: string) => {
    setIsValidating(true)

    try {
      const response = await fetch('/api/v1/orchestrator/data/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, projectId }),
      })

      if (!response.ok) {
        throw new Error('Validation failed')
      }

      const result = await response.json()
      setPreview(result.preview)

      return result.preview
    } catch (error) {
      console.error('Validation error:', error)
      throw error
    } finally {
      setIsValidating(false)
    }
  }, [])

  const ingestData = useCallback(async (data: any, projectId: string) => {
    setIsIngesting(true)

    try {
      const response = await fetch('/api/v1/orchestrator/data/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, projectId }),
      })

      if (!response.ok) {
        throw new Error('Ingestion failed')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Ingestion error:', error)
      throw error
    } finally {
      setIsIngesting(false)
    }
  }, [])

  const clearPreview = useCallback(() => {
    setPreview(null)
  }, [])

  return {
    preview,
    isValidating,
    isIngesting,
    validateData,
    ingestData,
    clearPreview,
  }
}
