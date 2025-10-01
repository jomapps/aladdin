/**
 * Audit Trail Export System
 * Export executions in JSON, CSV, and PDF formats
 */

import { getAuditQuery } from './query'
import type {
  ExportOptions,
  ExportResult,
  AuditExecution,
  PDFReportData,
  DepartmentMetrics,
  AgentMetrics,
  TimelineEntry,
  QualityTrend,
} from './types'
import { getAnalytics } from './analytics'

/**
 * Main Export Class
 */
export class AuditExportService {
  /**
   * Export audit trail in specified format
   */
  async export(options: ExportOptions): Promise<ExportResult> {
    const query = getAuditQuery()

    // Query executions with filters
    const result = await query.query(options.filters, {
      limit: 10000, // Max export size
      includeEvents: options.includeEvents ?? false,
      includeToolCalls: options.includeToolCalls ?? true,
      includeRelations: true,
    })

    switch (options.format) {
      case 'json':
        return await this.exportJSON(result.executions)
      case 'csv':
        return await this.exportCSV(result.executions)
      case 'pdf':
        return await this.exportPDF(result.executions, options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  /**
   * Export as JSON
   */
  private async exportJSON(executions: AuditExecution[]): Promise<ExportResult> {
    const content = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalExecutions: executions.length,
        executions,
      },
      null,
      2
    )

    return {
      content,
      filename: `audit-trail-${Date.now()}.json`,
      mimeType: 'application/json',
      size: Buffer.byteLength(content, 'utf8'),
    }
  }

  /**
   * Export as CSV
   */
  private async exportCSV(executions: AuditExecution[]): Promise<ExportResult> {
    const headers = [
      'Execution ID',
      'Agent Name',
      'Department',
      'Status',
      'Quality Score',
      'Started At',
      'Completed At',
      'Execution Time (ms)',
      'Input Tokens',
      'Output Tokens',
      'Total Tokens',
      'Estimated Cost ($)',
      'Review Status',
      'Reviewed By',
      'Error Message',
      'Retry Count',
    ]

    const rows = executions.map((exec) => [
      this.escapeCsv(exec.executionId),
      this.escapeCsv(exec.agent.name),
      this.escapeCsv(exec.department.name),
      this.escapeCsv(exec.status),
      exec.qualityScore?.toFixed(2) || '',
      exec.startedAt.toISOString(),
      exec.completedAt?.toISOString() || '',
      exec.executionTime?.toString() || '',
      exec.tokenUsage?.inputTokens?.toString() || '',
      exec.tokenUsage?.outputTokens?.toString() || '',
      exec.tokenUsage?.totalTokens?.toString() || '',
      exec.tokenUsage?.estimatedCost?.toFixed(4) || '',
      this.escapeCsv(exec.reviewStatus),
      this.escapeCsv(exec.reviewedBy?.name || ''),
      this.escapeCsv(exec.error?.message || ''),
      exec.retryCount.toString(),
    ])

    const csvContent =
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n') + '\n'

    return {
      content: csvContent,
      filename: `audit-trail-${Date.now()}.csv`,
      mimeType: 'text/csv',
      size: Buffer.byteLength(csvContent, 'utf8'),
    }
  }

  /**
   * Export as PDF Report
   */
  private async exportPDF(
    executions: AuditExecution[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const reportData = await this.preparePDFData(executions, options)
    const pdfContent = await this.generatePDF(reportData)

    return {
      content: pdfContent,
      filename: `audit-report-${Date.now()}.pdf`,
      mimeType: 'application/pdf',
      size: Buffer.byteLength(pdfContent, 'base64'),
    }
  }

  /**
   * Prepare data for PDF report
   */
  private async preparePDFData(
    executions: AuditExecution[],
    options: ExportOptions
  ): Promise<PDFReportData> {
    const filters = options.filters

    // Executive Summary
    const completedExecutions = executions.filter((e) => e.status === 'completed')
    const totalQuality =
      completedExecutions.reduce((sum, e) => sum + (e.qualityScore || 0), 0) /
      (completedExecutions.length || 1)
    const totalCost = executions.reduce(
      (sum, e) => sum + (e.tokenUsage?.estimatedCost || 0),
      0
    )

    // Department Breakdown
    const departmentMap = new Map<string, AuditExecution[]>()
    for (const exec of executions) {
      const deptId = exec.department.id
      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, [])
      }
      departmentMap.get(deptId)!.push(exec)
    }

    const departmentBreakdown: DepartmentMetrics[] = Array.from(
      departmentMap.entries()
    ).map(([deptId, deptExecs]) => {
      const completed = deptExecs.filter((e) => e.status === 'completed')
      const avgQuality =
        completed.reduce((sum, e) => sum + (e.qualityScore || 0), 0) /
        (completed.length || 1)
      const avgTime =
        deptExecs.reduce((sum, e) => sum + (e.executionTime || 0), 0) /
        (deptExecs.length || 1)
      const totalTokens = deptExecs.reduce(
        (sum, e) => sum + (e.tokenUsage?.totalTokens || 0),
        0
      )
      const estimatedCost = deptExecs.reduce(
        (sum, e) => sum + (e.tokenUsage?.estimatedCost || 0),
        0
      )

      return {
        departmentId: deptId,
        departmentName: deptExecs[0].department.name,
        totalExecutions: deptExecs.length,
        averageQuality: avgQuality,
        averageExecutionTime: avgTime,
        successRate: completed.length / deptExecs.length,
        totalTokens,
        estimatedCost,
      }
    })

    // Agent Performance
    const agentMap = new Map<string, AuditExecution[]>()
    for (const exec of executions) {
      const agentId = exec.agent.id
      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, [])
      }
      agentMap.get(agentId)!.push(exec)
    }

    const agentPerformance: AgentMetrics[] = Array.from(agentMap.entries())
      .map(([agentId, agentExecs]) => {
        const completed = agentExecs.filter((e) => e.status === 'completed')
        const reviewed = agentExecs.filter((e) => e.reviewStatus === 'approved')

        return {
          agentId,
          agentName: agentExecs[0].agent.name,
          isDepartmentHead: agentExecs[0].agent.isDepartmentHead,
          departmentName: agentExecs[0].department.name,
          totalExecutions: agentExecs.length,
          averageQuality:
            completed.reduce((sum, e) => sum + (e.qualityScore || 0), 0) /
            (completed.length || 1),
          averageExecutionTime:
            agentExecs.reduce((sum, e) => sum + (e.executionTime || 0), 0) /
            (agentExecs.length || 1),
          successRate: completed.length / agentExecs.length,
          totalTokens: agentExecs.reduce(
            (sum, e) => sum + (e.tokenUsage?.totalTokens || 0),
            0
          ),
          reviewApprovalRate:
            reviewed.length /
            (agentExecs.filter((e) => e.reviewStatus !== 'pending').length || 1),
        }
      })
      .sort((a, b) => b.averageQuality - a.averageQuality)

    // Timeline
    const timeline: TimelineEntry[] = executions
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
      .slice(0, 50) // Top 50 most recent
      .map((exec) => ({
        timestamp: exec.startedAt,
        executionId: exec.executionId,
        agentName: exec.agent.name,
        departmentName: exec.department.name,
        status: exec.status,
        qualityScore: exec.qualityScore,
        executionTime: exec.executionTime,
      }))

    // Quality Trends (if analytics available)
    const qualityTrends: QualityTrend[] = []
    if (filters.projectId) {
      try {
        const analytics = getAnalytics()
        const analyticsResult = await analytics.analyze({
          projectId: filters.projectId,
          timeframe: '30d',
        })
        qualityTrends.push(...analyticsResult.metrics.quality.trends)
      } catch (error) {
        console.warn('Failed to load quality trends for PDF:', error)
      }
    }

    // Recommendations
    const recommendations = this.generateRecommendations(
      executions,
      departmentBreakdown,
      agentPerformance
    )

    // Timeframe calculation
    let timeframe = 'All time'
    if (filters.dateRange) {
      const days = Math.ceil(
        (filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      timeframe = `${days} days`
    }

    return {
      title: options.pdfOptions?.title || 'Audit Trail Report',
      generatedAt: new Date(),
      filters,
      executiveSummary: {
        totalExecutions: executions.length,
        timeframe,
        successRate: completedExecutions.length / (executions.length || 1),
        averageQuality: totalQuality,
        totalCost,
      },
      departmentBreakdown,
      agentPerformance,
      timeline,
      qualityTrends,
      recommendations,
    }
  }

  /**
   * Generate PDF content (HTML-based, needs puppeteer or similar)
   */
  private async generatePDF(data: PDFReportData): Promise<string> {
    // Generate HTML report
    const html = this.generateHTMLReport(data)

    // In production, use puppeteer or a PDF generation service
    // For now, return HTML as base64 (can be converted to PDF client-side)
    return Buffer.from(html).toString('base64')
  }

  /**
   * Generate HTML report for PDF
   */
  private generateHTMLReport(data: PDFReportData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
    h3 { color: #1e3a8a; }
    .summary { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-label { font-size: 12px; color: #666; }
    .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #2563eb; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background: #f9fafb; }
    .recommendation { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 10px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  <p><strong>Generated:</strong> ${data.generatedAt.toLocaleString()}</p>

  <div class="summary">
    <h2>Executive Summary</h2>
    <div class="metric">
      <div class="metric-label">Total Executions</div>
      <div class="metric-value">${data.executiveSummary.totalExecutions}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Timeframe</div>
      <div class="metric-value">${data.executiveSummary.timeframe}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Success Rate</div>
      <div class="metric-value">${(data.executiveSummary.successRate * 100).toFixed(1)}%</div>
    </div>
    <div class="metric">
      <div class="metric-label">Average Quality</div>
      <div class="metric-value">${data.executiveSummary.averageQuality.toFixed(1)}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Total Cost</div>
      <div class="metric-value">$${data.executiveSummary.totalCost.toFixed(2)}</div>
    </div>
  </div>

  <h2>Department Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Department</th>
        <th>Executions</th>
        <th>Avg Quality</th>
        <th>Success Rate</th>
        <th>Avg Time (ms)</th>
        <th>Total Tokens</th>
        <th>Cost</th>
      </tr>
    </thead>
    <tbody>
      ${data.departmentBreakdown
        .map(
          (dept) => `
        <tr>
          <td><strong>${dept.departmentName}</strong></td>
          <td>${dept.totalExecutions}</td>
          <td>${dept.averageQuality.toFixed(1)}</td>
          <td>${(dept.successRate * 100).toFixed(1)}%</td>
          <td>${Math.round(dept.averageExecutionTime)}</td>
          <td>${dept.totalTokens.toLocaleString()}</td>
          <td>$${dept.estimatedCost.toFixed(2)}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>Agent Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Agent</th>
        <th>Department</th>
        <th>Executions</th>
        <th>Avg Quality</th>
        <th>Success Rate</th>
        <th>Approval Rate</th>
      </tr>
    </thead>
    <tbody>
      ${data.agentPerformance
        .slice(0, 20)
        .map(
          (agent) => `
        <tr>
          <td><strong>${agent.agentName}</strong>${agent.isDepartmentHead ? ' 👑' : ''}</td>
          <td>${agent.departmentName}</td>
          <td>${agent.totalExecutions}</td>
          <td>${agent.averageQuality.toFixed(1)}</td>
          <td>${(agent.successRate * 100).toFixed(1)}%</td>
          <td>${agent.reviewApprovalRate ? (agent.reviewApprovalRate * 100).toFixed(1) + '%' : 'N/A'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>Recommendations</h2>
  ${data.recommendations
    .map(
      (rec) => `
    <div class="recommendation">
      ${rec}
    </div>
  `
    )
    .join('')}

  <div class="footer">
    <p>Aladdin AI Platform - Audit Trail Report</p>
    <p>This report contains confidential information about agent executions and performance metrics.</p>
  </div>
</body>
</html>
    `
  }

  /**
   * Generate recommendations based on data
   */
  private generateRecommendations(
    executions: AuditExecution[],
    departments: DepartmentMetrics[],
    agents: AgentMetrics[]
  ): string[] {
    const recommendations: string[] = []

    // Overall success rate
    const successRate =
      executions.filter((e) => e.status === 'completed').length / executions.length
    if (successRate < 0.8) {
      recommendations.push(
        `⚠️ Overall success rate is ${(successRate * 100).toFixed(1)}%. Consider investigating failed executions and implementing retry mechanisms.`
      )
    }

    // Quality scores
    const avgQuality =
      executions.reduce((sum, e) => sum + (e.qualityScore || 0), 0) / executions.length
    if (avgQuality < 70) {
      recommendations.push(
        `⚠️ Average quality score is ${avgQuality.toFixed(1)}. Review agent prompts and consider additional training or refinement.`
      )
    }

    // Department performance
    const lowPerformingDepts = departments.filter((d) => d.averageQuality < 70)
    if (lowPerformingDepts.length > 0) {
      recommendations.push(
        `⚠️ The following departments have below-threshold quality: ${lowPerformingDepts.map((d) => d.departmentName).join(', ')}. Focus improvement efforts here.`
      )
    }

    // High token usage
    const totalTokens = executions.reduce(
      (sum, e) => sum + (e.tokenUsage?.totalTokens || 0),
      0
    )
    if (totalTokens > 1000000) {
      recommendations.push(
        `💡 High token usage detected (${totalTokens.toLocaleString()} total). Consider implementing caching or prompt optimization to reduce costs.`
      )
    }

    // Agent-specific
    const lowPerformingAgents = agents.filter((a) => a.averageQuality < 70)
    if (lowPerformingAgents.length > 0) {
      recommendations.push(
        `⚠️ ${lowPerformingAgents.length} agent(s) have below-threshold performance. Review their instructions and consider retraining.`
      )
    }

    // Positive feedback
    if (successRate >= 0.95 && avgQuality >= 85) {
      recommendations.push(
        `✅ Excellent performance! Success rate and quality scores are both high. Continue current practices.`
      )
    }

    return recommendations
  }

  /**
   * Escape CSV field
   */
  private escapeCsv(value: string): string {
    if (!value) return ''
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }
}

/**
 * Singleton instance
 */
let exportServiceInstance: AuditExportService | null = null

export function getExportService(): AuditExportService {
  if (!exportServiceInstance) {
    exportServiceInstance = new AuditExportService()
  }
  return exportServiceInstance
}
