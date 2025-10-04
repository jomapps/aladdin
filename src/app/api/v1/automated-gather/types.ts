/**
 * TypeScript interfaces for Automated Gather API
 */

export interface AutomatedGatherRequestData {
  projectId: string;
  gatherCount: number;
  userId?: string;
  options?: {
    saveInterval?: number;
    errorRecovery?: boolean;
    notificationPreferences?: {
      onComplete?: boolean;
      onError?: boolean;
      onProgress?: boolean;
    };
  };
}

export interface AutomatedGatherStartRequest {
  projectId: string;
  gatherCount: number;
  options?: AutomatedGatherRequestData['options'];
}

export interface AutomatedGatherStartResponse {
  taskId: string;
  status: 'pending' | 'started';
  message: string;
  data: {
    projectId: string;
    gatherCount: number;
    estimatedDuration?: number;
  };
}

export interface ProgressUpdate {
  type: 'progress' | 'completion' | 'error' | 'save';
  timestamp: string;
  data: {
    currentIteration?: number;
    totalIterations?: number;
    percentage?: number;
    message?: string;
    error?: string;
    savedResults?: {
      iterationNumber: number;
      gatherDataId: string;
    };
  };
}

export interface TaskStatus {
  taskId: string;
  state: 'PENDING' | 'STARTED' | 'PROGRESS' | 'SUCCESS' | 'FAILURE' | 'REVOKED';
  current?: number;
  total?: number;
  percentage?: number;
  result?: {
    status: string;
    completedIterations: number;
    totalIterations: number;
    results: Array<{
      iterationNumber: number;
      gatherDataId: string;
      timestamp: string;
    }>;
    error?: string;
  };
  meta?: {
    progress?: ProgressUpdate[];
    startTime?: string;
    endTime?: string;
  };
}

export interface AutomatedGatherStatusResponse {
  taskId: string;
  status: TaskStatus['state'];
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  result?: TaskStatus['result'];
  updates?: ProgressUpdate[];
  startTime?: string;
  endTime?: string;
}

export interface AutomatedGatherCancelResponse {
  taskId: string;
  status: 'cancelled' | 'already_completed' | 'failed_to_cancel';
  message: string;
  partialResults?: {
    completedIterations: number;
    results: Array<{
      iterationNumber: number;
      gatherDataId: string;
    }>;
  };
}

export interface WebhookProgressPayload {
  taskId: string;
  event: 'progress' | 'complete' | 'error' | 'cancelled';
  data: ProgressUpdate['data'] & {
    state?: TaskStatus['state'];
    result?: TaskStatus['result'];
  };
  timestamp: string;
  signature?: string; // HMAC signature for webhook validation
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  statusCode: number;
}

// Validation schemas
export const AUTOMATED_GATHER_CONSTRAINTS = {
  MIN_GATHER_COUNT: 1,
  MAX_GATHER_COUNT: 100,
  MIN_SAVE_INTERVAL: 1,
  MAX_SAVE_INTERVAL: 50,
} as const;
