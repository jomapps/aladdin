/**
 * Audit Trail System - Main Export
 *
 * Complete audit trail system for Aladdin Dynamic Agents
 * Provides querying, export, and analytics capabilities
 *
 * @see {@link /docs/idea/dynamic-agents.md} Section 6: Audit Trail System
 */

export { getAuditQuery, AuditTrailQuery } from './query'
export { getExportService, AuditExportService } from './export'
export { getAnalytics, AuditAnalyticsService } from './analytics'

export type {
  // Query Types
  AuditQueryFilters,
  AuditQueryOptions,
  AuditQueryResult,
  AuditExecution,
  AuditSummary,
  ToolCall,

  // Export Types
  ExportOptions,
  ExportResult,
  PDFReportData,

  // Analytics Types
  AnalyticsFilters,
  AnalyticsResult,
  AnalyticsMetrics,
  AnalyticsCharts,
  AnalyticsInsight,
  QualityDistribution,
  QualityTrend,
  DepartmentMetrics,
  AgentMetrics,
  TimelineEntry,
  ErrorPattern,
  TimeSeriesData,
  DistributionData,
  ComparisonData,
  PerformanceData,

  // Cache Types
  CacheOptions,
  CachedResult,
} from './types'
