/**
 * Audit Trail Analytics System
 * Advanced metrics aggregation and trend analysis
 */

import { getAuditQuery } from './query'
import type {
  AnalyticsFilters,
  AnalyticsResult,
  AnalyticsMetrics,
  AnalyticsCharts,
  AnalyticsInsight,
  QualityDistribution,
  QualityTrend,
  ErrorPattern,
  TimeSeriesData,
  DistributionData,
  ComparisonData,
  PerformanceData,
} from './types'

/**
 * Analytics Service
 */
export class AuditAnalyticsService {
  /**
   * Analyze audit trail data with comprehensive metrics
   */
  async analyze(filters: AnalyticsFilters): Promise<AnalyticsResult> {
    const query = getAuditQuery()

    // Calculate date range based on timeframe
    const dateRange = this.calculateDateRange(filters.timeframe)

    // Query all relevant executions
    const result = await query.query(
      {
        projectId: filters.projectId,
        departmentId: filters.departmentId,
        agentId: filters.agentId,
        dateRange,
      },
      {
        limit: 10000,
        includeRelations: true,
        includeToolCalls: true,
        includeEvents: false,
      }
    )

    const executions = result.executions

    // Calculate all metrics
    const metrics = await this.calculateMetrics(executions)
    const charts = await this.prepareCharts(executions, filters)
    const insights = await this.generateInsights(metrics, executions)
    const recommendations = this.generateRecommendations(insights, metrics)

    return {
      metrics,
      charts,
      insights,
      recommendations,
    }
  }

  /**
   * Calculate comprehensive metrics
   */
  private async calculateMetrics(executions: any[]): Promise<AnalyticsMetrics> {
    // Executions metrics
    const executionsByStatus: Record<string, number> = {}
    const executionsByDepartment: Record<string, number> = {}
    const executionsByAgent: Record<string, number> = {}

    for (const exec of executions) {
      executionsByStatus[exec.status] = (executionsByStatus[exec.status] || 0) + 1
      executionsByDepartment[exec.department.name] =
        (executionsByDepartment[exec.department.name] || 0) + 1
      executionsByAgent[exec.agent.name] =
        (executionsByAgent[exec.agent.name] || 0) + 1
    }

    // Quality metrics
    const qualityScores = executions
      .filter((e) => e.qualityScore !== null && e.qualityScore !== undefined)
      .map((e) => e.qualityScore)
      .sort((a, b) => a - b)

    const qualityAverage =
      qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0

    const qualityMedian =
      qualityScores.length > 0
        ? qualityScores[Math.floor(qualityScores.length / 2)]
        : 0

    const qualityDistribution = this.calculateQualityDistribution(qualityScores)

    // Quality by department
    const qualityByDepartment: Record<string, number> = {}
    const deptQualityMap = new Map<string, number[]>()

    for (const exec of executions) {
      if (exec.qualityScore !== null && exec.qualityScore !== undefined) {
        if (!deptQualityMap.has(exec.department.name)) {
          deptQualityMap.set(exec.department.name, [])
        }
        deptQualityMap.get(exec.department.name)!.push(exec.qualityScore)
      }
    }

    for (const [dept, scores] of deptQualityMap.entries()) {
      qualityByDepartment[dept] = scores.reduce((a, b) => a + b, 0) / scores.length
    }

    // Quality by agent
    const qualityByAgent: Record<string, number> = {}
    const agentQualityMap = new Map<string, number[]>()

    for (const exec of executions) {
      if (exec.qualityScore !== null && exec.qualityScore !== undefined) {
        if (!agentQualityMap.has(exec.agent.name)) {
          agentQualityMap.set(exec.agent.name, [])
        }
        agentQualityMap.get(exec.agent.name)!.push(exec.qualityScore)
      }
    }

    for (const [agent, scores] of agentQualityMap.entries()) {
      qualityByAgent[agent] = scores.reduce((a, b) => a + b, 0) / scores.length
    }

    // Quality trends
    const qualityTrends = this.calculateQualityTrends(executions)

    // Performance metrics
    const executionTimes = executions
      .filter((e) => e.executionTime)
      .map((e) => e.executionTime)
      .sort((a, b) => a - b)

    const avgExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
        : 0

    const medianExecutionTime =
      executionTimes.length > 0
        ? executionTimes[Math.floor(executionTimes.length / 2)]
        : 0

    const p95ExecutionTime =
      executionTimes.length > 0
        ? executionTimes[Math.floor(executionTimes.length * 0.95)]
        : 0

    const p99ExecutionTime =
      executionTimes.length > 0
        ? executionTimes[Math.floor(executionTimes.length * 0.99)]
        : 0

    // Performance by department
    const performanceByDepartment: Record<string, number> = {}
    const deptPerfMap = new Map<string, number[]>()

    for (const exec of executions) {
      if (exec.executionTime) {
        if (!deptPerfMap.has(exec.department.name)) {
          deptPerfMap.set(exec.department.name, [])
        }
        deptPerfMap.get(exec.department.name)!.push(exec.executionTime)
      }
    }

    for (const [dept, times] of deptPerfMap.entries()) {
      performanceByDepartment[dept] = times.reduce((a, b) => a + b, 0) / times.length
    }

    // Performance by agent
    const performanceByAgent: Record<string, number> = {}
    const agentPerfMap = new Map<string, number[]>()

    for (const exec of executions) {
      if (exec.executionTime) {
        if (!agentPerfMap.has(exec.agent.name)) {
          agentPerfMap.set(exec.agent.name, [])
        }
        agentPerfMap.get(exec.agent.name)!.push(exec.executionTime)
      }
    }

    for (const [agent, times] of agentPerfMap.entries()) {
      performanceByAgent[agent] = times.reduce((a, b) => a + b, 0) / times.length
    }

    // Token metrics
    const totalTokens = executions.reduce(
      (sum, e) => sum + (e.tokenUsage?.totalTokens || 0),
      0
    )
    const avgTokensPerExecution = totalTokens / (executions.length || 1)
    const totalCost = executions.reduce(
      (sum, e) => sum + (e.tokenUsage?.estimatedCost || 0),
      0
    )

    // Tokens by department
    const tokensByDepartment: Record<string, number> = {}
    const deptTokenMap = new Map<string, number>()

    for (const exec of executions) {
      const tokens = exec.tokenUsage?.totalTokens || 0
      deptTokenMap.set(
        exec.department.name,
        (deptTokenMap.get(exec.department.name) || 0) + tokens
      )
    }

    for (const [dept, tokens] of deptTokenMap.entries()) {
      tokensByDepartment[dept] = tokens
    }

    // Tokens by agent
    const tokensByAgent: Record<string, number> = {}
    const agentTokenMap = new Map<string, number>()

    for (const exec of executions) {
      const tokens = exec.tokenUsage?.totalTokens || 0
      agentTokenMap.set(
        exec.agent.name,
        (agentTokenMap.get(exec.agent.name) || 0) + tokens
      )
    }

    for (const [agent, tokens] of agentTokenMap.entries()) {
      tokensByAgent[agent] = tokens
    }

    // Error metrics
    const errors = executions.filter((e) => e.error?.message)
    const errorRate = errors.length / (executions.length || 1)

    const errorsByType: Record<string, number> = {}
    const errorsByAgent: Record<string, number> = {}

    for (const exec of errors) {
      const errorType = exec.error?.code || 'unknown'
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1
      errorsByAgent[exec.agent.name] = (errorsByAgent[exec.agent.name] || 0) + 1
    }

    const commonPatterns = this.detectErrorPatterns(errors)

    // Review metrics
    const reviewsByStatus: Record<string, number> = {}
    for (const exec of executions) {
      reviewsByStatus[exec.reviewStatus] =
        (reviewsByStatus[exec.reviewStatus] || 0) + 1
    }

    const approvedCount = reviewsByStatus['approved'] || 0
    const totalReviewed =
      (reviewsByStatus['approved'] || 0) +
      (reviewsByStatus['rejected'] || 0) +
      (reviewsByStatus['revision-needed'] || 0)

    const approvalRate = totalReviewed > 0 ? approvedCount / totalReviewed : 0

    // Average review time
    const reviewTimes = executions
      .filter((e) => e.reviewedAt && e.completedAt)
      .map(
        (e) =>
          new Date(e.reviewedAt!).getTime() - new Date(e.completedAt!).getTime()
      )

    const avgReviewTime =
      reviewTimes.length > 0
        ? reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length
        : 0

    return {
      executions: {
        total: executions.length,
        byStatus: executionsByStatus,
        byDepartment: executionsByDepartment,
        byAgent: executionsByAgent,
      },
      quality: {
        average: qualityAverage,
        median: qualityMedian,
        distribution: qualityDistribution,
        byDepartment: qualityByDepartment,
        byAgent: qualityByAgent,
        trends: qualityTrends,
      },
      performance: {
        averageExecutionTime: avgExecutionTime,
        medianExecutionTime: medianExecutionTime,
        p95ExecutionTime: p95ExecutionTime,
        p99ExecutionTime: p99ExecutionTime,
        byDepartment: performanceByDepartment,
        byAgent: performanceByAgent,
      },
      tokens: {
        totalUsed: totalTokens,
        averagePerExecution: avgTokensPerExecution,
        byDepartment: tokensByDepartment,
        byAgent: tokensByAgent,
        estimatedTotalCost: totalCost,
      },
      errors: {
        total: errors.length,
        rate: errorRate,
        byType: errorsByType,
        byAgent: errorsByAgent,
        commonPatterns,
      },
      reviews: {
        byStatus: reviewsByStatus,
        approvalRate,
        averageReviewTime: avgReviewTime,
      },
    }
  }

  /**
   * Prepare chart data
   */
  private async prepareCharts(
    executions: any[],
    filters: AnalyticsFilters
  ): Promise<AnalyticsCharts> {
    // Executions over time
    const executionsOverTime = this.groupByTime(
      executions,
      filters.groupBy || 'day'
    )

    // Quality score distribution
    const qualityScoreDistribution = this.createQualityDistribution(executions)

    // Execution time distribution
    const executionTimeDistribution = this.createExecutionTimeDistribution(executions)

    // Department comparison
    const departmentComparison = this.createDepartmentComparison(executions)

    // Agent performance
    const agentPerformance = this.createAgentPerformance(executions)

    // Token usage over time
    const tokenUsageOverTime = this.groupTokensByTime(
      executions,
      filters.groupBy || 'day'
    )

    // Error rate over time
    const errorRateOverTime = this.groupErrorsByTime(
      executions,
      filters.groupBy || 'day'
    )

    return {
      executionsOverTime,
      qualityScoreDistribution,
      executionTimeDistribution,
      departmentComparison,
      agentPerformance,
      tokenUsageOverTime,
      errorRateOverTime,
    }
  }

  /**
   * Generate insights from metrics
   */
  private async generateInsights(
    metrics: AnalyticsMetrics,
    executions: any[]
  ): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = []

    // Success rate insight
    const successRate =
      (metrics.executions.byStatus['completed'] || 0) / metrics.executions.total
    if (successRate < 0.8) {
      insights.push({
        type: 'warning',
        category: 'reliability',
        title: 'Low Success Rate Detected',
        description: `Only ${(successRate * 100).toFixed(1)}% of executions completed successfully.`,
        impact: 'high',
        recommendation:
          'Investigate failed executions and implement error handling improvements.',
      })
    } else if (successRate >= 0.95) {
      insights.push({
        type: 'success',
        category: 'reliability',
        title: 'Excellent Reliability',
        description: `Success rate is ${(successRate * 100).toFixed(1)}%.`,
        impact: 'low',
      })
    }

    // Quality insight
    if (metrics.quality.average < 70) {
      insights.push({
        type: 'error',
        category: 'quality',
        title: 'Quality Below Threshold',
        description: `Average quality score is ${metrics.quality.average.toFixed(1)}, below the 70 threshold.`,
        impact: 'high',
        recommendation:
          'Review agent instructions and consider retraining or prompt optimization.',
      })
    } else if (metrics.quality.average >= 85) {
      insights.push({
        type: 'success',
        category: 'quality',
        title: 'High Quality Output',
        description: `Average quality score is ${metrics.quality.average.toFixed(1)}.`,
        impact: 'low',
      })
    }

    // Performance insight
    if (metrics.performance.averageExecutionTime > 30000) {
      insights.push({
        type: 'warning',
        category: 'performance',
        title: 'Slow Execution Times',
        description: `Average execution time is ${(metrics.performance.averageExecutionTime / 1000).toFixed(1)}s.`,
        impact: 'medium',
        recommendation:
          'Consider optimizing prompts, using parallel execution, or caching common results.',
      })
    }

    // Cost insight
    if (metrics.tokens.estimatedTotalCost > 100) {
      insights.push({
        type: 'info',
        category: 'cost',
        title: 'High Token Usage',
        description: `Total estimated cost is $${metrics.tokens.estimatedTotalCost.toFixed(2)}.`,
        impact: 'medium',
        recommendation: 'Implement caching strategies and optimize prompts to reduce costs.',
      })
    }

    // Error rate insight
    if (metrics.errors.rate > 0.1) {
      insights.push({
        type: 'error',
        category: 'reliability',
        title: 'High Error Rate',
        description: `${(metrics.errors.rate * 100).toFixed(1)}% of executions resulted in errors.`,
        impact: 'high',
        recommendation: 'Analyze error patterns and implement robust error handling.',
        data: { commonPatterns: metrics.errors.commonPatterns },
      })
    }

    return insights
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    insights: AnalyticsInsight[],
    metrics: AnalyticsMetrics
  ): string[] {
    const recommendations: string[] = []

    // Extract high-impact insights
    const highImpactInsights = insights.filter((i) => i.impact === 'high')
    for (const insight of highImpactInsights) {
      if (insight.recommendation) {
        recommendations.push(insight.recommendation)
      }
    }

    // Department-specific recommendations
    const lowQualityDepts = Object.entries(metrics.quality.byDepartment).filter(
      ([, score]) => score < 70
    )
    if (lowQualityDepts.length > 0) {
      recommendations.push(
        `Focus quality improvement on: ${lowQualityDepts.map(([dept]) => dept).join(', ')}`
      )
    }

    // Agent-specific recommendations
    const lowQualityAgents = Object.entries(metrics.quality.byAgent).filter(
      ([, score]) => score < 70
    )
    if (lowQualityAgents.length > 0) {
      recommendations.push(
        `Review and retrain the following agents: ${lowQualityAgents.map(([agent]) => agent).join(', ')}`
      )
    }

    return recommendations
  }

  // ========== HELPER METHODS ==========

  private calculateDateRange(timeframe: string): { start: Date; end: Date } {
    const end = new Date()
    const start = new Date()

    switch (timeframe) {
      case '24h':
        start.setHours(start.getHours() - 24)
        break
      case '7d':
        start.setDate(start.getDate() - 7)
        break
      case '30d':
        start.setDate(start.getDate() - 30)
        break
      case '90d':
        start.setDate(start.getDate() - 90)
        break
      case 'all':
        start.setFullYear(2020) // Far back enough
        break
    }

    return { start, end }
  }

  private calculateQualityDistribution(scores: number[]): QualityDistribution {
    return {
      excellent: scores.filter((s) => s >= 90).length,
      good: scores.filter((s) => s >= 80 && s < 90).length,
      fair: scores.filter((s) => s >= 70 && s < 80).length,
      poor: scores.filter((s) => s >= 60 && s < 70).length,
      failing: scores.filter((s) => s < 60).length,
    }
  }

  private calculateQualityTrends(executions: any[]): QualityTrend[] {
    const trends: QualityTrend[] = []
    const grouped = this.groupByDay(executions)

    for (const [day, execs] of grouped.entries()) {
      const scores = execs
        .filter((e: any) => e.qualityScore !== null && e.qualityScore !== undefined)
        .map((e: any) => e.qualityScore)

      if (scores.length > 0) {
        trends.push({
          period: day,
          averageScore: scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
          count: scores.length,
        })
      }
    }

    return trends.sort((a, b) => a.period.localeCompare(b.period))
  }

  private detectErrorPatterns(errors: any[]): ErrorPattern[] {
    const patterns = new Map<string, ErrorPattern>()

    for (const error of errors) {
      const message = error.error?.message || 'Unknown error'
      const pattern = this.extractErrorPattern(message)

      if (!patterns.has(pattern)) {
        patterns.set(pattern, {
          pattern,
          count: 0,
          percentage: 0,
          affectedAgents: [],
          lastOccurrence: new Date(error.completedAt || error.startedAt),
        })
      }

      const p = patterns.get(pattern)!
      p.count++
      if (!p.affectedAgents.includes(error.agent.name)) {
        p.affectedAgents.push(error.agent.name)
      }
      const errorDate = new Date(error.completedAt || error.startedAt)
      if (errorDate > p.lastOccurrence) {
        p.lastOccurrence = errorDate
      }
    }

    // Calculate percentages
    const totalErrors = errors.length
    for (const pattern of patterns.values()) {
      pattern.percentage = (pattern.count / totalErrors) * 100
    }

    return Array.from(patterns.values()).sort((a, b) => b.count - a.count)
  }

  private extractErrorPattern(message: string): string {
    // Extract common error patterns
    if (message.includes('timeout')) return 'Timeout Error'
    if (message.includes('rate limit')) return 'Rate Limit Error'
    if (message.includes('network')) return 'Network Error'
    if (message.includes('token')) return 'Token Limit Error'
    if (message.includes('authentication')) return 'Authentication Error'
    return 'Other Error'
  }

  private groupByTime(
    executions: any[],
    groupBy: 'hour' | 'day' | 'week' | 'month'
  ): TimeSeriesData[] {
    const grouped = new Map<string, number>()

    for (const exec of executions) {
      const key = this.getTimeKey(new Date(exec.startedAt), groupBy)
      grouped.set(key, (grouped.get(key) || 0) + 1)
    }

    return Array.from(grouped.entries())
      .map(([timestamp, value]) => ({
        timestamp: new Date(timestamp),
        value,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private groupTokensByTime(
    executions: any[],
    groupBy: 'hour' | 'day' | 'week' | 'month'
  ): TimeSeriesData[] {
    const grouped = new Map<string, number>()

    for (const exec of executions) {
      const key = this.getTimeKey(new Date(exec.startedAt), groupBy)
      const tokens = exec.tokenUsage?.totalTokens || 0
      grouped.set(key, (grouped.get(key) || 0) + tokens)
    }

    return Array.from(grouped.entries())
      .map(([timestamp, value]) => ({
        timestamp: new Date(timestamp),
        value,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private groupErrorsByTime(
    executions: any[],
    groupBy: 'hour' | 'day' | 'week' | 'month'
  ): TimeSeriesData[] {
    const grouped = new Map<string, { errors: number; total: number }>()

    for (const exec of executions) {
      const key = this.getTimeKey(new Date(exec.startedAt), groupBy)
      if (!grouped.has(key)) {
        grouped.set(key, { errors: 0, total: 0 })
      }
      const data = grouped.get(key)!
      data.total++
      if (exec.error?.message) {
        data.errors++
      }
    }

    return Array.from(grouped.entries())
      .map(([timestamp, data]) => ({
        timestamp: new Date(timestamp),
        value: data.total > 0 ? (data.errors / data.total) * 100 : 0,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private getTimeKey(date: Date, groupBy: string): string {
    switch (groupBy) {
      case 'hour':
        return date.toISOString().slice(0, 13)
      case 'day':
        return date.toISOString().slice(0, 10)
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return weekStart.toISOString().slice(0, 10)
      case 'month':
        return date.toISOString().slice(0, 7)
      default:
        return date.toISOString().slice(0, 10)
    }
  }

  private groupByDay(executions: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>()

    for (const exec of executions) {
      const day = new Date(exec.startedAt).toISOString().slice(0, 10)
      if (!grouped.has(day)) {
        grouped.set(day, [])
      }
      grouped.get(day)!.push(exec)
    }

    return grouped
  }

  private createQualityDistribution(executions: any[]): DistributionData[] {
    const buckets = [
      { label: '0-20', min: 0, max: 20 },
      { label: '20-40', min: 20, max: 40 },
      { label: '40-60', min: 40, max: 60 },
      { label: '60-80', min: 60, max: 80 },
      { label: '80-100', min: 80, max: 100 },
    ]

    const counts: Record<string, number> = {}
    const total = executions.filter(
      (e) => e.qualityScore !== null && e.qualityScore !== undefined
    ).length

    for (const bucket of buckets) {
      counts[bucket.label] = executions.filter(
        (e) =>
          e.qualityScore >= bucket.min &&
          e.qualityScore <= bucket.max &&
          e.qualityScore !== null &&
          e.qualityScore !== undefined
      ).length
    }

    return buckets.map((bucket) => ({
      bucket: bucket.label,
      count: counts[bucket.label],
      percentage: total > 0 ? (counts[bucket.label] / total) * 100 : 0,
    }))
  }

  private createExecutionTimeDistribution(executions: any[]): DistributionData[] {
    const buckets = [
      { label: '0-5s', min: 0, max: 5000 },
      { label: '5-10s', min: 5000, max: 10000 },
      { label: '10-30s', min: 10000, max: 30000 },
      { label: '30-60s', min: 30000, max: 60000 },
      { label: '60s+', min: 60000, max: Infinity },
    ]

    const counts: Record<string, number> = {}
    const total = executions.filter((e) => e.executionTime).length

    for (const bucket of buckets) {
      counts[bucket.label] = executions.filter(
        (e) => e.executionTime >= bucket.min && e.executionTime < bucket.max
      ).length
    }

    return buckets.map((bucket) => ({
      bucket: bucket.label,
      count: counts[bucket.label],
      percentage: total > 0 ? (counts[bucket.label] / total) * 100 : 0,
    }))
  }

  private createDepartmentComparison(executions: any[]): ComparisonData[] {
    const deptMap = new Map<string, { total: number; quality: number[] }>()

    for (const exec of executions) {
      if (!deptMap.has(exec.department.name)) {
        deptMap.set(exec.department.name, { total: 0, quality: [] })
      }
      const data = deptMap.get(exec.department.name)!
      data.total++
      if (exec.qualityScore !== null && exec.qualityScore !== undefined) {
        data.quality.push(exec.qualityScore)
      }
    }

    return Array.from(deptMap.entries()).map(([name, data]) => ({
      label: name,
      value: data.quality.length > 0
        ? data.quality.reduce((a, b) => a + b, 0) / data.quality.length
        : 0,
      metadata: { total: data.total },
    }))
  }

  private createAgentPerformance(executions: any[]): PerformanceData[] {
    const agentMap = new Map<
      string,
      {
        agentId: string
        agentName: string
        total: number
        completed: number
        quality: number[]
        executionTimes: number[]
      }
    >()

    for (const exec of executions) {
      if (!agentMap.has(exec.agent.id)) {
        agentMap.set(exec.agent.id, {
          agentId: exec.agent.id,
          agentName: exec.agent.name,
          total: 0,
          completed: 0,
          quality: [],
          executionTimes: [],
        })
      }
      const data = agentMap.get(exec.agent.id)!
      data.total++
      if (exec.status === 'completed') {
        data.completed++
      }
      if (exec.qualityScore !== null && exec.qualityScore !== undefined) {
        data.quality.push(exec.qualityScore)
      }
      if (exec.executionTime) {
        data.executionTimes.push(exec.executionTime)
      }
    }

    return Array.from(agentMap.values()).map((data) => ({
      agentId: data.agentId,
      agentName: data.agentName,
      executions: data.total,
      averageQuality:
        data.quality.length > 0
          ? data.quality.reduce((a, b) => a + b, 0) / data.quality.length
          : 0,
      averageTime:
        data.executionTimes.length > 0
          ? data.executionTimes.reduce((a, b) => a + b, 0) / data.executionTimes.length
          : 0,
      successRate: data.total > 0 ? data.completed / data.total : 0,
    }))
  }
}

/**
 * Singleton instance
 */
let analyticsInstance: AuditAnalyticsService | null = null

export function getAnalytics(): AuditAnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AuditAnalyticsService()
  }
  return analyticsInstance
}
