'use client'

/**
 * Quality Dashboard Component
 * Phase 7: Production Polish
 */

import { useState, useEffect } from 'react'
import QualityMetricCard from './QualityMetricCard'

interface DepartmentMetrics {
  id: string
  name: string
  score: number
  trend: 'up' | 'down' | 'stable'
  alerts: number
  lastUpdated: Date
}

interface QualityDashboardProps {
  projectId: string
}

// Default departments with 0 values when no data is available
const DEFAULT_DEPARTMENTS: Omit<DepartmentMetrics, 'score' | 'alerts' | 'lastUpdated'>[] = [
  { id: 'story', name: 'Story', trend: 'stable' },
  { id: 'character', name: 'Character', trend: 'stable' },
  { id: 'visual', name: 'Visual', trend: 'stable' },
  { id: 'video', name: 'Video', trend: 'stable' },
  { id: 'audio', name: 'Audio', trend: 'stable' },
  { id: 'production', name: 'Production', trend: 'stable' },
]

async function fetchQualityMetrics(
  projectId: string,
  timeRange: string,
): Promise<DepartmentMetrics[]> {
  try {
    const response = await fetch(
      `/api/v1/projects/${projectId}/quality/metrics?timeRange=${timeRange}`,
    )
    if (!response.ok) {
      throw new Error('Failed to fetch quality metrics')
    }
    const data = await response.json()
    return data.metrics || []
  } catch (error) {
    console.warn('Failed to fetch quality metrics, using defaults:', error)
    // Return default departments with 0 values
    return DEFAULT_DEPARTMENTS.map((dept) => ({
      ...dept,
      score: 0,
      alerts: 0,
      lastUpdated: new Date(),
    }))
  }
}

export default function QualityDashboard({ projectId }: QualityDashboardProps) {
  const [metrics, setMetrics] = useState<DepartmentMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

  // Load metrics on component mount and when timeRange changes
  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true)
      const data = await fetchQualityMetrics(projectId, timeRange)
      setMetrics(data)
      setLoading(false)
    }
    loadMetrics()
  }, [projectId, timeRange])

  const overallScore =
    metrics.length > 0
      ? Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length)
      : 0

  const totalAlerts = metrics.reduce((sum, m) => sum + m.alerts, 0)

  const handleExportReport = () => {
    // TODO: Implement export functionality
    console.log('Exporting quality report...')
  }

  return (
    <div className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_50px_140px_-80px_rgba(56,189,248,0.75)] sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 text-slate-100 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Quality Dashboard</h2>
          <p className="mt-1 text-sm text-slate-300">
            Real-time quality metrics across departments, tuned for cinematic delivery.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 backdrop-blur transition hover:border-white/30"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={handleExportReport}
            className="rounded-xl bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_-30px_rgba(99,102,241,0.8)] transition hover:brightness-110"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Overall Score */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/30 via-indigo-600/30 to-purple-600/30 p-8 text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.35),transparent_55%)]" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-200">
              Overall Project Quality
            </div>
            <div className="mt-4 text-5xl font-black tracking-tight">{overallScore}</div>
            <div className="text-sm text-slate-200/80">Score out of 100</div>
          </div>
          {totalAlerts > 0 && (
            <div className="flex flex-col items-end gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-right shadow-[0_20px_80px_-60px_rgba(248,113,113,0.8)]">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-200">
                Active Alerts
              </span>
              <span className="text-4xl font-black text-rose-100">{totalAlerts}</span>
              <span className="text-xs text-rose-100/70">Departments needing attention</span>
            </div>
          )}
        </div>
      </div>

      {/* Department Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? DEFAULT_DEPARTMENTS.map((dept) => (
              <div
                key={dept.id}
                className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))
          : metrics.map((metric) => <QualityMetricCard key={metric.id} metric={metric} />)}
      </div>

      {/* Alerts Section */}
      {totalAlerts > 0 && (
        <div className="rounded-3xl border border-amber-200/30 bg-amber-500/10 p-6 text-amber-100">
          <div className="flex items-start gap-4">
            <div className="mt-1 text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Active Quality Alerts</h3>
              <p className="mt-1 text-sm text-amber-100/90">
                {totalAlerts} {totalAlerts === 1 ? 'issue' : 'issues'} require immediate review across
                your departments.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {metrics
                  .filter((m) => m.alerts > 0)
                  .map((m) => (
                    <div key={m.id} className="rounded-2xl border border-amber-200/30 bg-amber-500/15 px-4 py-3 text-sm">
                      <span className="font-semibold">{m.name}</span> — {m.alerts}{' '}
                      {m.alerts === 1 ? 'alert' : 'alerts'} open
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Trends Placeholder */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
        <h3 className="text-lg font-semibold">Quality Trends</h3>
        <div className="mt-4 flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-slate-400">
          Chart visualization coming soon (Recharts integration)
        </div>
      </div>
    </div>
  )
}
