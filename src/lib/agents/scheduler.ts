/**
 * Agent Scheduler - Priority-based Task Scheduling
 * Phase 7: Production Polish
 */

import { getAgentPool } from './pool'

interface ScheduledTask {
  departmentId: string
  agentType: string
  payload: any
  priority?: number
}

export class AgentScheduler {
  private pool = getAgentPool()
  private departmentWeights: Map<string, number>

  constructor() {
    // Default department priority weights
    this.departmentWeights = new Map([
      ['story', 10],
      ['character', 9],
      ['visual', 8],
      ['video', 7],
      ['audio', 6],
      ['image-quality', 8],
      ['production', 5],
    ])
  }

  /**
   * Schedule a task with automatic priority calculation
   */
  async schedule(task: ScheduledTask): Promise<string> {
    const priority = task.priority ?? this.calculatePriority(task)

    return this.pool.enqueue({
      departmentId: task.departmentId,
      agentType: task.agentType,
      payload: task.payload,
      priority,
    })
  }

  /**
   * Calculate priority based on department and load
   */
  private calculatePriority(task: ScheduledTask): number {
    // Base priority from department weight
    const basePriority = this.departmentWeights.get(task.departmentId) ?? 5

    // Adjust based on current department load
    const { active, queued } = this.pool.getDepartmentTasks(task.departmentId)
    const loadFactor = Math.max(0, 5 - (active + queued))

    return basePriority + loadFactor
  }

  /**
   * Schedule multiple tasks with load balancing
   */
  async scheduleMultiple(tasks: ScheduledTask[]): Promise<string[]> {
    // Sort tasks by calculated priority
    const sortedTasks = tasks
      .map((task) => ({
        task,
        priority: task.priority ?? this.calculatePriority(task),
      }))
      .sort((a, b) => b.priority - a.priority)

    // Schedule in priority order
    const taskIds: string[] = []
    for (const { task, priority } of sortedTasks) {
      const id = await this.schedule({ ...task, priority })
      taskIds.push(id)
    }

    return taskIds
  }

  /**
   * Update department priority weight
   */
  setDepartmentWeight(departmentId: string, weight: number): void {
    this.departmentWeights.set(departmentId, Math.max(1, Math.min(10, weight)))
  }

  /**
   * Get current queue metrics by department
   */
  getDepartmentMetrics(): Record<
    string,
    {
      weight: number
      active: number
      queued: number
    }
  > {
    const metrics: Record<string, any> = {}

    for (const [deptId, weight] of this.departmentWeights) {
      const { active, queued } = this.pool.getDepartmentTasks(deptId)
      metrics[deptId] = { weight, active, queued }
    }

    return metrics
  }

  /**
   * Get overall scheduler status
   */
  getStatus() {
    const poolMetrics = this.pool.getMetrics()
    const departmentMetrics = this.getDepartmentMetrics()

    return {
      pool: poolMetrics,
      departments: departmentMetrics,
    }
  }
}

// Singleton instance
let schedulerInstance: AgentScheduler | null = null

export function getScheduler(): AgentScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AgentScheduler()
  }
  return schedulerInstance
}
