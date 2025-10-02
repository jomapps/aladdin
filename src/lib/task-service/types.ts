/**
 * Task Service Types
 *
 * Type definitions for tasks.ft.tc (Celery-Redis) integration
 *
 * @see {@link /docs/idea/pages/project-readiness.md} for specification
 * @see {@link /celery-redis/docs/how-to-use-celery-redis.md} for task service docs
 */

// ========== TASK SUBMISSION ==========

export interface EvaluationTaskData {
  projectId: string
  departmentSlug: string
  departmentNumber: number
  departmentId: string
  gatherData: GatherDataItem[]
  previousEvaluations: PreviousEvaluation[]
  threshold: number
  userId?: string
}

export interface GatherDataItem {
  content: string
  summary?: string
  context?: string
  imageUrl?: string
  documentUrl?: string
}

export interface PreviousEvaluation {
  department: string
  rating: number
  summary: string
}

export interface TaskSubmitRequest {
  project_id: string
  task_type: 'evaluate_department'
  task_data: {
    department_slug: string
    department_number: number
    gather_data: GatherDataItem[]
    previous_evaluations: PreviousEvaluation[]
    threshold: number
  }
  priority: number
  callback_url?: string
  metadata?: Record<string, any>
}

// ========== TASK RESPONSES ==========

export interface TaskResponse {
  task_id: string
  status: TaskStatusValue
  project_id: string
  estimated_duration?: number
  queue_position?: number
  created_at: string
}

export interface TaskStatus {
  task_id: string
  project_id: string
  status: TaskStatusValue
  progress?: number
  current_step?: string
  result?: TaskResult
  error?: string
  started_at?: string
  completed_at?: string
  processing_time?: number
}

export interface TaskResult {
  department: string
  rating: number
  evaluation_result: string
  evaluation_summary: string
  issues: string[]
  suggestions: string[]
  iteration_count: number
  processing_time: number
  metadata?: Record<string, any>
}

export type TaskStatusValue = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

// ========== WEBHOOK PAYLOAD ==========

export interface WebhookPayload {
  task_id: string
  status: TaskStatusValue
  project_id: string
  result?: TaskResult
  error?: string
  processing_time?: number
  completed_at?: string
  metadata?: {
    user_id?: string
    department_id?: string
    [key: string]: any
  }
}

// ========== SERVICE CONFIGURATION ==========

export interface TaskServiceConfig {
  baseUrl: string
  apiKey: string
  timeout?: number
}

// ========== ERROR RESPONSES ==========

export interface TaskError {
  error: string
  message: string
  details?: Record<string, any>
  retry_after?: number
}

// ========== HEALTH CHECK ==========

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  redis_status: string
  worker_count: number
  queue_sizes: {
    gpu_heavy: number
    gpu_medium: number
    cpu_intensive: number
  }
  system_load?: {
    cpu_percent: number
    memory_percent: number
    gpu_utilization: number[]
  }
  uptime: number
}
