'use client'

/**
 * ToolCallsLog Component
 *
 * Displays all tool calls made during agent execution.
 * Shows tool name, input, output, execution time, and success status.
 */

import { useState } from 'react'
import { Wrench, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentEvent } from '@/lib/agents/events'

interface ToolCallsLogProps {
  events: AgentEvent[]
  className?: string
}

export function ToolCallsLog({ events, className }: ToolCallsLogProps) {
  const [expandedCalls, setExpandedCalls] = useState<Set<number>>(new Set())

  // Extract tool call and result events
  const toolCalls = events.filter((e) => e.type === 'tool-call') as Array<
    Extract<AgentEvent, { type: 'tool-call' }>
  >
  const toolResults = events.filter((e) => e.type === 'tool-result') as Array<
    Extract<AgentEvent, { type: 'tool-result' }>
  >

  // Match calls with their results
  const toolCallsWithResults = toolCalls.map((call, index) => {
    const result = toolResults.find(
      (r) => r.toolName === call.toolName && r.timestamp > call.timestamp
    )
    return { call, result, index }
  })

  const toggleExpand = (index: number) => {
    setExpandedCalls((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  if (toolCallsWithResults.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8 text-center border rounded-lg bg-gray-50',
          className
        )}
      >
        <div>
          <Wrench className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">No tool calls yet</p>
          <p className="text-xs text-gray-500 mt-1">Tool executions will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {toolCallsWithResults.map(({ call, result, index }) => {
        const isExpanded = expandedCalls.has(index)
        const isSuccess = result?.success ?? true
        const executionTime = result?.executionTime

        return (
          <div
            key={index}
            className={cn(
              'border rounded-lg overflow-hidden transition-all',
              isSuccess ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'
            )}
          >
            {/* Header */}
            <button
              onClick={() => toggleExpand(index)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    isSuccess ? 'bg-green-100' : 'bg-red-100'
                  )}
                >
                  {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>

                <div className="text-left">
                  <p className="font-mono text-sm font-medium text-gray-900">{call.toolName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {executionTime !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {executionTime}ms
                      </span>
                    )}
                    {result && !result.success && result.error && (
                      <span className="text-xs text-red-600">{result.error}</span>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t bg-gray-50">
                {/* Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Input</label>
                  <pre className="text-xs bg-white border rounded p-3 overflow-x-auto">
                    {typeof call.input === 'string'
                      ? call.input
                      : JSON.stringify(call.input, null, 2)}
                  </pre>
                </div>

                {/* Output */}
                {result?.output !== undefined && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Output</label>
                    <pre
                      className={cn(
                        'text-xs border rounded p-3 overflow-x-auto',
                        isSuccess ? 'bg-white' : 'bg-red-50 border-red-200'
                      )}
                    >
                      {typeof result.output === 'string'
                        ? result.output
                        : JSON.stringify(result.output, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>Called at: {new Date(call.timestamp).toLocaleTimeString()}</span>
                  {result && (
                    <span>Completed at: {new Date(result.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
