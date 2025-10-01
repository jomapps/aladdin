'use client'

/**
 * ExecutionTimeline Component
 *
 * Displays execution history timeline with visual timeline bars.
 * Shows multiple executions with their status and duration.
 */

import { format } from 'date-fns'
import { CheckCircle2, XCircle, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditExecution } from '@/hooks/useAuditTrail'

interface ExecutionTimelineProps {
  executions: AuditExecution[]
  onSelectExecution?: (execution: AuditExecution) => void
  className?: string
}

export function ExecutionTimeline({
  executions,
  onSelectExecution,
  className,
}: ExecutionTimelineProps) {
  if (executions.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-12 text-center border rounded-lg bg-gray-50',
          className
        )}
      >
        <div>
          <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600">No executions found</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {executions.map((execution) => {
        const isCompleted = execution.status === 'completed'
        const isFailed = execution.status === 'failed'
        const isRunning = execution.status === 'running'

        return (
          <button
            key={execution.id}
            onClick={() => onSelectExecution?.(execution)}
            className="w-full text-left border rounded-lg bg-white p-4 hover:shadow-md transition-all group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {execution.agent?.name || 'Unknown Agent'}
                  </h4>
                  {execution.agent?.isDepartmentHead && (
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                      Head
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{execution.executionId}</p>
              </div>

              {/* Status badge */}
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full',
                  isCompleted && 'bg-green-100',
                  isFailed && 'bg-red-100',
                  isRunning && 'bg-blue-100',
                  !isCompleted && !isFailed && !isRunning && 'bg-gray-100'
                )}
              >
                {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                {isFailed && <XCircle className="h-3.5 w-3.5 text-red-600" />}
                {isRunning && <Clock className="h-3.5 w-3.5 text-blue-600 animate-spin" />}
                <span
                  className={cn(
                    'text-xs font-medium',
                    isCompleted && 'text-green-700',
                    isFailed && 'text-red-700',
                    isRunning && 'text-blue-700',
                    !isCompleted && !isFailed && !isRunning && 'text-gray-700'
                  )}
                >
                  {execution.status}
                </span>
              </div>
            </div>

            {/* Prompt */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{execution.prompt}</p>

            {/* Timeline bar */}
            {execution.startedAt && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{format(new Date(execution.startedAt), 'MMM d, HH:mm:ss')}</span>
                  {execution.completedAt && (
                    <span>{format(new Date(execution.completedAt), 'HH:mm:ss')}</span>
                  )}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      isCompleted && 'bg-green-500',
                      isFailed && 'bg-red-500',
                      isRunning && 'bg-blue-500 animate-pulse'
                    )}
                    style={{ width: isRunning ? '60%' : '100%' }}
                  />
                </div>
              </div>
            )}

            {/* Metrics */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              {execution.department && (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{execution.department.icon}</span>
                  <span className="text-xs text-gray-600">{execution.department.name}</span>
                </div>
              )}
              {execution.qualityScore !== undefined && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    Quality: {execution.qualityScore.toFixed(0)}%
                  </span>
                </div>
              )}
              {execution.executionTime !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {execution.executionTime < 1000
                      ? `${execution.executionTime}ms`
                      : `${(execution.executionTime / 1000).toFixed(1)}s`}
                  </span>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
