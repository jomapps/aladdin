'use client'

/**
 * QualityMetrics Component
 *
 * Visualizes quality assessment scores with progress bars and radial chart.
 * Shows overall quality score and breakdown by dimension.
 */

import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QualityMetricsProps {
  score?: number
  breakdown?: {
    accuracy?: number
    completeness?: number
    coherence?: number
    creativity?: number
  }
  threshold?: number
  className?: string
}

export function QualityMetrics({ score, breakdown, threshold = 80, className }: QualityMetricsProps) {
  if (score === undefined && !breakdown) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8 text-center border rounded-lg bg-gray-50',
          className
        )}
      >
        <div>
          <Sparkles className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">Quality metrics not available yet</p>
        </div>
      </div>
    )
  }

  const overallScore = score ?? 0
  const passed = overallScore >= threshold

  return (
    <div className={cn('border rounded-lg bg-white p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Quality Assessment</h3>
        </div>
        {score !== undefined && (
          <div className="flex items-center gap-2">
            {passed ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Passed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Below Threshold</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overall Score */}
      {score !== undefined && (
        <div className="mb-6">
          <div className="flex items-end justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Quality</span>
            <span className="text-3xl font-bold text-gray-900">{overallScore.toFixed(0)}%</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                overallScore >= threshold ? 'bg-green-500' : 'bg-yellow-500'
              )}
              style={{ width: `${Math.min(overallScore, 100)}%` }}
            />
            {/* Threshold marker */}
            <div
              className="absolute inset-y-0 w-0.5 bg-gray-400"
              style={{ left: `${threshold}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">0%</span>
            <span className="text-xs text-gray-600 font-medium">Threshold: {threshold}%</span>
            <span className="text-xs text-gray-500">100%</span>
          </div>
        </div>
      )}

      {/* Breakdown */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Breakdown</h4>
          <div className="space-y-3">
            {Object.entries(breakdown).map(([key, value]) => {
              if (value === undefined) return null

              const label = key.charAt(0).toUpperCase() + key.slice(1)
              const percentage = value
              const color = getColorForScore(percentage)

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', color)}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>&lt; 60%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>60-79%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>≥ 80%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function getColorForScore(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}
