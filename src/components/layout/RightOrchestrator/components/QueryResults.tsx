/**
 * QueryResults Component
 * Displays search results from query mode
 */

'use client'

import { QueryResult } from '@/stores/orchestratorStore'
import { FileText, MapPin, Users, Box, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QueryResultsProps {
  results: QueryResult[]
}

const entityIcons = {
  character: Users,
  scene: FileText,
  location: MapPin,
  prop: Box,
  other: Circle,
}

const entityColors = {
  character: 'bg-blue-100 text-blue-600',
  scene: 'bg-purple-100 text-purple-600',
  location: 'bg-green-100 text-green-600',
  prop: 'bg-orange-100 text-orange-600',
  other: 'bg-gray-100 text-gray-600',
}

export default function QueryResults({ results }: QueryResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No results found
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-500 uppercase">
        {results.length} {results.length === 1 ? 'Result' : 'Results'}
      </div>

      <div className="grid gap-2">
        {results.map((result) => {
          const Icon = entityIcons[result.type]
          const colorClass = entityColors[result.type]

          return (
            <button
              key={result.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
            >
              {/* Icon */}
              <div className={cn('p-2 rounded-lg', colorClass)}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {Math.round(result.relevance * 100)}%
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {result.content}
                </p>

                {/* Type badge */}
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {result.type}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
