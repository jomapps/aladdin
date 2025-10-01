/**
 * Audit Trail System Types
 * Complete TypeScript definitions for audit querying, export, and analytics
 */

// ========== QUERY TYPES ==========

export interface AuditQueryFilters {
  projectId?: string
  episodeId?: string
  conversationId?: string
  departmentId?: string
  agentId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout'
  minQualityScore?: number
  maxQualityScore?: number
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'revision-needed'
  tags?: string[]
  hasErrors?: boolean
  minExecutionTime?: number
  maxExecutionTime?: number
}

export interface AuditQueryOptions {
  limit?: number
  offset?: number
  sortBy?: 'startedAt' | 'completedAt' | 'qualityScore' | 'executionTime' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  includeEvents?: boolean
  includeToolCalls?: boolean
  includeRelations?: boolean
}

export interface AuditQueryResult {
  executions: AuditExecution[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  summary: AuditSummary
}

export interface AuditExecution {
  id: string
  executionId: string
  agent: {
    id: string
    agentId: string
    name: string
    isDepartmentHead: boolean
  }
  department: {
    id: string
    slug: string
    name: string
    icon: string
  }
  project: {
    id: string
    name: string
  }
  episode?: {
    id: string
    name: string
  }
  conversationId?: string
  prompt: string
  params?: any
  output?: any
  outputText?: string
  status: string
  startedAt: Date
  completedAt?: Date
  executionTime?: number
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost: number
  }
  qualityScore?: number
  qualityBreakdown?: {
    accuracy?: number
    completeness?: number
    coherence?: number
    creativity?: number
  }
  reviewStatus: string
  reviewedBy?: {
    id: string
    name: string
  }
  reviewNotes?: string
  reviewedAt?: Date
  error?: {
    message?: string
    code?: string
    stack?: string
  }
  retryCount: number
  events?: any[]
  toolCalls?: ToolCall[]
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ToolCall {
  toolName: string
  input?: any
  output?: any
  executionTime?: number
  success: boolean
  error?: string
}

export interface AuditSummary {
  totalExecutions: number
  statusBreakdown: Record<string, number>
  averageQualityScore: number
  averageExecutionTime: number
  totalTokensUsed: number
  totalEstimatedCost: number
  successRate: number
  reviewStatusBreakdown: Record<string, number>
}

// ========== EXPORT TYPES ==========

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf'
  filters: AuditQueryFilters
  includeEvents?: boolean
  includeToolCalls?: boolean
  pdfOptions?: {
    title?: string
    includeCharts?: boolean
    includeTimeline?: boolean
    includeRecommendations?: boolean
  }
}

export interface ExportResult {
  downloadUrl?: string
  content?: string
  filename: string
  mimeType: string
  size: number
  expiresAt?: Date
}

export interface PDFReportData {
  title: string
  generatedAt: Date
  filters: AuditQueryFilters
  executiveSummary: {
    totalExecutions: number
    timeframe: string
    successRate: number
    averageQuality: number
    totalCost: number
  }
  departmentBreakdown: DepartmentMetrics[]
  agentPerformance: AgentMetrics[]
  timeline: TimelineEntry[]
  qualityTrends: QualityTrend[]
  recommendations: string[]
}

// ========== ANALYTICS TYPES ==========

export interface AnalyticsFilters {
  projectId?: string
  departmentId?: string
  agentId?: string
  timeframe: '24h' | '7d' | '30d' | '90d' | 'all'
  groupBy?: 'hour' | 'day' | 'week' | 'month'
}

export interface AnalyticsResult {
  metrics: AnalyticsMetrics
  charts: AnalyticsCharts
  insights: AnalyticsInsight[]
  recommendations: string[]
}

export interface AnalyticsMetrics {
  executions: {
    total: number
    byStatus: Record<string, number>
    byDepartment: Record<string, number>
    byAgent: Record<string, number>
  }
  quality: {
    average: number
    median: number
    distribution: QualityDistribution
    byDepartment: Record<string, number>
    byAgent: Record<string, number>
    trends: QualityTrend[]
  }
  performance: {
    averageExecutionTime: number
    medianExecutionTime: number
    p95ExecutionTime: number
    p99ExecutionTime: number
    byDepartment: Record<string, number>
    byAgent: Record<string, number>
  }
  tokens: {
    totalUsed: number
    averagePerExecution: number
    byDepartment: Record<string, number>
    byAgent: Record<string, number>
    estimatedTotalCost: number
  }
  errors: {
    total: number
    rate: number
    byType: Record<string, number>
    byAgent: Record<string, number>
    commonPatterns: ErrorPattern[]
  }
  reviews: {
    byStatus: Record<string, number>
    approvalRate: number
    averageReviewTime: number
  }
}

export interface AnalyticsCharts {
  executionsOverTime: TimeSeriesData[]
  qualityScoreDistribution: DistributionData[]
  executionTimeDistribution: DistributionData[]
  departmentComparison: ComparisonData[]
  agentPerformance: PerformanceData[]
  tokenUsageOverTime: TimeSeriesData[]
  errorRateOverTime: TimeSeriesData[]
}

export interface TimeSeriesData {
  timestamp: Date
  value: number
  label?: string
  metadata?: any
}

export interface DistributionData {
  bucket: string
  count: number
  percentage: number
}

export interface ComparisonData {
  label: string
  value: number
  metadata?: any
}

export interface PerformanceData {
  agentId: string
  agentName: string
  executions: number
  averageQuality: number
  averageTime: number
  successRate: number
}

export interface QualityDistribution {
  excellent: number // 90-100
  good: number // 80-89
  fair: number // 70-79
  poor: number // 60-69
  failing: number // <60
}

export interface QualityTrend {
  period: string
  averageScore: number
  count: number
}

export interface DepartmentMetrics {
  departmentId: string
  departmentName: string
  totalExecutions: number
  averageQuality: number
  averageExecutionTime: number
  successRate: number
  totalTokens: number
  estimatedCost: number
}

export interface AgentMetrics {
  agentId: string
  agentName: string
  isDepartmentHead: boolean
  departmentName: string
  totalExecutions: number
  averageQuality: number
  averageExecutionTime: number
  successRate: number
  totalTokens: number
  reviewApprovalRate?: number
}

export interface TimelineEntry {
  timestamp: Date
  executionId: string
  agentName: string
  departmentName: string
  status: string
  qualityScore?: number
  executionTime?: number
}

export interface ErrorPattern {
  pattern: string
  count: number
  percentage: number
  affectedAgents: string[]
  lastOccurrence: Date
}

export interface AnalyticsInsight {
  type: 'success' | 'warning' | 'error' | 'info'
  category: 'performance' | 'quality' | 'cost' | 'reliability'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  recommendation?: string
  data?: any
}

// ========== CACHE TYPES ==========

export interface CacheOptions {
  ttl: number // Time to live in seconds
  key: string
  enabled: boolean
}

export interface CachedResult<T> {
  data: T
  cachedAt: Date
  expiresAt: Date
  cacheKey: string
}
