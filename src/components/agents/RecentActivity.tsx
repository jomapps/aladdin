'use client'

/**
 * RecentActivity Component
 *
 * Displays recent agent executions in a compact activity feed.
 * Shows execution status, agent name, and timestamp.
 */

import { formatDistanceToNow } from 'date-fns'
import { Activity, CheckCircle2, XCircle, Clock, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditExecution } from '@/hooks/useAuditTrail'

interface RecentActivityProps {
  executions: AuditExecution[]
  limit?: number
  onViewExecution?: (execution: AuditExecution) => void
  className?: string
}

export function RecentActivity({
  executions,
  limit = 10,
  onViewExecution,
  className,
}: RecentActivityProps) {
  const recentExecutions = executions.slice(0, limit)

  if (recentExecutions.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8 text-center border rounded-lg bg-gray-50',
          className
        )}
      >
        <div>
          <Activity className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg bg-white', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
      </div>

      {/* Activity list */}
      <div className="divide-y">
        {recentExecutions.map((execution) => {
          const isCompleted = execution.status === 'completed'
          const isFailed = execution.status === 'failed'
          const isRunning = execution.status === 'running'

          return (
            <button
              key={execution.id}
              onClick={() => onViewExecution?.(execution)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              {/* Status icon */}
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0',
                  isCompleted && 'bg-green-100',
                  isFailed && 'bg-red-100',
                  isRunning && 'bg-blue-100',
                  !isCompleted && !isFailed && !isRunning && 'bg-gray-100'
                )}
              >
                {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {isFailed && <XCircle className="h-4 w-4 text-red-600" />}
                {isRunning && <PlayCircle className="h-4 w-4 text-blue-600" />}
                {!isCompleted && !isFailed && !isRunning && (
                  <Clock className="h-4 w-4 text-gray-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {execution.agent?.name || 'Unknown Agent'}
                  </p>
                  {execution.agent?.isDepartmentHead && (
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                      Head
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate">{execution.prompt}</p>
              </div>

              {/* Metadata */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {execution.startedAt && (
                  <time className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                  </time>
                )}
                {execution.qualityScore !== undefined && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      execution.qualityScore >= 80 ? 'text-green-600' : 'text-yellow-600'
                    )}
                  >
                    {execution.qualityScore.toFixed(0)}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      {executions.length > limit && (
        <div className="px-4 py-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-600">
            Showing {limit} of {executions.length} executions
          </p>
        </div>
      )}
    </div>
  )
}
