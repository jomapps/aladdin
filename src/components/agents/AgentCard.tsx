'use client'

/**
 * AgentCard Component
 *
 * Displays individual agent status with visual indicators.
 * Shows agent name, department, status, and performance metrics.
 */

import { Activity, CheckCircle2, XCircle, Loader2, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentCardProps {
  agent: {
    id: string
    agentId: string
    name: string
    isDepartmentHead: boolean
  }
  department: {
    name: string
    color: string
    icon: string
  }
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  qualityScore?: number
  executionTime?: number
  className?: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-gray-500',
    bg: 'bg-gray-100',
  },
  running: {
    icon: Loader2,
    label: 'Running',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
}

export function AgentCard({
  agent,
  department,
  status,
  qualityScore,
  executionTime,
  className,
}: AgentCardProps) {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md',
        className
      )}
      style={{ borderLeftColor: department.color, borderLeftWidth: '4px' }}
    >
      {/* Department Badge */}
      <div className="absolute right-4 top-4">
        <span className="text-2xl" title={department.name}>
          {department.icon}
        </span>
      </div>

      {/* Agent Info */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
          {agent.isDepartmentHead && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
              Head
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{agent.agentId}</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full', config.bg)}>
          <StatusIcon
            className={cn('h-4 w-4', config.color, status === 'running' && 'animate-spin')}
          />
          <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
        </div>
      </div>

      {/* Metrics */}
      {(qualityScore !== undefined || executionTime !== undefined) && (
        <div className="flex items-center gap-4 pt-3 border-t">
          {qualityScore !== undefined && (
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Quality: <span className="font-medium">{qualityScore.toFixed(0)}%</span>
              </span>
            </div>
          )}
          {executionTime !== undefined && (
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {executionTime < 1000
                  ? `${executionTime}ms`
                  : `${(executionTime / 1000).toFixed(1)}s`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
