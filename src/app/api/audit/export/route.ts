/**
 * Audit Trail Export API
 * POST /api/audit/export - Export audit trail in various formats
 */

import { NextRequest, NextResponse } from 'next/server'
import { getExportService } from '@/lib/agents/audit/export'
import type { ExportOptions } from '@/lib/agents/audit/types'

/**
 * POST /api/audit/export
 * Export audit trail in JSON, CSV, or PDF format
 *
 * Request Body:
 * {
 *   format: 'json' | 'csv' | 'pdf',
 *   filters: {
 *     projectId?: string,
 *     departmentId?: string,
 *     agentId?: string,
 *     dateRange?: { start: Date, end: Date },
 *     status?: string,
 *     minQualityScore?: number,
 *     reviewStatus?: string
 *   },
 *   includeEvents?: boolean,
 *   includeToolCalls?: boolean,
 *   pdfOptions?: {
 *     title?: string,
 *     includeCharts?: boolean,
 *     includeTimeline?: boolean,
 *     includeRecommendations?: boolean
 *   }
 * }
 *
 * Response:
 * - For JSON/CSV: Returns file content directly
 * - For PDF: Returns base64-encoded content or download URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate format
    const format = body.format as 'json' | 'csv' | 'pdf'
    if (!['json', 'csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid format. Must be json, csv, or pdf',
        },
        { status: 400 }
      )
    }

    // Build export options
    const options: ExportOptions = {
      format,
      filters: {
        ...(body.filters?.projectId && { projectId: body.filters.projectId }),
        ...(body.filters?.episodeId && { episodeId: body.filters.episodeId }),
        ...(body.filters?.conversationId && {
          conversationId: body.filters.conversationId,
        }),
        ...(body.filters?.departmentId && { departmentId: body.filters.departmentId }),
        ...(body.filters?.agentId && { agentId: body.filters.agentId }),
        ...(body.filters?.status && { status: body.filters.status }),
        ...(body.filters?.reviewStatus && { reviewStatus: body.filters.reviewStatus }),
        ...(body.filters?.minQualityScore !== undefined && {
          minQualityScore: body.filters.minQualityScore,
        }),
        ...(body.filters?.maxQualityScore !== undefined && {
          maxQualityScore: body.filters.maxQualityScore,
        }),
        ...(body.filters?.dateRange && {
          dateRange: {
            start: new Date(body.filters.dateRange.start),
            end: new Date(body.filters.dateRange.end),
          },
        }),
      },
      includeEvents: body.includeEvents ?? false,
      includeToolCalls: body.includeToolCalls ?? true,
      pdfOptions: body.pdfOptions || {
        title: 'Audit Trail Report',
        includeCharts: true,
        includeTimeline: true,
        includeRecommendations: true,
      },
    }

    // Check required filters
    if (!options.filters.projectId && !options.filters.departmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either projectId or departmentId is required',
        },
        { status: 400 }
      )
    }

    // Execute export
    const exportService = getExportService()
    const result = await exportService.export(options)

    // For JSON and CSV, return content directly
    if (format === 'json' || format === 'csv') {
      return new NextResponse(result.content, {
        status: 200,
        headers: {
          'Content-Type': result.mimeType,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          'Content-Length': result.size.toString(),
        },
      })
    }

    // For PDF, return base64 content
    // In production, you might want to upload to S3 and return a download URL
    return NextResponse.json({
      success: true,
      data: {
        filename: result.filename,
        mimeType: result.mimeType,
        size: result.size,
        content: result.content, // base64-encoded HTML (needs PDF conversion)
        // downloadUrl: result.downloadUrl, // If using cloud storage
        // expiresAt: result.expiresAt,
      },
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to export audit trail',
      },
      { status: 500 }
    )
  }
}

/**
 * Rate limiting middleware (simple implementation)
 * In production, use Redis or a proper rate limiting service
 */
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = rateLimits.get(identifier)

  if (!limit || limit.resetAt < now) {
    rateLimits.set(identifier, {
      count: 1,
      resetAt: now + 60000, // 1 minute window
    })
    return true
  }

  if (limit.count >= 10) {
    // Max 10 exports per minute
    return false
  }

  limit.count++
  return true
}

/**
 * Middleware to check rate limits
 */
export async function middleware(request: NextRequest) {
  // Use IP or user ID for rate limiting
  const identifier =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  if (!checkRateLimit(identifier)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      },
      { status: 429 }
    )
  }

  return NextResponse.next()
}
