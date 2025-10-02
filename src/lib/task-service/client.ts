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
    this.apiKey = process.env.CELERY_TASK_API_KEY || ''
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
      const error: TaskError = await response.json().catch(() => ({
        error: 'request_failed',
        message: response.statusText,
      }))
      throw new Error(`Task submission failed: ${error.message}`)
    }

    return response.json()
  }

  /**
   * Get current status of a task
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}/status`, {
      headers: {
        'X-API-Key': this.apiKey,
      },
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Task ${taskId} not found`)
      }
      const error: TaskError = await response.json().catch(() => ({
        error: 'status_check_failed',
        message: response.statusText,
      }))
      throw new Error(`Failed to get task status: ${error.message}`)
    }

    return response.json()
  }

  /**
   * Cancel a running or queued task
   */
  async cancelTask(taskId: string): Promise<void> {
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
      throw new Error(`Failed to cancel task: ${error.message}`)
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

    const response = await fetch(
      `${this.baseUrl}/api/v1/projects/${projectId}/tasks?${params}`,
      {
        headers: {
          'X-API-Key': this.apiKey,
        },
        signal: AbortSignal.timeout(this.timeout),
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to get project tasks: ${response.statusText}`)
    }

    return response.json()
  }
}

// Export singleton instance
export const taskService = new TaskServiceClient()
