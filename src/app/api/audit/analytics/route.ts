/**
 * Audit Trail Analytics API
 * GET /api/audit/analytics - Get comprehensive analytics and insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAnalytics } from '@/lib/agents/audit/analytics'
import type { AnalyticsFilters } from '@/lib/agents/audit/types'

/**
 * GET /api/audit/analytics
 * Get comprehensive analytics with metrics, charts, and insights
 *
 * Query Parameters:
 * - projectId: Filter by project (required if departmentId not provided)
 * - departmentId: Filter by department
 * - agentId: Filter by agent
 * - timeframe: Time period (24h, 7d, 30d, 90d, all) - default: 30d
 * - groupBy: Time grouping (hour, day, week, month) - default: day
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     metrics: { executions, quality, performance, tokens, errors, reviews },
 *     charts: { executionsOverTime, qualityDistribution, ... },
 *     insights: [ { type, category, title, description, impact, recommendation } ],
 *     recommendations: [ "string" ]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Build filters
    const filters: AnalyticsFilters = {
      timeframe: (searchParams.get('timeframe') as any) || '30d',
      groupBy: (searchParams.get('groupBy') as any) || 'day',
    }

    if (searchParams.has('projectId')) {
      filters.projectId = searchParams.get('projectId')!
    }

    if (searchParams.has('departmentId')) {
      filters.departmentId = searchParams.get('departmentId')!
    }

    if (searchParams.has('agentId')) {
      filters.agentId = searchParams.get('agentId')!
    }

    // Validate required filters
    if (!filters.projectId && !filters.departmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either projectId or departmentId is required',
        },
        { status: 400 }
      )
    }

    // Get cache key
    const cacheKey = getCacheKey(filters)

    // Check cache (simple in-memory cache, use Redis in production)
    const cached = analyticsCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        cachedAt: cached.cachedAt,
      })
    }

    // Execute analytics
    const analytics = getAnalytics()
    const result = await analytics.analyze(filters)

    // Cache result (5 minutes TTL)
    analyticsCache.set(cacheKey, {
      data: result,
      cachedAt: Date.now(),
      expiresAt: Date.now() + 300000, // 5 minutes
    })

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate analytics',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/audit/analytics/refresh
 * Force refresh analytics cache
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const filters: AnalyticsFilters = {
      timeframe: body.timeframe || '30d',
      groupBy: body.groupBy || 'day',
      projectId: body.projectId,
      departmentId: body.departmentId,
      agentId: body.agentId,
    }

    if (!filters.projectId && !filters.departmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either projectId or departmentId is required',
        },
        { status: 400 }
      )
    }

    // Clear cache for this query
    const cacheKey = getCacheKey(filters)
    analyticsCache.delete(cacheKey)

    // Execute fresh analytics
    const analytics = getAnalytics()
    const result = await analytics.analyze(filters)

    // Cache new result
    analyticsCache.set(cacheKey, {
      data: result,
      cachedAt: Date.now(),
      expiresAt: Date.now() + 300000,
    })

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
      refreshed: true,
    })
  } catch (error: any) {
    console.error('Analytics refresh error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to refresh analytics',
      },
      { status: 500 }
    )
  }
}

// ========== CACHE IMPLEMENTATION ==========

interface CachedAnalytics {
  data: any
  cachedAt: number
  expiresAt: number
}

const analyticsCache = new Map<string, CachedAnalytics>()

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of analyticsCache.entries()) {
    if (value.expiresAt < now) {
      analyticsCache.delete(key)
    }
  }
}, 600000)

function getCacheKey(filters: AnalyticsFilters): string {
  return `analytics:${filters.projectId || 'none'}:${filters.departmentId || 'none'}:${filters.agentId || 'none'}:${filters.timeframe}:${filters.groupBy || 'day'}`
}
