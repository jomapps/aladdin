/**
 * Centralized Error Handler
 * Phase 7: Production Polish
 */

import { logError } from './logger'

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL',
}

export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION]: 'The provided data is invalid. Please check your input.',
  [ErrorType.AUTHENTICATION]: 'You must be logged in to perform this action.',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.CONFLICT]: 'This action conflicts with existing data.',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please try again later.',
  [ErrorType.EXTERNAL_SERVICE]: 'An external service is temporarily unavailable.',
  [ErrorType.DATABASE]: 'A database error occurred. Please try again.',
  [ErrorType.INTERNAL]: 'An unexpected error occurred. Please try again.',
}

/**
 * Classify error type
 */
export function classifyError(error: any): ErrorType {
  if (error instanceof AppError) {
    return error.type
  }

  const message = error.message?.toLowerCase() || ''

  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorType.VALIDATION
  }
  if (message.includes('auth') || message.includes('token')) {
    return ErrorType.AUTHENTICATION
  }
  if (message.includes('permission') || message.includes('forbidden')) {
    return ErrorType.AUTHORIZATION
  }
  if (message.includes('not found') || message.includes('404')) {
    return ErrorType.NOT_FOUND
  }
  if (message.includes('conflict') || message.includes('duplicate')) {
    return ErrorType.CONFLICT
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return ErrorType.RATE_LIMIT
  }
  if (message.includes('connection') || message.includes('timeout')) {
    return ErrorType.EXTERNAL_SERVICE
  }
  if (message.includes('database') || message.includes('mongo')) {
    return ErrorType.DATABASE
  }

  return ErrorType.INTERNAL
}

/**
 * Get HTTP status code for error type
 */
export function getStatusCode(errorType: ErrorType): number {
  switch (errorType) {
    case ErrorType.VALIDATION:
      return 400
    case ErrorType.AUTHENTICATION:
      return 401
    case ErrorType.AUTHORIZATION:
      return 403
    case ErrorType.NOT_FOUND:
      return 404
    case ErrorType.CONFLICT:
      return 409
    case ErrorType.RATE_LIMIT:
      return 429
    case ErrorType.EXTERNAL_SERVICE:
      return 503
    case ErrorType.DATABASE:
    case ErrorType.INTERNAL:
    default:
      return 500
  }
}

/**
 * Get user-friendly message for error
 */
export function getUserMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message
  }

  const errorType = classifyError(error)
  return ERROR_MESSAGES[errorType]
}

/**
 * Handle error and return response data
 */
export function handleError(error: any, context?: string): {
  message: string
  type: ErrorType
  statusCode: number
  details?: any
} {
  // Log error
  logError(context || 'Unknown', error)

  const errorType = classifyError(error)
  const statusCode = getStatusCode(errorType)
  const message = getUserMessage(error)

  // Include details in development
  const details =
    process.env.NODE_ENV === 'development'
      ? {
          original: error.message,
          stack: error.stack,
        }
      : undefined

  return {
    message,
    type: errorType,
    statusCode,
    details,
  }
}

/**
 * Create API error response
 */
export function createErrorResponse(error: any, context?: string) {
  const errorData = handleError(error, context)

  return {
    error: {
      message: errorData.message,
      type: errorData.type,
      ...(errorData.details && { details: errorData.details }),
    },
  }
}

/**
 * Helper to throw typed errors
 */
export const throwError = {
  validation: (message: string, details?: any) => {
    throw new AppError(message, ErrorType.VALIDATION, 400, details)
  },
  authentication: (message: string = 'Authentication required') => {
    throw new AppError(message, ErrorType.AUTHENTICATION, 401)
  },
  authorization: (message: string = 'Insufficient permissions') => {
    throw new AppError(message, ErrorType.AUTHORIZATION, 403)
  },
  notFound: (resource: string) => {
    throw new AppError(`${resource} not found`, ErrorType.NOT_FOUND, 404)
  },
  conflict: (message: string) => {
    throw new AppError(message, ErrorType.CONFLICT, 409)
  },
}
