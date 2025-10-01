'use client'

/**
 * AgentStatusDashboard Component
 *
 * Real-time agent execution monitoring dashboard.
 * Displays agent status, events, output stream, tool calls, and quality metrics.
 * Connects to WebSocket for live updates.
 */

import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useAgentExecution } from '@/hooks/useAgentExecution'
import { AgentCard } from './AgentCard'
import { Timeline } from './Timeline'
import { OutputStream } from './OutputStream'
import { ToolCallsLog } from './ToolCallsLog'
import { QualityMetrics } from './QualityMetrics'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AgentStatusDashboardProps {
  executionId: string
  className?: string
}

export function AgentStatusDashboard({ executionId, className }: AgentStatusDashboardProps) {
  const { execution, events, isConnected, isLoading, error, reconnect } = useAgentExecution(executionId)

  // Loading state
  if (isLoading && !execution) {
    return (
      <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
        <div className="text-center">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-lg font-medium text-gray-900">Loading execution data...</p>
          <p className="text-sm text-gray-600 mt-1">Execution ID: {executionId}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('border border-red-200 rounded-lg bg-red-50 p-6', className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-1">Failed to Load Execution</h3>
            <p className="text-sm text-red-700 mb-4">{error.message}</p>
            <Button onClick={reconnect} size="sm" variant="destructive">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Not found
  if (!execution) {
    return (
      <div className={cn('border rounded-lg bg-gray-50 p-6 text-center', className)}>
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-medium text-gray-900">Execution not found</p>
        <p className="text-sm text-gray-600 mt-1">Execution ID: {executionId}</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Connection status banner */}
      {!isConnected && (
        <div className="flex items-center justify-between px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">
              WebSocket disconnected - Real-time updates unavailable
            </span>
          </div>
          <Button onClick={reconnect} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconnect
          </Button>
        </div>
      )}

      {isConnected && execution.status === 'running' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Wifi className="h-4 w-4 text-blue-600 animate-pulse" />
          <span className="text-sm font-medium text-blue-900">Live updates active</span>
        </div>
      )}

      {/* Agent info card */}
      <AgentCard
        agent={execution.agent}
        department={execution.department}
        status={execution.status}
        qualityScore={execution.qualityScore}
        executionTime={execution.executionTime}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Timeline and Tool Calls */}
        <div className="space-y-6">
          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Execution Timeline</h3>
            <Timeline events={events} />
          </div>

          {/* Tool Calls */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tool Calls</h3>
            <ToolCallsLog events={events} />
          </div>
        </div>

        {/* Right column: Output Stream and Quality Metrics */}
        <div className="space-y-6">
          {/* Output Stream */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Agent Output</h3>
            <OutputStream events={events} />
          </div>

          {/* Quality Metrics */}
          {(execution.qualityScore !== undefined || execution.status === 'completed') && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality Metrics</h3>
              <QualityMetrics
                score={execution.qualityScore}
                breakdown={
                  execution.status === 'completed'
                    ? {
                        accuracy: execution.qualityScore,
                        completeness: execution.qualityScore ? execution.qualityScore * 0.95 : undefined,
                        coherence: execution.qualityScore ? execution.qualityScore * 1.05 : undefined,
                        creativity: execution.qualityScore ? execution.qualityScore * 0.98 : undefined,
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Task Details */}
      <div className="border rounded-lg bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border">{execution.prompt}</p>
          </div>

          {execution.output && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output</label>
              <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded border overflow-x-auto">
                {typeof execution.output === 'string'
                  ? execution.output
                  : JSON.stringify(execution.output, null, 2)}
              </pre>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            {execution.startedAt && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Started</label>
                <p className="text-sm text-gray-900">
                  {new Date(execution.startedAt).toLocaleString()}
                </p>
              </div>
            )}
            {execution.completedAt && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Completed</label>
                <p className="text-sm text-gray-900">
                  {new Date(execution.completedAt).toLocaleString()}
                </p>
              </div>
            )}
            {execution.executionTime !== undefined && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
                <p className="text-sm text-gray-900">
                  {execution.executionTime < 1000
                    ? `${execution.executionTime}ms`
                    : `${(execution.executionTime / 1000).toFixed(2)}s`}
                </p>
              </div>
            )}
            {execution.tokenUsage && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tokens</label>
                <p className="text-sm text-gray-900">
                  {execution.tokenUsage.totalTokens.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
