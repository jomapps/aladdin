/**
 * Audit Trail Query System
 * Advanced filtering and querying of agent execution history
 */

import { getPayload } from '@/lib/payload'
import type { Payload } from 'payload'
import type {
  AuditQueryFilters,
  AuditQueryOptions,
  AuditQueryResult,
  AuditExecution,
  AuditSummary,
} from './types'

/**
 * Main Audit Trail Query Class
 */
export class AuditTrailQuery {
  private payload: Payload | null = null

  constructor() {
    // Payload will be initialized on first query
  }

  /**
   * Initialize Payload CMS connection
   */
  private async getPayloadClient(): Promise<Payload> {
    if (!this.payload) {
      this.payload = await getPayload()
    }
    return this.payload
  }

  /**
   * Query audit trail with filters and options
   */
  async query(
    filters: AuditQueryFilters = {},
    options: AuditQueryOptions = {}
  ): Promise<AuditQueryResult> {
    const payload = await this.getPayloadClient()

    const {
      limit = 50,
      offset = 0,
      sortBy = 'startedAt',
      sortOrder = 'desc',
      includeEvents = false,
      includeToolCalls = true,
      includeRelations = true,
    } = options

    // Build PayloadCMS where clause
    const where = this.buildWhereClause(filters)

    // Execute query
    const result = await payload.find({
      collection: 'agent-executions',
      where,
      limit,
      page: Math.floor(offset / limit) + 1,
      sort: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`,
      depth: includeRelations ? 2 : 0,
    })

    // Transform results
    const executions = await this.transformExecutions(
      result.docs,
      includeEvents,
      includeToolCalls
    )

    // Calculate summary
    const summary = await this.calculateSummary(filters)

    return {
      executions,
      pagination: {
        total: result.totalDocs,
        limit,
        offset,
        hasMore: result.hasNextPage,
      },
      summary,
    }
  }

  /**
   * Query single execution by ID
   */
  async findById(
    executionId: string,
    options: { includeEvents?: boolean; includeToolCalls?: boolean } = {}
  ): Promise<AuditExecution | null> {
    const payload = await this.getPayloadClient()

    const result = await payload.find({
      collection: 'agent-executions',
      where: {
        executionId: { equals: executionId },
      },
      limit: 1,
      depth: 2,
    })

    if (result.docs.length === 0) {
      return null
    }

    const executions = await this.transformExecutions(
      result.docs,
      options.includeEvents ?? true,
      options.includeToolCalls ?? true
    )

    return executions[0]
  }

  /**
   * Get execution timeline for a project
   */
  async getTimeline(
    projectId: string,
    options: { limit?: number; departmentId?: string } = {}
  ): Promise<Array<{
    timestamp: Date
    executionId: string
    agentName: string
    departmentName: string
    status: string
    qualityScore?: number
  }>> {
    const filters: AuditQueryFilters = {
      projectId,
      ...(options.departmentId && { departmentId: options.departmentId }),
    }

    const result = await this.query(filters, {
      limit: options.limit || 100,
      sortBy: 'startedAt',
      sortOrder: 'asc',
      includeRelations: true,
      includeEvents: false,
      includeToolCalls: false,
    })

    return result.executions.map((exec) => ({
      timestamp: exec.startedAt,
      executionId: exec.executionId,
      agentName: exec.agent.name,
      departmentName: exec.department.name,
      status: exec.status,
      qualityScore: exec.qualityScore,
    }))
  }

  /**
   * Build PayloadCMS where clause from filters
   */
  private buildWhereClause(filters: AuditQueryFilters): any {
    const where: any = {}

    if (filters.projectId) {
      where.project = { equals: filters.projectId }
    }

    if (filters.episodeId) {
      where.episode = { equals: filters.episodeId }
    }

    if (filters.conversationId) {
      where.conversationId = { equals: filters.conversationId }
    }

    if (filters.departmentId) {
      where.department = { equals: filters.departmentId }
    }

    if (filters.agentId) {
      where.agent = { equals: filters.agentId }
    }

    if (filters.status) {
      where.status = { equals: filters.status }
    }

    if (filters.reviewStatus) {
      where.reviewStatus = { equals: filters.reviewStatus }
    }

    if (filters.minQualityScore !== undefined) {
      where.qualityScore = { greater_than_equal: filters.minQualityScore }
    }

    if (filters.maxQualityScore !== undefined) {
      if (where.qualityScore) {
        where.qualityScore.less_than_equal = filters.maxQualityScore
      } else {
        where.qualityScore = { less_than_equal: filters.maxQualityScore }
      }
    }

    if (filters.dateRange) {
      where.and = where.and || []
      where.and.push({
        startedAt: {
          greater_than_equal: filters.dateRange.start.toISOString(),
        },
      })
      where.and.push({
        startedAt: {
          less_than_equal: filters.dateRange.end.toISOString(),
        },
      })
    }

    if (filters.hasErrors !== undefined) {
      if (filters.hasErrors) {
        where['error.message'] = { exists: true }
      }
    }

    if (filters.minExecutionTime !== undefined) {
      where.executionTime = { greater_than_equal: filters.minExecutionTime }
    }

    if (filters.maxExecutionTime !== undefined) {
      if (where.executionTime) {
        where.executionTime.less_than_equal = filters.maxExecutionTime
      } else {
        where.executionTime = { less_than_equal: filters.maxExecutionTime }
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { in: filters.tags }
    }

    return where
  }

  /**
   * Transform raw docs to typed executions
   */
  private async transformExecutions(
    docs: any[],
    includeEvents: boolean,
    includeToolCalls: boolean
  ): Promise<AuditExecution[]> {
    return docs.map((doc) => ({
      id: doc.id,
      executionId: doc.executionId,
      agent: {
        id: typeof doc.agent === 'object' ? doc.agent.id : doc.agent,
        agentId: typeof doc.agent === 'object' ? doc.agent.agentId : '',
        name: typeof doc.agent === 'object' ? doc.agent.name : 'Unknown',
        isDepartmentHead:
          typeof doc.agent === 'object' ? doc.agent.isDepartmentHead : false,
      },
      department: {
        id: typeof doc.department === 'object' ? doc.department.id : doc.department,
        slug: typeof doc.department === 'object' ? doc.department.slug : '',
        name: typeof doc.department === 'object' ? doc.department.name : 'Unknown',
        icon: typeof doc.department === 'object' ? doc.department.icon : '',
      },
      project: {
        id: typeof doc.project === 'object' ? doc.project.id : doc.project,
        name: typeof doc.project === 'object' ? doc.project.name : 'Unknown',
      },
      episode: doc.episode
        ? {
            id: typeof doc.episode === 'object' ? doc.episode.id : doc.episode,
            name: typeof doc.episode === 'object' ? doc.episode.name : 'Unknown',
          }
        : undefined,
      conversationId: doc.conversationId,
      prompt: doc.prompt,
      params: doc.params,
      output: doc.output,
      outputText: doc.outputText,
      status: doc.status,
      startedAt: new Date(doc.startedAt),
      completedAt: doc.completedAt ? new Date(doc.completedAt) : undefined,
      executionTime: doc.executionTime,
      tokenUsage: doc.tokenUsage
        ? {
            inputTokens: doc.tokenUsage.inputTokens || 0,
            outputTokens: doc.tokenUsage.outputTokens || 0,
            totalTokens: doc.tokenUsage.totalTokens || 0,
            estimatedCost: doc.tokenUsage.estimatedCost || 0,
          }
        : undefined,
      qualityScore: doc.qualityScore,
      qualityBreakdown: doc.qualityBreakdown,
      reviewStatus: doc.reviewStatus,
      reviewedBy: doc.reviewedBy
        ? {
            id: typeof doc.reviewedBy === 'object' ? doc.reviewedBy.id : doc.reviewedBy,
            name: typeof doc.reviewedBy === 'object' ? doc.reviewedBy.name : 'Unknown',
          }
        : undefined,
      reviewNotes: doc.reviewNotes,
      reviewedAt: doc.reviewedAt ? new Date(doc.reviewedAt) : undefined,
      error: doc.error,
      retryCount: doc.retryCount || 0,
      events: includeEvents ? doc.events?.map((e: any) => e.event) : undefined,
      toolCalls: includeToolCalls ? doc.toolCalls : undefined,
      tags: doc.tags?.map((t: any) => t.tag) || [],
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    }))
  }

  /**
   * Calculate summary statistics
   */
  private async calculateSummary(filters: AuditQueryFilters): Promise<AuditSummary> {
    const payload = await this.getPayloadClient()
    const where = this.buildWhereClause(filters)

    // Get all matching executions for summary (limited to reasonable size)
    const result = await payload.find({
      collection: 'agent-executions',
      where,
      limit: 10000, // Max for summary calculation
      depth: 0,
    })

    const executions = result.docs

    // Status breakdown
    const statusBreakdown: Record<string, number> = {}
    const reviewStatusBreakdown: Record<string, number> = {}

    let totalQualityScore = 0
    let qualityCount = 0
    let totalExecutionTime = 0
    let executionTimeCount = 0
    let totalTokens = 0
    let totalCost = 0
    let successCount = 0

    for (const exec of executions) {
      // Status
      statusBreakdown[exec.status] = (statusBreakdown[exec.status] || 0) + 1

      // Review status
      reviewStatusBreakdown[exec.reviewStatus] =
        (reviewStatusBreakdown[exec.reviewStatus] || 0) + 1

      // Quality
      if (exec.qualityScore !== undefined && exec.qualityScore !== null) {
        totalQualityScore += exec.qualityScore
        qualityCount++
      }

      // Execution time
      if (exec.executionTime) {
        totalExecutionTime += exec.executionTime
        executionTimeCount++
      }

      // Tokens and cost
      if (exec.tokenUsage) {
        totalTokens += exec.tokenUsage.totalTokens || 0
        totalCost += exec.tokenUsage.estimatedCost || 0
      }

      // Success rate
      if (exec.status === 'completed') {
        successCount++
      }
    }

    return {
      totalExecutions: executions.length,
      statusBreakdown,
      averageQualityScore: qualityCount > 0 ? totalQualityScore / qualityCount : 0,
      averageExecutionTime:
        executionTimeCount > 0 ? totalExecutionTime / executionTimeCount : 0,
      totalTokensUsed: totalTokens,
      totalEstimatedCost: totalCost,
      successRate: executions.length > 0 ? successCount / executions.length : 0,
      reviewStatusBreakdown,
    }
  }

  /**
   * Get quick stats for a project
   */
  async getProjectStats(projectId: string): Promise<{
    totalExecutions: number
    totalCost: number
    averageQuality: number
    successRate: number
    byDepartment: Record<string, number>
  }> {
    const result = await this.query(
      { projectId },
      { limit: 10000, includeRelations: true }
    )

    const byDepartment: Record<string, number> = {}
    for (const exec of result.executions) {
      byDepartment[exec.department.name] =
        (byDepartment[exec.department.name] || 0) + 1
    }

    return {
      totalExecutions: result.summary.totalExecutions,
      totalCost: result.summary.totalEstimatedCost,
      averageQuality: result.summary.averageQualityScore,
      successRate: result.summary.successRate,
      byDepartment,
    }
  }
}

/**
 * Singleton instance
 */
let auditQueryInstance: AuditTrailQuery | null = null

export function getAuditQuery(): AuditTrailQuery {
  if (!auditQueryInstance) {
    auditQueryInstance = new AuditTrailQuery()
  }
  return auditQueryInstance
}
