'use client'

/**
 * AuditTrailViewer Component
 *
 * Comprehensive audit trail viewer with advanced filtering and export.
 * Displays paginated list of executions with detailed view and export options.
 */

import { useState } from 'react'
import { Search, Filter, Download, Calendar, Users, Tag, Sliders } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuditTrail, type AuditFilters } from '@/hooks/useAuditTrail'
import { ExecutionTimeline } from './ExecutionTimeline'
import { AgentStatusDashboard } from './AgentStatusDashboard'
import { Button } from '@/components/ui/button'

interface AuditTrailViewerProps {
  projectId?: string
  className?: string
}

export function AuditTrailViewer({ projectId, className }: AuditTrailViewerProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
  const [localFilters, setLocalFilters] = useState<AuditFilters>(
    projectId ? { projectId } : {}
  )

  const { executions, total, hasMore, isLoading, filters, setFilters, fetchMore } = useAuditTrail(
    projectId ? { projectId } : {}
  )

  // Apply filters
  const applyFilters = () => {
    setFilters(localFilters)
    setShowFilters(false)
  }

  // Reset filters
  const resetFilters = () => {
    const newFilters = projectId ? { projectId } : {}
    setLocalFilters(newFilters)
    setFilters(newFilters)
  }

  // Export functions
  const exportData = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/audit/export?${params.toString()}&format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-trail-${format}-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // If execution is selected, show detailed view
  if (selectedExecutionId) {
    return (
      <div className={cn('space-y-4', className)}>
        <Button onClick={() => setSelectedExecutionId(null)} variant="outline" size="sm">
          ← Back to List
        </Button>
        <AgentStatusDashboard executionId={selectedExecutionId} />
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-600 mt-1">
            {total} execution{total !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Sliders className="h-4 w-4 mr-2" />
            Filters
            {Object.keys(filters).length > (projectId ? 1 : 0) && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                {Object.keys(filters).length - (projectId ? 1 : 0)}
              </span>
            )}
          </Button>

          {/* Export buttons */}
          <Button onClick={() => exportData('json')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button onClick={() => exportData('csv')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border rounded-lg bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={localFilters.status || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    status: e.target.value ? (e.target.value as any) : undefined,
                  })
                }
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Review status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Status
              </label>
              <select
                value={localFilters.reviewStatus || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    reviewStatus: e.target.value ? (e.target.value as any) : undefined,
                  })
                }
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revision-needed">Revision Needed</option>
              </select>
            </div>

            {/* Quality score range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Quality Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={localFilters.minQualityScore || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minQualityScore: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="0-100"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            {/* Date range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={localFilters.dateStart ? format(localFilters.dateStart, 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    dateStart: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={localFilters.dateEnd ? format(localFilters.dateEnd, 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    dateEnd: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            {/* Has errors filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Errors</label>
              <select
                value={
                  localFilters.hasErrors === undefined
                    ? ''
                    : localFilters.hasErrors
                      ? 'true'
                      : 'false'
                }
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    hasErrors: e.target.value === '' ? undefined : e.target.value === 'true',
                  })
                }
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="true">With Errors</option>
                <option value="false">No Errors</option>
              </select>
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
            <Button onClick={resetFilters} variant="outline" size="sm">
              Reset
            </Button>
            <Button onClick={applyFilters} size="sm">
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Executions list */}
      {isLoading && executions.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-lg font-medium text-gray-900">Loading executions...</p>
          </div>
        </div>
      ) : (
        <>
          <ExecutionTimeline
            executions={executions}
            onSelectExecution={(execution) => setSelectedExecutionId(execution.executionId)}
          />

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center">
              <Button onClick={fetchMore} variant="outline" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
