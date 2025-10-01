/**
 * Performance Metrics Collector
 * Phase 7: Production Polish
 */

interface MetricData {
  value: number
  timestamp: Date
  tags?: Record<string, string>
}

interface AggregatedMetric {
  count: number
  sum: number
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  p99: number
}

export class MetricsCollector {
  private metrics: Map<string, MetricData[]>
  private maxDataPoints: number

  constructor(maxDataPoints: number = 1000) {
    this.metrics = new Map()
    this.maxDataPoints = maxDataPoints
  }

  /**
   * Record a metric value
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    const data: MetricData = {
      value,
      timestamp: new Date(),
      tags,
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const dataPoints = this.metrics.get(name)!
    dataPoints.push(data)

    // Keep only recent data points
    if (dataPoints.length > this.maxDataPoints) {
      dataPoints.shift()
    }
  }

  /**
   * Track API response time
   */
  trackApiResponse(endpoint: string, durationMs: number, statusCode: number): void {
    this.record('api.response_time', durationMs, {
      endpoint,
      status: statusCode.toString(),
    })

    if (statusCode >= 400) {
      this.record('api.errors', 1, {
        endpoint,
        status: statusCode.toString(),
      })
    }
  }

  /**
   * Track agent execution time
   */
  trackAgentExecution(
    departmentId: string,
    agentType: string,
    durationMs: number,
    success: boolean,
  ): void {
    this.record('agent.execution_time', durationMs, {
      department: departmentId,
      agent: agentType,
      success: success.toString(),
    })

    if (!success) {
      this.record('agent.failures', 1, {
        department: departmentId,
        agent: agentType,
      })
    }
  }

  /**
   * Track cache hit/miss
   */
  trackCacheAccess(operation: 'hit' | 'miss', layer: 'l1' | 'l2' | 'l3', key?: string): void {
    this.record(`cache.${operation}`, 1, {
      layer,
      key: key || 'unknown',
    })
  }

  /**
   * Track database query time
   */
  trackDatabaseQuery(collection: string, operation: string, durationMs: number): void {
    this.record('db.query_time', durationMs, {
      collection,
      operation,
    })
  }

  /**
   * Get aggregated metrics for a name
   */
  getAggregated(name: string, since?: Date): AggregatedMetric | null {
    const dataPoints = this.metrics.get(name)
    if (!dataPoints || dataPoints.length === 0) return null

    let filtered = dataPoints
    if (since) {
      filtered = dataPoints.filter((d) => d.timestamp >= since)
    }

    if (filtered.length === 0) return null

    const values = filtered.map((d) => d.value).sort((a, b) => a - b)
    const sum = values.reduce((acc, v) => acc + v, 0)

    return {
      count: values.length,
      sum,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      p50: this.percentile(values, 0.5),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99),
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    const index = Math.ceil(sortedValues.length * p) - 1
    return sortedValues[Math.max(0, index)]
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys())
  }

  /**
   * Get raw data for a metric
   */
  getRawData(name: string, limit?: number): MetricData[] {
    const data = this.metrics.get(name) || []
    if (limit) {
      return data.slice(-limit)
    }
    return [...data]
  }

  /**
   * Calculate cache hit rate
   */
  getCacheHitRate(layer?: 'l1' | 'l2' | 'l3'): number {
    const hits = this.metrics.get('cache.hit') || []
    const misses = this.metrics.get('cache.miss') || []

    let filteredHits = hits
    let filteredMisses = misses

    if (layer) {
      filteredHits = hits.filter((d) => d.tags?.layer === layer)
      filteredMisses = misses.filter((d) => d.tags?.layer === layer)
    }

    const totalHits = filteredHits.length
    const totalMisses = filteredMisses.length
    const total = totalHits + totalMisses

    if (total === 0) return 0

    return (totalHits / total) * 100
  }

  /**
   * Get error rate
   */
  getErrorRate(since?: Date): number {
    const apiResponses = this.metrics.get('api.response_time') || []
    const apiErrors = this.metrics.get('api.errors') || []

    let filtered = apiResponses
    let filteredErrors = apiErrors

    if (since) {
      filtered = apiResponses.filter((d) => d.timestamp >= since)
      filteredErrors = apiErrors.filter((d) => d.timestamp >= since)
    }

    if (filtered.length === 0) return 0

    return (filteredErrors.length / filtered.length) * 100
  }

  /**
   * Export metrics as JSON
   */
  export(): Record<string, any> {
    const exported: Record<string, any> = {}

    for (const [name, dataPoints] of this.metrics) {
      const aggregated = this.getAggregated(name)
      exported[name] = {
        aggregated,
        recentValues: dataPoints.slice(-10).map((d) => ({
          value: d.value,
          timestamp: d.timestamp,
          tags: d.tags,
        })),
      }
    }

    return exported
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
  }

  /**
   * Get summary report
   */
  getSummary(since?: Date): {
    api: { avgResponseTime: number; errorRate: number }
    cache: { l1HitRate: number; l2HitRate: number; overallHitRate: number }
    agents: { avgExecutionTime: number; failureRate: number }
  } {
    const apiMetric = this.getAggregated('api.response_time', since)
    const agentMetric = this.getAggregated('agent.execution_time', since)

    const agentFailures = this.metrics.get('agent.failures') || []
    const agentExecutions = this.metrics.get('agent.execution_time') || []

    return {
      api: {
        avgResponseTime: apiMetric?.avg || 0,
        errorRate: this.getErrorRate(since),
      },
      cache: {
        l1HitRate: this.getCacheHitRate('l1'),
        l2HitRate: this.getCacheHitRate('l2'),
        overallHitRate: this.getCacheHitRate(),
      },
      agents: {
        avgExecutionTime: agentMetric?.avg || 0,
        failureRate:
          agentExecutions.length > 0 ? (agentFailures.length / agentExecutions.length) * 100 : 0,
      },
    }
  }
}

// Singleton instance
let metricsInstance: MetricsCollector | null = null

export function getMetrics(): MetricsCollector {
  if (!metricsInstance) {
    metricsInstance = new MetricsCollector()
  }
  return metricsInstance
}

/**
 * Middleware helper for tracking API metrics
 */
export function createMetricsMiddleware() {
  return async (req: any, res: any, next: any) => {
    const start = Date.now()
    const metrics = getMetrics()

    // Track response
    res.on('finish', () => {
      const duration = Date.now() - start
      const endpoint = req.route?.path || req.url
      metrics.trackApiResponse(endpoint, duration, res.statusCode)
    })

    next()
  }
}
