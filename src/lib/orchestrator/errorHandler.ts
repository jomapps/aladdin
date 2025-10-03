/**
 * Centralized Error Handling for Orchestrator
 * Maps different error types to user-friendly messages with retry logic
 */

export interface OrchestratorError {
  code: ErrorCode
  message: string
  details?: any
  stack?: string
  retryable: boolean
}

export enum ErrorCode {
  // Authentication
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELDS = 'MISSING_FIELDS',

  // Resources
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',

  // External Services
  LLM_ERROR = 'LLM_ERROR',
  BRAIN_ERROR = 'BRAIN_ERROR',
  AGENT_ERROR = 'AGENT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Rate Limits
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',

  // Internal
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Map errors to user-friendly OrchestratorError
 */
export function handleOrchestratorError(error: any): OrchestratorError {
  const errorMessage = error?.message || String(error)

  // LLM errors
  if (
    errorMessage.includes('OpenRouter') ||
    errorMessage.includes('API error') ||
    errorMessage.includes('LLM')
  ) {
    return {
      code: ErrorCode.LLM_ERROR,
      message: 'AI service temporarily unavailable. Please try again.',
      details: errorMessage,
      stack: error?.stack,
      retryable: true,
    }
  }

  // Brain/Neo4j errors
  if (
    errorMessage.includes('Brain') ||
    errorMessage.includes('Neo4j') ||
    errorMessage.includes('semantic search')
  ) {
    return {
      code: ErrorCode.BRAIN_ERROR,
      message: 'Knowledge base unavailable. Some features may be limited.',
      details: errorMessage,
      stack: error?.stack,
      retryable: true,
    }
  }

  // Agent execution errors
  if (
    errorMessage.includes('Agent') ||
    errorMessage.includes('Codebuff') ||
    errorMessage.includes('@codebuff/sdk')
  ) {
    return {
      code: ErrorCode.AGENT_ERROR,
      message: 'Agent execution failed. Please try again.',
      details: errorMessage,
      stack: error?.stack,
      retryable: true,
    }
  }

  // Database errors
  if (
    errorMessage.includes('MongoDB') ||
    errorMessage.includes('database') ||
    errorMessage.includes('Payload')
  ) {
    return {
      code: ErrorCode.DATABASE_ERROR,
      message: 'Database temporarily unavailable. Please try again.',
      details: errorMessage,
      stack: error?.stack,
      retryable: true,
    }
  }

  // Rate limiting errors
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('429') ||
    errorMessage.includes('too many requests')
  ) {
    return {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Rate limit exceeded. Please wait a moment and try again.',
      details: errorMessage,
      stack: error?.stack,
      retryable: true,
    }
  }

  // Token limit errors
  if (
    errorMessage.includes('token limit') ||
    errorMessage.includes('context length')
  ) {
    return {
      code: ErrorCode.TOKEN_LIMIT_EXCEEDED,
      message: 'Message too long. Please shorten your input and try again.',
      details: errorMessage,
      stack: error?.stack,
      retryable: false,
    }
  }

  // Authentication errors
  if (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('401') ||
    errorMessage.includes('authentication')
  ) {
    return {
      code: ErrorCode.AUTH_REQUIRED,
      message: 'Authentication required. Please sign in.',
      details: errorMessage,
      stack: error?.stack,
      retryable: false,
    }
  }

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required')
  ) {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: errorMessage,
      details: errorMessage,
      stack: error?.stack,
      retryable: false,
    }
  }

  // Default internal error
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred. Please try again.',
    details: errorMessage,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    retryable: false,
  }
}

/**
 * Retry failed operations with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    shouldRetry?: (error: any) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => handleOrchestratorError(error).retryable,
  } = options

  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === maxRetries - 1 || !shouldRetry(error)) {
        throw error
      }

      // Calculate exponential backoff delay
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay)

      console.log(
        `[retryOperation] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`,
        error?.message || error
      )

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Wrap async operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const orchestratorError = handleOrchestratorError(error)

    console.error(`[${context}] Error:`, {
      code: orchestratorError.code,
      message: orchestratorError.message,
      details: orchestratorError.details,
    })

    throw orchestratorError
  }
}
