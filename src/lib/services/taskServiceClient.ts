/**
 * Task Service Client for tasks.ft.tc
 * Handles task submission, polling, and webhook management
 */

interface TaskSubmission {
  type: 'video_generation' | 'last_frame_extraction' | 'video_stitch';
  payload: Record<string, any>;
  webhookUrl?: string;
}

interface TaskStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  progress?: number;
}

interface TaskResponse {
  taskId: string;
  status: string;
  pollUrl?: string;
}

export class TaskServiceClient {
  private apiKey: string;
  private baseUrl: string = 'https://tasks.ft.tc';
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TASK_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('TASK_API_KEY is required');
    }
  }

  /**
   * Submit a task to the task service
   */
  async submitTask(submission: TaskSubmission): Promise<TaskResponse> {
    const url = `${this.baseUrl}/api/v1/tasks`;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Task submission failed: ${response.status} - ${error}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === this.maxRetries - 1) throw error;
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    throw new Error('Failed to submit task after retries');
  }

  /**
   * Poll task status until completion or timeout
   */
  async pollTaskStatus(
    taskId: string,
    timeoutMs: number = 600000, // 10 minutes default
    pollIntervalMs: number = 5000
  ): Promise<TaskStatus> {
    const startTime = Date.now();
    const url = `${this.baseUrl}/api/v1/tasks/${taskId}`;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get task status: ${response.status}`);
        }

        const status: TaskStatus = await response.json();

        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }

        // Continue polling
        await this.delay(pollIntervalMs);
      } catch (error) {
        console.error('Error polling task status:', error);
        await this.delay(pollIntervalMs);
      }
    }

    throw new Error(`Task ${taskId} timed out after ${timeoutMs}ms`);
  }

  /**
   * Submit task and wait for completion
   */
  async submitAndWait(
    submission: TaskSubmission,
    timeoutMs: number = 600000
  ): Promise<TaskStatus> {
    const response = await this.submitTask(submission);
    return this.pollTaskStatus(response.taskId, timeoutMs);
  }

  /**
   * Handle webhook callback
   */
  async handleWebhook(payload: any): Promise<TaskStatus> {
    // Validate webhook signature if needed
    return {
      id: payload.taskId,
      status: payload.status,
      result: payload.result,
      error: payload.error,
      progress: payload.progress,
    };
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/tasks/${taskId}/cancel`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel task: ${response.status}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const taskService = new TaskServiceClient();
