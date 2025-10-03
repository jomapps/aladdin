/**
 * Orchestrator API Utility Functions
 * Shared helpers for all orchestrator endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import type { APIError } from '../types'

/**
 * Build error response
 */
export function errorResponse(
  error: string,
  code: string,
  statusCode: number = 500,
  details?: any
): NextResponse<APIError> {
  return NextResponse.json(
    {
      error,
      code,
      details,
      statusCode,
    },
    { status: statusCode }
  )
}

/**
 * Rate limiting helper (basic in-memory implementation)
 * TODO: Replace with Redis-based rate limiting in production
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  userId: string,
  limit: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = `ratelimit:${userId}`

  const current = rateLimitMap.get(key)

  // Reset if window expired
  if (!current || current.resetAt < now) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    }
  }

  // Increment count
  current.count++
  rateLimitMap.set(key, current)

  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  }
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}

/**
 * Extract user from request
 */
export async function authenticateRequest(
  req: NextRequest,
  payload: any
): Promise<{ user: any; error?: NextResponse }> {
  try {
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return {
        user: null,
        error: errorResponse('Unauthorized', 'AUTH_REQUIRED', 401),
      }
    }

    return { user }
  } catch (error: any) {
    return {
      user: null,
      error: errorResponse('Authentication failed', 'AUTH_ERROR', 401, error.message),
    }
  }
}

/**
 * Log API request for monitoring
 */
export function logAPIRequest(
  endpoint: string,
  userId: string,
  metadata: Record<string, any> = {}
) {
  console.log('[API Request]', {
    endpoint,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata,
  })

  // TODO: Send to monitoring service (PostHog, Sentry, etc.)
}

/**
 * Log API error for tracking
 */
export function logAPIError(
  endpoint: string,
  userId: string | null,
  error: Error,
  context?: any
) {
  console.error('[API Error]', {
    endpoint,
    userId,
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })

  // TODO: Send to error tracking service (Sentry)
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: any,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const field of requiredFields) {
    if (!data[field]) {
      missing.push(field)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string, maxLength: number = 10000): string {
  return input.trim().slice(0, maxLength)
}

/**
 * Build cache key
 */
export function buildCacheKey(parts: string[]): string {
  return parts.join(':')
}

/**
 * Calculate estimated processing time based on task complexity
 */
export function estimateProcessingTime(
  taskType: 'query' | 'data' | 'task' | 'chat',
  complexity: 'low' | 'medium' | 'high' = 'medium'
): number {
  const baseTimes = {
    query: 5000, // 5 seconds
    data: 10000, // 10 seconds
    task: 60000, // 1 minute
    chat: 3000, // 3 seconds
  }

  const multipliers = {
    low: 0.5,
    medium: 1,
    high: 2,
  }

  return baseTimes[taskType] * multipliers[complexity]
}

/**
 * Format usage statistics
 */
export function formatUsageStats(stats: {
  tokensUsed: number
  processingTime: number
  cacheHits?: number
  cacheMisses?: number
}): string {
  const parts: string[] = []

  parts.push(`Tokens: ${stats.tokensUsed}`)
  parts.push(`Time: ${(stats.processingTime / 1000).toFixed(2)}s`)

  if (stats.cacheHits !== undefined && stats.cacheMisses !== undefined) {
    const total = stats.cacheHits + stats.cacheMisses
    const hitRate = total > 0 ? ((stats.cacheHits / total) * 100).toFixed(1) : '0'
    parts.push(`Cache: ${hitRate}% hit rate`)
  }

  return parts.join(' | ')
}

/**
 * Check if request is from internal service
 */
export function isInternalRequest(req: NextRequest): boolean {
  const internalToken = req.headers.get('x-internal-token')
  return internalToken === process.env.INTERNAL_API_TOKEN
}

/**
 * Add CORS headers for API responses
 */
export function withCORS(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleOPTIONS(): NextResponse {
  return withCORS(
    new NextResponse(null, {
      status: 204,
    })
  )
}
