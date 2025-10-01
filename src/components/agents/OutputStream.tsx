'use client'

/**
 * OutputStream Component
 *
 * Displays live agent output stream with auto-scrolling.
 * Shows agent responses and thinking process in real-time.
 */

import { useEffect, useRef } from 'react'
import { Terminal, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { AgentEvent } from '@/lib/agents/events'

interface OutputStreamProps {
  events: AgentEvent[]
  autoScroll?: boolean
  className?: string
}

export function OutputStream({ events, autoScroll = true, className }: OutputStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldScrollRef = useRef(autoScroll)

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (shouldScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [events])

  // Handle user scroll (disable auto-scroll if user scrolls up)
  const handleScroll = () => {
    if (!containerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50

    shouldScrollRef.current = isAtBottom
  }

  const outputEvents = events.filter(
    (e) =>
      e.type === 'agent-thinking' ||
      e.type === 'agent-complete' ||
      e.type === 'agent-start' ||
      e.type === 'error'
  )

  if (outputEvents.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-64 border rounded-lg bg-gray-50',
          className
        )}
      >
        <div className="text-center">
          <Terminal className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600">Waiting for agent output...</p>
          <p className="text-xs text-gray-500 mt-1">Agent responses will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        'h-[400px] overflow-y-auto border rounded-lg bg-gray-900 p-4 font-mono text-sm',
        className
      )}
    >
      <div className="space-y-3">
        {outputEvents.map((event, index) => (
          <div
            key={`${event.type}-${event.timestamp}-${index}`}
            className="group"
          >
            {/* Timestamp and agent info */}
            <div className="flex items-center gap-2 mb-1">
              <time className="text-xs text-gray-500">
                {format(new Date(event.timestamp), 'HH:mm:ss')}
              </time>
              {event.type !== 'error' && 'agentName' in event && (
                <span className="text-xs text-blue-400">{event.agentName}</span>
              )}
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  event.type === 'agent-start' && 'bg-blue-900 text-blue-300',
                  event.type === 'agent-thinking' && 'bg-gray-800 text-gray-400',
                  event.type === 'agent-complete' && 'bg-green-900 text-green-300',
                  event.type === 'error' && 'bg-red-900 text-red-300'
                )}
              >
                {event.type === 'agent-start' && 'STARTED'}
                {event.type === 'agent-thinking' && 'THINKING'}
                {event.type === 'agent-complete' && 'COMPLETED'}
                {event.type === 'error' && 'ERROR'}
              </span>
            </div>

            {/* Content */}
            <div className="pl-4 border-l-2 border-gray-700">
              {event.type === 'agent-start' && (
                <p className="text-gray-300">
                  <MessageSquare className="inline h-4 w-4 mr-2" />
                  {event.task}
                </p>
              )}

              {event.type === 'agent-thinking' && event.thoughtProcess && (
                <p className="text-gray-400 italic">{event.thoughtProcess}</p>
              )}

              {event.type === 'agent-complete' && (
                <div className="text-gray-300">
                  <p className="mb-2">✓ Task completed successfully</p>
                  {typeof event.output === 'string' && (
                    <pre className="text-sm text-green-400 whitespace-pre-wrap break-words max-w-full">
                      {event.output}
                    </pre>
                  )}
                  {typeof event.output === 'object' && (
                    <pre className="text-xs text-green-400 bg-gray-950 p-2 rounded overflow-x-auto">
                      {JSON.stringify(event.output, null, 2)}
                    </pre>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Time: {(event.executionTime / 1000).toFixed(2)}s</span>
                    {event.qualityScore && <span>Quality: {event.qualityScore}%</span>}
                    {event.tokenUsage && (
                      <span>Tokens: {event.tokenUsage.totalTokens.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )}

              {event.type === 'error' && (
                <div className="text-red-400">
                  <p className="font-bold mb-1">✗ {event.error.message}</p>
                  {event.error.code && (
                    <p className="text-xs text-gray-500 mb-2">Error code: {event.error.code}</p>
                  )}
                  {event.error.stack && (
                    <pre className="text-xs text-red-500 bg-red-950 p-2 rounded overflow-x-auto">
                      {event.error.stack}
                    </pre>
                  )}
                  {event.error.recoverable && (
                    <p className="text-xs text-yellow-500 mt-2">→ Attempting to recover...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Auto-scroll indicator */}
      {!shouldScrollRef.current && (
        <div className="sticky bottom-0 left-0 right-0 py-2 text-center">
          <button
            onClick={() => {
              shouldScrollRef.current = true
              if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight
              }
            }}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors"
          >
            ↓ Scroll to bottom
          </button>
        </div>
      )}
    </div>
  )
}
