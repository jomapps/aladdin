/**
 * Audit Trail Query API
 * GET /api/audit - Query audit trail with filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuditQuery } from '@/lib/agents/audit/query'
import type { AuditQueryFilters, AuditQueryOptions } from '@/lib/agents/audit/types'

/**
 * GET /api/audit
 * Query audit trail with comprehensive filtering
 *
 * Query Parameters:
 * - projectId: Filter by project
 * - episodeId: Filter by episode
 * - conversationId: Filter by conversation
 * - departmentId: Filter by department
 * - agentId: Filter by agent
 * - status: Filter by execution status
 * - reviewStatus: Filter by review status
 * - minQualityScore: Minimum quality score
 * - maxQualityScore: Maximum quality score
 * - dateStart: Start date (ISO string)
 * - dateEnd: End date (ISO string)
 * - minExecutionTime: Minimum execution time (ms)
 * - maxExecutionTime: Maximum execution time (ms)
 * - hasErrors: Filter executions with errors (true/false)
 * - tags: Comma-separated tags
 * - limit: Results per page (default: 50, max: 500)
 * - offset: Pagination offset (default: 0)
 * - sortBy: Sort field (startedAt, completedAt, qualityScore, executionTime)
 * - sortOrder: Sort direction (asc, desc)
 * - includeEvents: Include event data (true/false)
 * - includeToolCalls: Include tool call data (true/false)
 * - includeRelations: Include related data (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Build filters from query params
    const filters: AuditQueryFilters = {}

    if (searchParams.has('projectId')) {
      filters.projectId = searchParams.get('projectId')!
    }

    if (searchParams.has('episodeId')) {
      filters.episodeId = searchParams.get('episodeId')!
    }

    if (searchParams.has('conversationId')) {
      filters.conversationId = searchParams.get('conversationId')!
    }

    if (searchParams.has('departmentId')) {
      filters.departmentId = searchParams.get('departmentId')!
    }

    if (searchParams.has('agentId')) {
      filters.agentId = searchParams.get('agentId')!
    }

    if (searchParams.has('status')) {
      filters.status = searchParams.get('status') as any
    }

    if (searchParams.has('reviewStatus')) {
      filters.reviewStatus = searchParams.get('reviewStatus') as any
    }

    if (searchParams.has('minQualityScore')) {
      filters.minQualityScore = parseFloat(searchParams.get('minQualityScore')!)
    }

    if (searchParams.has('maxQualityScore')) {
      filters.maxQualityScore = parseFloat(searchParams.get('maxQualityScore')!)
    }

    if (searchParams.has('dateStart') && searchParams.has('dateEnd')) {
      filters.dateRange = {
        start: new Date(searchParams.get('dateStart')!),
        end: new Date(searchParams.get('dateEnd')!),
      }
    }

    if (searchParams.has('minExecutionTime')) {
      filters.minExecutionTime = parseInt(searchParams.get('minExecutionTime')!)
    }

    if (searchParams.has('maxExecutionTime')) {
      filters.maxExecutionTime = parseInt(searchParams.get('maxExecutionTime')!)
    }

    if (searchParams.has('hasErrors')) {
      filters.hasErrors = searchParams.get('hasErrors') === 'true'
    }

    if (searchParams.has('tags')) {
      filters.tags = searchParams.get('tags')!.split(',')
    }

    // Build options from query params
    const options: AuditQueryOptions = {
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 500),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') as any) || 'startedAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      includeEvents: searchParams.get('includeEvents') === 'true',
      includeToolCalls: searchParams.get('includeToolCalls') !== 'false', // Default true
      includeRelations: searchParams.get('includeRelations') !== 'false', // Default true
    }

    // Execute query
    const query = getAuditQuery()
    const result = await query.query(filters, options)

    return NextResponse.json({
      success: true,
      data: result,
      filters,
      options,
    })
  } catch (error: any) {
    console.error('Audit query error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to query audit trail',
      },
      { status: 500 },
    )
  }
}

/**
 * TODO: GET /api/audit/[executionId]
 * Get single execution by ID
 *
 * This should be moved to src/app/api/audit/[executionId]/route.ts
 * to follow Next.js App Router conventions for dynamic routes.
 */
