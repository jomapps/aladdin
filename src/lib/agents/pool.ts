/**
 * Agent Pool Management System
 * Phase 7: Production Polish
 */

interface AgentTask {
  id: string
  departmentId: string
  agentType: string
  priority: number
  payload: any
  createdAt: Date
}

interface ActiveAgent {
  id: string
  taskId: string
  departmentId: string
  startTime: Date
  status: 'running' | 'paused' | 'completing'
}

interface PoolMetrics {
  totalAgents: number
  activeAgents: number
  queuedTasks: number
  completedTasks: number
  avgExecutionTime: number
}

export class AgentPool {
  private maxConcurrency: number
  private activeAgents: Map<string, ActiveAgent>
  private taskQueue: AgentTask[]
  private completedTasks: number
  private totalExecutionTime: number
  private isShuttingDown: boolean

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency
    this.activeAgents = new Map()
    this.taskQueue = []
    this.completedTasks = 0
    this.totalExecutionTime = 0
    this.isShuttingDown = false
  }

  /**
   * Add task to queue with priority
   */
  async enqueue(task: Omit<AgentTask, 'id' | 'createdAt'>): Promise<string> {
    if (this.isShuttingDown) {
      throw new Error('Agent pool is shutting down')
    }

    const agentTask: AgentTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }

    // Insert task based on priority (higher priority first)
    const insertIndex = this.taskQueue.findIndex((t) => t.priority < agentTask.priority)
    if (insertIndex === -1) {
      this.taskQueue.push(agentTask)
    } else {
      this.taskQueue.splice(insertIndex, 0, agentTask)
    }

    // Try to process queue
    this.processQueue()

    return agentTask.id
  }

  /**
   * Process queued tasks if capacity available
   */
  private async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 && this.activeAgents.size < this.maxConcurrency) {
      const task = this.taskQueue.shift()
      if (!task) break

      await this.executeTask(task)
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: AgentTask): Promise<void> {
    const agent: ActiveAgent = {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId: task.id,
      departmentId: task.departmentId,
      startTime: new Date(),
      status: 'running',
    }

    this.activeAgents.set(agent.id, agent)

    try {
      // Simulate agent execution (replace with actual agent invocation)
      await this.invokeAgent(task)

      // Track completion
      const executionTime = Date.now() - agent.startTime.getTime()
      this.totalExecutionTime += executionTime
      this.completedTasks++
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error)
    } finally {
      this.activeAgents.delete(agent.id)
      // Process next queued task
      this.processQueue()
    }
  }

  /**
   * Invoke actual agent (to be implemented with real agent system)
   */
  private async invokeAgent(task: AgentTask): Promise<void> {
    // Placeholder for actual agent invocation
    // This would call the appropriate department head or specialist agent
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 2000 + 1000) // Simulate 1-3s execution
    })
  }

  /**
   * Get current pool metrics
   */
  getMetrics(): PoolMetrics {
    return {
      totalAgents: this.maxConcurrency,
      activeAgents: this.activeAgents.size,
      queuedTasks: this.taskQueue.length,
      completedTasks: this.completedTasks,
      avgExecutionTime:
        this.completedTasks > 0 ? this.totalExecutionTime / this.completedTasks : 0,
    }
  }

  /**
   * Get tasks for specific department
   */
  getDepartmentTasks(departmentId: string): { active: number; queued: number } {
    const active = Array.from(this.activeAgents.values()).filter(
      (a) => a.departmentId === departmentId,
    ).length

    const queued = this.taskQueue.filter((t) => t.departmentId === departmentId).length

    return { active, queued }
  }

  /**
   * Gracefully shutdown the pool
   */
  async shutdown(timeoutMs: number = 30000): Promise<void> {
    this.isShuttingDown = true

    // Stop accepting new tasks
    this.taskQueue = []

    // Wait for active agents to complete
    const startTime = Date.now()
    while (this.activeAgents.size > 0) {
      if (Date.now() - startTime > timeoutMs) {
        console.warn('Shutdown timeout reached, forcing termination')
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  /**
   * Update max concurrency
   */
  setMaxConcurrency(max: number): void {
    this.maxConcurrency = Math.max(1, max)
    // Process queue in case we increased capacity
    this.processQueue()
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queued: AgentTask[]
    active: ActiveAgent[]
  } {
    return {
      queued: [...this.taskQueue],
      active: Array.from(this.activeAgents.values()),
    }
  }
}

// Singleton instance
let poolInstance: AgentPool | null = null

export function getAgentPool(maxConcurrency?: number): AgentPool {
  if (!poolInstance) {
    poolInstance = new AgentPool(maxConcurrency)
  }
  return poolInstance
}
