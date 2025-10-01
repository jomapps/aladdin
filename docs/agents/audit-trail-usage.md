# Audit Trail System Usage Guide

Complete guide to using the Aladdin Audit Trail system for querying, exporting, and analyzing agent execution data.

## Table of Contents

1. [Overview](#overview)
2. [Querying Audit Trail](#querying-audit-trail)
3. [Exporting Reports](#exporting-reports)
4. [Analytics and Insights](#analytics-and-insights)
5. [API Reference](#api-reference)
6. [Examples](#examples)

---

## Overview

The Audit Trail system provides comprehensive tracking and analysis of all agent executions in the Aladdin platform. It captures:

- ✅ Complete input/output history
- ✅ Performance metrics (execution time, token usage)
- ✅ Quality scores and breakdowns
- ✅ Review status and feedback
- ✅ Error logs and retry attempts
- ✅ Tool calls and events

**Key Features:**
- Advanced filtering and pagination
- Multiple export formats (JSON, CSV, PDF)
- Real-time analytics and insights
- Caching for performance
- Rate limiting for exports

---

## Querying Audit Trail

### Using the Query Class

```typescript
import { getAuditQuery } from '@/lib/agents/audit'

const query = getAuditQuery()

// Query with filters
const result = await query.query(
  {
    projectId: 'project-123',
    minQualityScore: 80,
    status: 'completed',
    dateRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    }
  },
  {
    limit: 50,
    sortBy: 'qualityScore',
    sortOrder: 'desc',
    includeToolCalls: true
  }
)

console.log(result.executions) // Array of executions
console.log(result.pagination) // Pagination info
console.log(result.summary) // Summary statistics
```

### Available Filters

```typescript
interface AuditQueryFilters {
  projectId?: string              // Filter by project
  episodeId?: string              // Filter by episode
  conversationId?: string         // Filter by conversation
  departmentId?: string           // Filter by department
  agentId?: string                // Filter by specific agent
  dateRange?: {                   // Filter by date range
    start: Date
    end: Date
  }
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  minQualityScore?: number        // Minimum quality score (0-100)
  maxQualityScore?: number        // Maximum quality score (0-100)
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'revision-needed'
  tags?: string[]                 // Filter by tags
  hasErrors?: boolean             // Only executions with errors
  minExecutionTime?: number       // Min execution time (ms)
  maxExecutionTime?: number       // Max execution time (ms)
}
```

### Query Options

```typescript
interface AuditQueryOptions {
  limit?: number                  // Results per page (default: 50, max: 500)
  offset?: number                 // Pagination offset (default: 0)
  sortBy?: 'startedAt' | 'completedAt' | 'qualityScore' | 'executionTime'
  sortOrder?: 'asc' | 'desc'     // Sort direction
  includeEvents?: boolean         // Include event stream
  includeToolCalls?: boolean      // Include tool calls
  includeRelations?: boolean      // Include related entities
}
```

### Get Single Execution

```typescript
const execution = await query.findById('exec-123', {
  includeEvents: true,
  includeToolCalls: true
})
```

### Get Project Timeline

```typescript
const timeline = await query.getTimeline('project-123', {
  limit: 100,
  departmentId: 'dept-story' // Optional
})
```

---

## Exporting Reports

### Using the Export Service

```typescript
import { getExportService } from '@/lib/agents/audit'

const exportService = getExportService()

// Export as JSON
const jsonExport = await exportService.export({
  format: 'json',
  filters: {
    projectId: 'project-123',
    minQualityScore: 70
  },
  includeEvents: false,
  includeToolCalls: true
})

// Export as CSV
const csvExport = await exportService.export({
  format: 'csv',
  filters: {
    projectId: 'project-123',
    dateRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    }
  }
})

// Export as PDF Report
const pdfExport = await exportService.export({
  format: 'pdf',
  filters: {
    projectId: 'project-123'
  },
  pdfOptions: {
    title: 'January 2025 Production Report',
    includeCharts: true,
    includeTimeline: true,
    includeRecommendations: true
  }
})
```

### Export Formats

#### JSON Format
- Complete execution data with nested structures
- Ideal for data processing and archival
- Includes all fields and relationships

#### CSV Format
- Flattened execution summary
- Easy to import into spreadsheets
- Contains key metrics and status

#### PDF Format
- Professional report with sections:
  - Executive Summary (totals, success rate, avg quality, cost)
  - Department Performance (executions, quality, success rate)
  - Agent Performance (top performers, metrics)
  - Quality Trends (over time)
  - Recommendations (actionable insights)

---

## Analytics and Insights

### Using the Analytics Service

```typescript
import { getAnalytics } from '@/lib/agents/audit'

const analytics = getAnalytics()

// Analyze with timeframe
const result = await analytics.analyze({
  projectId: 'project-123',
  timeframe: '30d',
  groupBy: 'day'
})

console.log(result.metrics)        // Comprehensive metrics
console.log(result.charts)         // Chart data for visualization
console.log(result.insights)       // AI-generated insights
console.log(result.recommendations) // Actionable recommendations
```

### Analytics Timeframes

- `24h` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days
- `90d` - Last 90 days
- `all` - All time

### Metrics Included

```typescript
interface AnalyticsMetrics {
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
```

### Chart Data

Analytics includes ready-to-use chart data:

- **Executions Over Time** - Time series of execution count
- **Quality Score Distribution** - Histogram of quality scores
- **Execution Time Distribution** - Performance buckets
- **Department Comparison** - Department performance comparison
- **Agent Performance** - Top performing agents
- **Token Usage Over Time** - Token consumption trends
- **Error Rate Over Time** - Error frequency trends

---

## API Reference

### REST Endpoints

#### GET /api/audit

Query audit trail with filters.

**Query Parameters:**
- `projectId` - Filter by project
- `departmentId` - Filter by department
- `agentId` - Filter by agent
- `status` - Filter by status
- `minQualityScore` - Minimum quality score
- `dateStart`, `dateEnd` - Date range (ISO strings)
- `limit` - Results per page (default: 50, max: 500)
- `offset` - Pagination offset
- `sortBy` - Sort field
- `sortOrder` - asc or desc

**Response:**
```json
{
  "success": true,
  "data": {
    "executions": [...],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    },
    "summary": {
      "totalExecutions": 150,
      "averageQualityScore": 82.5,
      "successRate": 0.94,
      "totalTokensUsed": 125000,
      "totalEstimatedCost": 2.45
    }
  }
}
```

#### POST /api/audit/export

Export audit trail in specified format.

**Request Body:**
```json
{
  "format": "pdf",
  "filters": {
    "projectId": "project-123",
    "minQualityScore": 70
  },
  "pdfOptions": {
    "title": "Production Report",
    "includeCharts": true,
    "includeRecommendations": true
  }
}
```

**Response:**
- JSON/CSV: Returns file content with appropriate headers
- PDF: Returns base64-encoded content

**Rate Limit:** 10 exports per minute per IP

#### GET /api/audit/analytics

Get comprehensive analytics.

**Query Parameters:**
- `projectId` - Filter by project (required)
- `timeframe` - 24h, 7d, 30d, 90d, all (default: 30d)
- `groupBy` - hour, day, week, month (default: day)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": { ... },
    "charts": { ... },
    "insights": [...],
    "recommendations": [...]
  },
  "cached": true,
  "cachedAt": 1234567890
}
```

**Cache:** Results cached for 5 minutes

#### POST /api/audit/analytics/refresh

Force refresh analytics cache.

---

## Examples

### Example 1: Monthly Performance Report

```typescript
// Get all executions for January 2025
const result = await query.query({
  projectId: 'movie-production-2025',
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31')
  },
  status: 'completed'
}, {
  limit: 1000,
  sortBy: 'startedAt',
  sortOrder: 'asc'
})

// Export as PDF report
const pdfReport = await exportService.export({
  format: 'pdf',
  filters: {
    projectId: 'movie-production-2025',
    dateRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    }
  },
  pdfOptions: {
    title: 'January 2025 Production Report',
    includeCharts: true,
    includeTimeline: true,
    includeRecommendations: true
  }
})
```

### Example 2: Quality Audit

```typescript
// Find all low-quality executions
const lowQuality = await query.query({
  projectId: 'project-123',
  maxQualityScore: 70,
  reviewStatus: 'rejected'
}, {
  limit: 100,
  sortBy: 'qualityScore',
  sortOrder: 'asc'
})

// Export for review
const csv = await exportService.export({
  format: 'csv',
  filters: {
    projectId: 'project-123',
    maxQualityScore: 70
  }
})
```

### Example 3: Department Performance Analysis

```typescript
// Analyze Story Department
const analytics = await getAnalytics().analyze({
  projectId: 'project-123',
  departmentId: 'dept-story',
  timeframe: '30d',
  groupBy: 'day'
})

console.log('Average Quality:', analytics.metrics.quality.average)
console.log('Success Rate:', analytics.metrics.executions.byStatus['completed'])
console.log('Insights:', analytics.insights)
console.log('Recommendations:', analytics.recommendations)
```

### Example 4: Error Analysis

```typescript
// Find all errors in last 7 days
const errors = await query.query({
  projectId: 'project-123',
  hasErrors: true,
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  }
}, {
  limit: 500,
  includeToolCalls: true
})

// Get error patterns
const analytics = await getAnalytics().analyze({
  projectId: 'project-123',
  timeframe: '7d'
})

console.log('Common Error Patterns:', analytics.metrics.errors.commonPatterns)
```

### Example 5: Cost Tracking

```typescript
// Get token usage for billing period
const result = await query.query({
  projectId: 'project-123',
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31')
  },
  status: 'completed'
})

console.log('Total Tokens:', result.summary.totalTokensUsed)
console.log('Estimated Cost:', result.summary.totalEstimatedCost)

// Export detailed breakdown
const csv = await exportService.export({
  format: 'csv',
  filters: {
    projectId: 'project-123',
    dateRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    }
  }
})
```

---

## Best Practices

### Performance

1. **Use Caching**: Analytics results are cached for 5 minutes
2. **Limit Results**: Use pagination instead of fetching all records
3. **Selective Fields**: Use `includeEvents: false` if not needed
4. **Index Usage**: Filter by indexed fields (projectId, departmentId, agentId)

### Security

1. **Validate Inputs**: Always validate date ranges and scores
2. **Rate Limiting**: Export endpoints are rate-limited
3. **Authorization**: Check user permissions before querying
4. **Sensitive Data**: Be careful with error messages and logs

### Reporting

1. **Regular Exports**: Schedule weekly/monthly PDF reports
2. **Quality Audits**: Monitor quality trends regularly
3. **Cost Tracking**: Track token usage for budgeting
4. **Error Monitoring**: Set up alerts for high error rates

---

## Troubleshooting

### Query Returns Empty Results

- Check filters are not too restrictive
- Verify projectId/departmentId exists
- Check date range is valid
- Ensure executions exist for criteria

### Export Fails

- Verify rate limit not exceeded (10/minute)
- Check filter criteria is valid
- Ensure projectId is provided
- For PDF: Check data size isn't too large

### Analytics Takes Long

- Use shorter timeframes (7d instead of all)
- Filter by department or agent
- Check if cache is working
- Limit data size with filters

### High Memory Usage

- Reduce limit parameter
- Use pagination for large datasets
- Don't include events unless needed
- Export in batches for large reports

---

## Related Documentation

- [Dynamic Agents Architecture](/docs/idea/dynamic-agents.md)
- [Quality Scoring System](/src/lib/brain/qualityScoring.ts)
- [Agent Executions Collection](/src/collections/AgentExecutions.ts)
- [PayloadCMS Query API](https://payloadcms.com/docs/queries/overview)

---

**Version:** 1.0.0
**Last Updated:** January 2025
**Maintainer:** Aladdin Development Team
