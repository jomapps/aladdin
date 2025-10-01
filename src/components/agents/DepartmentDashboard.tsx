'use client'

/**
 * DepartmentDashboard Component
 *
 * Department overview showing head agent and specialist agents.
 * Displays recent activity and performance metrics for the department.
 */

import { useState, useEffect } from 'react'
import { Users, TrendingUp, Clock, Zap, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AgentCard } from './AgentCard'
import { RecentActivity } from './RecentActivity'
import { useAuditTrail } from '@/hooks/useAuditTrail'

interface DepartmentDashboardProps {
  departmentId: string
  className?: string
}

interface Agent {
  id: string
  agentId: string
  name: string
  isDepartmentHead: boolean
  isActive: boolean
  performanceMetrics?: {
    successRate?: number
    averageExecutionTime?: number
    totalExecutions?: number
  }
}

interface Department {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  priority: number
}

export function DepartmentDashboard({ departmentId, className }: DepartmentDashboardProps) {
  const [department, setDepartment] = useState<Department | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch department executions
  const { executions, isLoading: executionsLoading } = useAuditTrail({
    departmentId,
    ...(statusFilter !== 'all' && { status: statusFilter as any }),
  })

  // Fetch department and agents data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch department
        const deptResponse = await fetch(`/api/departments/${departmentId}`)
        const deptData = await deptResponse.json()
        if (deptData.doc) {
          setDepartment(deptData.doc)
        }

        // Fetch agents in this department
        const agentsResponse = await fetch(`/api/agents?where[department][equals]=${departmentId}`)
        const agentsData = await agentsResponse.json()
        if (agentsData.docs) {
          setAgents(agentsData.docs)
        }
      } catch (error) {
        console.error('Failed to fetch department data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [departmentId])

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-lg font-medium text-gray-900">Loading department...</p>
        </div>
      </div>
    )
  }

  if (!department) {
    return (
      <div className={cn('border rounded-lg bg-gray-50 p-6 text-center', className)}>
        <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-medium text-gray-900">Department not found</p>
      </div>
    )
  }

  const departmentHead = agents.find((a) => a.isDepartmentHead)
  const specialists = agents.filter((a) => !a.isDepartmentHead)

  // Calculate department metrics
  const completedExecutions = executions.filter((e) => e.status === 'completed')
  const avgQualityScore =
    completedExecutions.reduce((sum, e) => sum + (e.qualityScore || 0), 0) /
    (completedExecutions.length || 1)
  const avgExecutionTime =
    completedExecutions.reduce((sum, e) => sum + (e.executionTime || 0), 0) /
    (completedExecutions.length || 1)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Department Header */}
      <div
        className="relative overflow-hidden rounded-lg border bg-white p-6"
        style={{ borderTopColor: department.color, borderTopWidth: '4px' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full text-3xl"
              style={{ backgroundColor: `${department.color}20` }}
            >
              {department.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{department.name}</h1>
              <p className="text-sm text-gray-600">{department.description}</p>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-sm border rounded px-3 py-1.5 bg-white"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Department metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Avg Quality</p>
              <p className="text-lg font-semibold text-gray-900">{avgQualityScore.toFixed(0)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Avg Duration</p>
              <p className="text-lg font-semibold text-gray-900">
                {avgExecutionTime < 1000
                  ? `${avgExecutionTime.toFixed(0)}ms`
                  : `${(avgExecutionTime / 1000).toFixed(1)}s`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Executions</p>
              <p className="text-lg font-semibold text-gray-900">{executions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Head */}
      {departmentHead && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Department Head</h2>
          <AgentCard
            agent={departmentHead}
            department={department}
            status={
              executions.find((e) => e.agent?.id === departmentHead.id)?.status || 'pending'
            }
            qualityScore={departmentHead.performanceMetrics?.successRate}
          />
        </div>
      )}

      {/* Specialist Agents */}
      {specialists.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Specialist Agents ({specialists.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialists.map((agent) => {
              const agentExecution = executions.find((e) => e.agent?.id === agent.id)
              return (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  department={department}
                  status={agentExecution?.status || 'pending'}
                  qualityScore={agentExecution?.qualityScore}
                  executionTime={agentExecution?.executionTime}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <RecentActivity executions={executions} limit={10} />
      </div>
    </div>
  )
}
