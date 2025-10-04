/**
 * Task Service Client
 *
 * Client for tasks.ft.tc (Celery-Redis) task processing service
 *
 * @see {@link /docs/idea/pages/project-readiness.md} for specification
 * @see {@link /celery-redis/docs/how-to-use-celery-redis.md} for task service docs
 */

import type {
  EvaluationTaskData,
  TaskResponse,
  TaskStatus,
  TaskSubmitRequest,
  HealthCheckResponse,
  TaskError,
} from './types'

export class TaskServiceClient {
  private baseUrl: string
  private apiKey: string
  private timeout: number

  constructor() {
    this.baseUrl = process.env.TASKS_API_URL || 'http://localhost:8001'
    this.apiKey = process.env.TASK_API_KEY || ''
    this.timeout = 60000 // 60 seconds default
  }

  /**
   * Submit department evaluation task to tasks.ft.tc
   */
  async submitEvaluation(data: EvaluationTaskData): Promise<TaskResponse> {
    const requestBody: TaskSubmitRequest = {
      project_id: data.projectId,
      task_type: 'evaluate_department',
      task_data: {
        department_slug: data.departmentSlug,
        department_number: data.departmentNumber,
        gather_data: data.gatherData,
        previous_evaluations: data.previousEvaluations,
        threshold: data.threshold,
      },
      priority: 1, // High priority for user-initiated evaluations
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evaluation-complete`,
      metadata: {
        user_id: data.userId,
        department_id: data.departmentId,
      },
    }

    console.log('[TaskService] Submitting evaluation:', {
      url: `${this.baseUrl}/api/v1/tasks/submit`,
      hasApiKey: !!this.apiKey,
      projectId: requestBody.project_id,
      taskType: requestBody.task_type,
    })

    const response = await fetch(`${this.baseUrl}/api/v1/tasks/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    })

    console.log('[TaskService] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[TaskService] Error response:', errorText)

      let error: TaskError
      try {
        error = JSON.parse(errorText)
      } catch {
        error = {
          error: 'request_failed',
          message: response.statusText || errorText,
        }
      }
      throw new Error(`Task submission failed: ${error.message || error.error}`)
    }

    const result = await response.json()
    console.log('[TaskService] Success:', result)
    return result
  }

  /**
   * Submit automated gather task to tasks.ft.tc
   */
  async submitTask(
    taskType: string,
    taskData: any
  ): Promise<{
    success: boolean
    taskId?: string
    error?: string
    details?: any
  }> {
    try {
      const requestBody: TaskSubmitRequest = {
        project_id: taskData.projectId,
        task_type: taskType,
        task_data: taskData,
        priority: 1,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/automated-gather-progress`,
        metadata: {
          user_id: taskData.userId,
        },
      }

      console.log('[TaskService] Submitting task:', {
        url: `${this.baseUrl}/api/v1/tasks/submit`,
        hasApiKey: !!this.apiKey,
        projectId: requestBody.project_id,
        taskType: requestBody.task_type,
      })

      const response = await fetch(`${this.baseUrl}/api/v1/tasks/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      })

      console.log('[TaskService] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[TaskService] Error response:', errorText)

        let error: TaskError
        try {
          error = JSON.parse(errorText)
        } catch {
          error = {
            error: 'request_failed',
            message: response.statusText || errorText,
          }
        }

        return {
          success: false,
          error: error.message || error.error,
          details: error,
        }
      }

      const result: TaskResponse = await response.json()
      console.log('[TaskService] Success:', result)

      return {
        success: true,
        taskId: result.task_id,
      }
    } catch (error) {
      console.error('[TaskService] Exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      }
    }
  }

  /**
   * Get current status of a task
   */
  async getTaskStatus(taskId: string): Promise<{
    success: boolean
    status?: TaskStatus | any
    error?: string
    details?: any
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}/status`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: `Task ${taskId} not found`,
          }
        }
        const error: TaskError = await response.json().catch(() => ({
          error: 'status_check_failed',
          message: response.statusText,
        }))
        return {
          success: false,
          error: error.message || error.error,
          details: error,
        }
      }

      const status = await response.json()
      return {
        success: true,
        status,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      }
    }
  }

  /**
   * Cancel a running or queued task
   */
  async cancelTask(taskId: string): Promise<{
    success: boolean
    error?: string
    details?: any
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}/cancel`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': this.apiKey,
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok && response.status !== 404) {
        const error: TaskError = await response.json().catch(() => ({
          error: 'cancel_failed',
          message: response.statusText,
        }))
        return {
          success: false,
          error: error.message || error.error,
          details: error,
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      }
    }
  }

  /**
   * Poll task until completion with callback for progress updates
   */
  async pollTaskUntilComplete(
    taskId: string,
    onProgress?: (status: TaskStatus) => void,
    pollInterval: number = 2000,
    maxDuration: number = 600000, // 10 minutes
  ): Promise<TaskStatus> {
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          // Check timeout
          if (Date.now() - startTime > maxDuration) {
            reject(new Error(`Task polling timeout after ${maxDuration}ms`))
            return
          }

          const status = await this.getTaskStatus(taskId)

          // Call progress callback
          if (onProgress) {
            onProgress(status)
          }

          // Check terminal states
          if (status.status === 'completed') {
            resolve(status)
          } else if (status.status === 'failed') {
            reject(new Error(status.error || 'Task failed'))
          } else if (status.status === 'cancelled') {
            reject(new Error('Task was cancelled'))
          } else {
            // Still processing, continue polling
            setTimeout(poll, pollInterval)
          }
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/health`, {
      headers: {
        'X-API-Key': this.apiKey,
      },
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get all tasks for a project
   */
  async getProjectTasks(
    projectId: string,
    options?: {
      status?: string
      taskType?: string
      page?: number
      limit?: number
    },
  ): Promise<any> {
    const params = new URLSearchParams()
    if (options?.status) params.append('status', options.status)
    if (options?.taskType) params.append('task_type', options.taskType)
    if (options?.page) params.append('page', options.page.toString())
    if (options?.limit) params.append('limit', options.limit.toString())

    const response = await fetch(`${this.baseUrl}/api/v1/projects/${projectId}/tasks?${params}`, {
      headers: {
        'X-API-Key': this.apiKey,
      },
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      throw new Error(`Failed to get project tasks: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Submit automated gather task
   */
  async submitAutomatedGather(data: AutomatedGatherTaskData): Promise<TaskResponse> {
    const requestBody = {
      project_id: data.projectId,
      task_type: 'automated_gather',
      task_data: {
        department: data.department,
        department_name: data.departmentName,
        iteration: data.iteration,
        base_nodes: data.baseNodes,
        previous_content: data.previousContent,
        target_quality: data.targetQuality,
        model: data.model || 'claude-3-5-sonnet-20241022',
        max_iterations: data.maxIterations || 3,
      },
      priority: 2,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/automated-gather-complete`,
      metadata: {
        department: data.department,
        iteration: data.iteration,
      },
    }

    console.log('[TaskService] Submitting automated gather:', {
      url: `${this.baseUrl}/api/v1/tasks/submit`,
      projectId: requestBody.project_id,
      department: data.department,
    })

    const response = await fetch(`${this.baseUrl}/api/v1/tasks/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[TaskService] Error response:', errorText)

      let error: TaskError
      try {
        error = JSON.parse(errorText)
      } catch {
        error = {
          error: 'request_failed',
          message: response.statusText || errorText,
        }
      }
      throw new Error(`Automated gather submission failed: ${error.message || error.error}`)
    }

    const result = await response.json()
    console.log('[TaskService] Automated gather submitted:', result)
    return result
  }

  /**
   * Get automation status for a department
   */
  async getAutomationStatus(
    projectId: string,
    department: string,
  ): Promise<DepartmentAutomationStatus> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/projects/${projectId}/automation/${department}`,
      {
        headers: {
          'X-API-Key': this.apiKey,
        },
        signal: AbortSignal.timeout(this.timeout),
      },
    )

    if (!response.ok) {
      if (response.status === 404) {
        return {
          department,
          status: 'idle',
        }
      }
      throw new Error(`Failed to get automation status: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Cancel an automation task
   */
  async cancelAutomation(taskId: string): Promise<{ success: boolean; error?: string }> {
    return this.cancelTask(taskId)
  }
}

// Export singleton instance
export const taskService = new TaskServiceClient()
