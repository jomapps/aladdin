'use client'

/**
 * Quality Metric Card Component
 * Phase 7: Production Polish
 */

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

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
  const scoreStyles = (score: number) => {
    if (score >= 90) {
      return {
        gradient: 'from-emerald-400/25 to-emerald-500/20',
        text: 'text-emerald-100',
        accent: 'border-emerald-300/40',
      }
    }
    if (score >= 75) {
      return {
        gradient: 'from-sky-400/25 to-indigo-500/20',
        text: 'text-sky-100',
        accent: 'border-sky-300/40',
      }
    }
    if (score >= 60) {
      return {
        gradient: 'from-amber-400/25 to-orange-500/20',
        text: 'text-amber-100',
        accent: 'border-amber-300/40',
      }
    }
    return {
      gradient: 'from-rose-500/25 to-red-500/20',
      text: 'text-rose-100',
      accent: 'border-rose-300/40',
    }
  }

  const trendConfig = {
    up: {
      icon: <ArrowUpRight className="h-4 w-4" />,
      color: 'text-emerald-200',
      badge: 'border-emerald-300/40 bg-emerald-500/15',
      label: 'Improving',
    },
    down: {
      icon: <ArrowDownRight className="h-4 w-4" />,
      color: 'text-rose-200',
      badge: 'border-rose-300/40 bg-rose-500/15',
      label: 'Declining',
    },
    stable: {
      icon: <Minus className="h-4 w-4" />,
      color: 'text-slate-200',
      badge: 'border-slate-300/30 bg-white/10',
      label: 'Stable',
    },
  } as const

  const score = scoreStyles(metric.score)
  const trend = trendConfig[metric.trend]

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-100 transition duration-200 hover:border-white/30 hover:bg-white/10 ${metric.alerts > 0 ? 'ring-1 ring-amber-300/50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-wide">{metric.name}</h3>
        {metric.alerts > 0 && (
          <span className="rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
            {metric.alerts} Alert{metric.alerts !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div
        className={`relative mt-4 overflow-hidden rounded-xl border ${score.accent} bg-gradient-to-br ${score.gradient} px-4 py-5`}
      >
        <div className={`text-4xl font-black ${score.text}`}>{metric.score}</div>
        <div className="mt-1 text-xs uppercase tracking-[0.35em] text-white/70">Quality Score</div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs">
        <div
          className={`inline-flex items-center gap-2 rounded-full border ${trend.badge} px-3 py-1 font-medium uppercase tracking-[0.25em] ${trend.color}`}
        >
          {trend.icon}
          {trend.label}
        </div>
        <div className="text-slate-400">
          {new Date(metric.lastUpdated).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
