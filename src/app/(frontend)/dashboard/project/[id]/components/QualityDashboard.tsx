'use client'

/**
 * Quality Dashboard Component
 * Phase 7: Production Polish
 */

import { useState } from 'react'
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

const MOCK_METRICS: DepartmentMetrics[] = [
  {
    id: 'story',
    name: 'Story',
    score: 92,
    trend: 'up',
    alerts: 0,
    lastUpdated: new Date(),
  },
  {
    id: 'character',
    name: 'Character',
    score: 88,
    trend: 'stable',
    alerts: 1,
    lastUpdated: new Date(),
  },
  {
    id: 'visual',
    name: 'Visual',
    score: 95,
    trend: 'up',
    alerts: 0,
    lastUpdated: new Date(),
  },
  {
    id: 'video',
    name: 'Video',
    score: 85,
    trend: 'down',
    alerts: 2,
    lastUpdated: new Date(),
  },
  {
    id: 'audio',
    name: 'Audio',
    score: 90,
    trend: 'stable',
    alerts: 0,
    lastUpdated: new Date(),
  },
  {
    id: 'image-quality',
    name: 'Image Quality',
    score: 93,
    trend: 'up',
    alerts: 0,
    lastUpdated: new Date(),
  },
  {
    id: 'production',
    name: 'Production',
    score: 87,
    trend: 'stable',
    alerts: 1,
    lastUpdated: new Date(),
  },
]

export default function QualityDashboard({ projectId }: QualityDashboardProps) {
  const [metrics] = useState<DepartmentMetrics[]>(MOCK_METRICS)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

  const overallScore = Math.round(
    metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length,
  )

  const totalAlerts = metrics.reduce((sum, m) => sum + m.alerts, 0)

  const handleExportReport = () => {
    // TODO: Implement export functionality
    console.log('Exporting quality report...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quality Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time quality metrics across departments</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-90">Overall Project Quality</div>
            <div className="text-5xl font-bold mt-2">{overallScore}</div>
            <div className="text-sm opacity-90 mt-1">out of 100</div>
          </div>
          <div className="text-right">
            {totalAlerts > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-3xl font-bold">{totalAlerts}</div>
                <div className="text-sm opacity-90">Active Alerts</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <QualityMetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Alerts Section */}
      {totalAlerts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Active Quality Alerts</h3>
              <p className="text-sm text-yellow-800 mt-1">
                {totalAlerts} {totalAlerts === 1 ? 'issue' : 'issues'} requiring attention across
                departments
              </p>
              <div className="mt-3 space-y-2">
                {metrics
                  .filter((m) => m.alerts > 0)
                  .map((m) => (
                    <div key={m.id} className="text-sm text-yellow-900">
                      <span className="font-medium">{m.name}:</span> {m.alerts}{' '}
                      {m.alerts === 1 ? 'alert' : 'alerts'}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Trends Placeholder */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quality Trends</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 border border-dashed border-gray-300 rounded">
          Chart visualization will be added here (Recharts integration)
        </div>
      </div>
    </div>
  )
}
