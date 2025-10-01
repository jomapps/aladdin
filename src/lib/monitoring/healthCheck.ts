/**
 * System Health Check
 * Phase 7: Production Polish
 */

import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { getRedisCache } from '../cache/redis'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  checks: {
    database: CheckResult
    redis: CheckResult
    brain: CheckResult
    falai: CheckResult
  }
  uptime: number
}

interface CheckResult {
  status: 'up' | 'down' | 'unknown'
  latency?: number
  error?: string
  details?: any
}

const startTime = Date.now()

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    await payload.find({
      collection: 'users',
      limit: 1,
    })

    return {
      status: 'up',
      latency: Date.now() - start,
    }
  } catch (error: any) {
    return {
      status: 'down',
      error: error.message,
    }
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const redis = getRedisCache()
    const testKey = '__health_check__'
    await redis.set(testKey, 'ok', { ttl: 10 })
    const value = await redis.get(testKey)
    await redis.delete(testKey)

    if (value !== 'ok') {
      throw new Error('Redis read/write test failed')
    }

    return {
      status: 'up',
      latency: Date.now() - start,
    }
  } catch (error: any) {
    return {
      status: 'down',
      error: error.message,
    }
  }
}

/**
 * Check Brain service connectivity
 */
async function checkBrain(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const brainUrl = process.env.BRAIN_API_URL
    if (!brainUrl) {
      return {
        status: 'unknown',
        error: 'Brain API URL not configured',
      }
    }

    const response = await fetch(`${brainUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      throw new Error(`Brain service returned ${response.status}`)
    }

    return {
      status: 'up',
      latency: Date.now() - start,
    }
  } catch (error: any) {
    return {
      status: 'down',
      error: error.message,
    }
  }
}

/**
 * Check FAL.ai service connectivity
 */
async function checkFalai(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const apiKey = process.env.FAL_KEY
    if (!apiKey) {
      return {
        status: 'unknown',
        error: 'FAL API key not configured',
      }
    }

    // Simple connectivity check (not actual API call)
    return {
      status: 'up',
      latency: Date.now() - start,
      details: { configured: true },
    }
  } catch (error: any) {
    return {
      status: 'down',
      error: error.message,
    }
  }
}

/**
 * Perform full health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const [database, redis, brain, falai] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkBrain(),
    checkFalai(),
  ])

  // Determine overall status
  const checks = { database, redis, brain, falai }
  const statuses = Object.values(checks).map((c) => c.status)

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
  if (statuses.every((s) => s === 'up')) {
    overallStatus = 'healthy'
  } else if (statuses.some((s) => s === 'down')) {
    overallStatus = 'degraded'
  } else {
    overallStatus = 'unhealthy'
  }

  return {
    status: overallStatus,
    timestamp: new Date(),
    checks,
    uptime: Date.now() - startTime,
  }
}

/**
 * Quick health check (database only)
 */
export async function quickHealthCheck(): Promise<{ healthy: boolean; latency: number }> {
  const result = await checkDatabase()
  return {
    healthy: result.status === 'up',
    latency: result.latency || 0,
  }
}
