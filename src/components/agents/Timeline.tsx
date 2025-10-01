'use client'

/**
 * Timeline Component
 *
 * Displays chronological event timeline for agent execution.
 * Shows all events with timestamps and visual indicators.
 */

import { format } from 'date-fns'
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Wrench,
  CheckSquare,
  AlertCircle,
  Users,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentEvent } from '@/lib/agents/events'

interface TimelineProps {
  events: AgentEvent[]
  className?: string
}

const eventConfig: Record<string, { icon: any; color: string; label: string }> = {
  'orchestration-start': {
    icon: Users,
    color: 'text-purple-600',
    label: 'Orchestration Started',
  },
  'orchestration-complete': {
    icon: CheckCircle2,
    color: 'text-green-600',
    label: 'Orchestration Complete',
  },
  'department-start': {
    icon: PlayCircle,
    color: 'text-blue-600',
    label: 'Department Started',
  },
  'department-complete': {
    icon: CheckCircle2,
    color: 'text-green-600',
    label: 'Department Complete',
  },
  'agent-start': {
    icon: PlayCircle,
    color: 'text-blue-500',
    label: 'Agent Started',
  },
  'agent-thinking': {
    icon: MessageSquare,
    color: 'text-gray-500',
    label: 'Agent Thinking',
  },
  'agent-complete': {
    icon: CheckCircle2,
    color: 'text-green-500',
    label: 'Agent Complete',
  },
  'tool-call': {
    icon: Wrench,
    color: 'text-orange-500',
    label: 'Tool Call',
  },
  'tool-result': {
    icon: CheckSquare,
    color: 'text-teal-500',
    label: 'Tool Result',
  },
  'quality-check': {
    icon: Sparkles,
    color: 'text-yellow-500',
    label: 'Quality Check',
  },
  'review-status': {
    icon: CheckSquare,
    color: 'text-indigo-500',
    label: 'Review',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    label: 'Error',
  },
}

export function Timeline({ events, className }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-12 text-center border rounded-lg bg-gray-50',
          className
        )}
      >
        <div>
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600">No events yet</p>
          <p className="text-xs text-gray-500 mt-1">Events will appear here as the agent executes</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {events.map((event, index) => {
        const config = eventConfig[event.type] || {
          icon: MessageSquare,
          color: 'text-gray-500',
          label: event.type,
        }
        const Icon = config.icon

        return (
          <div key={`${event.type}-${event.timestamp}-${index}`} className="flex gap-3 group">
            {/* Timeline line */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full bg-white border-2',
                  config.color.replace('text-', 'border-'),
                  'group-hover:scale-110 transition-transform'
                )}
              >
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              {index < events.length - 1 && (
                <div className="w-0.5 flex-1 min-h-[2rem] bg-gray-200" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900">{config.label}</p>
                <time className="text-xs text-gray-500 whitespace-nowrap">
                  {format(new Date(event.timestamp), 'HH:mm:ss')}
                </time>
              </div>

              {/* Event details */}
              <div className="text-sm text-gray-600">
                {renderEventDetails(event)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function renderEventDetails(event: AgentEvent): React.ReactNode {
  switch (event.type) {
    case 'agent-start':
      return (
        <p>
          <span className="font-medium">{event.agentName}</span> started working on task
        </p>
      )

    case 'agent-thinking':
      return event.thoughtProcess ? (
        <p className="italic">{event.thoughtProcess}</p>
      ) : (
        <p>Processing...</p>
      )

    case 'agent-complete':
      return (
        <p>
          <span className="font-medium">{event.agentName}</span> completed in{' '}
          {(event.executionTime / 1000).toFixed(2)}s
          {event.qualityScore && (
            <>
              {' '}
              with <span className="font-medium">{event.qualityScore}%</span> quality
            </>
          )}
        </p>
      )

    case 'tool-call':
      return (
        <p>
          Calling <span className="font-mono text-xs bg-gray-100 px-1 rounded">{event.toolName}</span>
        </p>
      )

    case 'tool-result':
      return (
        <p>
          <span className="font-mono text-xs bg-gray-100 px-1 rounded">{event.toolName}</span>{' '}
          {event.success ? (
            <span className="text-green-600">succeeded</span>
          ) : (
            <span className="text-red-600">failed</span>
          )}{' '}
          in {event.executionTime}ms
        </p>
      )

    case 'quality-check':
      return (
        <div>
          <p className="mb-1">
            Quality score: <span className="font-medium">{event.scores.overall}%</span>
            {event.passed ? (
              <span className="ml-2 text-green-600">Passed</span>
            ) : (
              <span className="ml-2 text-red-600">Failed</span>
            )}
          </p>
          {event.issues && event.issues.length > 0 && (
            <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
              {event.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )

    case 'review-status':
      return (
        <p>
          <span className="font-medium">{event.reviewedBy}</span> reviewed:{' '}
          <span
            className={cn(
              'font-medium',
              event.decision === 'approved' && 'text-green-600',
              event.decision === 'rejected' && 'text-red-600',
              event.decision === 'revision-needed' && 'text-yellow-600'
            )}
          >
            {event.decision}
          </span>
        </p>
      )

    case 'error':
      return (
        <div className="text-red-600">
          <p className="font-medium">{event.error.message}</p>
          {event.error.recoverable && <p className="text-xs mt-1">Attempting recovery...</p>}
        </div>
      )

    case 'department-start':
      return (
        <p>
          <span className="font-medium">{event.departmentName}</span> department activated
        </p>
      )

    case 'department-complete':
      return (
        <p>
          <span className="font-medium">{event.departmentName}</span> completed with{' '}
          {event.specialistsUsed} specialists in {(event.executionTime / 1000).toFixed(1)}s
        </p>
      )

    default:
      return null
  }
}
