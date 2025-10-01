'use client'

/**
 * Quality Metric Card Component
 * Phase 7: Production Polish
 */

interface DepartmentMetrics {
  id: string
  name: string
  score: number
  trend: 'up' | 'down' | 'stable'
  alerts: number
  lastUpdated: Date
}

interface QualityMetricCardProps {
  metric: DepartmentMetrics
}

export default function QualityMetricCard({ metric }: QualityMetricCardProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number): string => {
    if (score >= 90) return 'bg-green-50 border-green-200'
    if (score >= 75) return 'bg-blue-50 border-blue-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up':
        return '📈'
      case 'down':
        return '📉'
      case 'stable':
        return '➡️'
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'stable':
        return 'text-gray-600'
    }
  }

  return (
    <div
      className={`
      bg-white border rounded-lg p-4 hover:shadow-md transition-shadow
      ${metric.alerts > 0 ? 'ring-2 ring-yellow-400' : ''}
    `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{metric.name}</h3>
        {metric.alerts > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
            {metric.alerts} Alert{metric.alerts !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Score */}
      <div className={`${getScoreBgColor(metric.score)} rounded-lg p-3 mb-3 border`}>
        <div className={`text-3xl font-bold ${getScoreColor(metric.score)}`}>{metric.score}</div>
        <div className="text-xs text-gray-600 mt-1">Quality Score</div>
      </div>

      {/* Trend */}
      <div className="flex items-center justify-between text-sm">
        <div className={`flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
          <span>{getTrendIcon(metric.trend)}</span>
          <span className="font-medium capitalize">{metric.trend}</span>
        </div>
        <div className="text-gray-500 text-xs">
          {new Date(metric.lastUpdated).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
