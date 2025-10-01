/**
 * QueryMode Component
 * Query mode welcome screen and UI
 */

'use client'

import { Search, Users, MapPin, FileText, Box } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuggestionChipProps {
  text: string
  onClick?: () => void
}

function SuggestionChip({ text, onClick }: SuggestionChipProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm transition-colors"
    >
      <Search className="w-3 h-3" />
      {text}
    </button>
  )
}

function Welcome() {
  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
          <Search className="w-8 h-8 text-purple-600" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Query Mode</h3>
        <p className="text-sm text-gray-600">
          Ask questions about your project. I can search through characters, scenes, locations, and more.
        </p>
      </div>

      {/* Entity types */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase text-center">
          Search across
        </p>

        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Users, label: 'Characters', color: 'bg-blue-100 text-blue-600' },
            { icon: FileText, label: 'Scenes', color: 'bg-purple-100 text-purple-600' },
            { icon: MapPin, label: 'Locations', color: 'bg-green-100 text-green-600' },
            { icon: Box, label: 'Props', color: 'bg-orange-100 text-orange-600' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className={cn('p-1.5 rounded', item.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase text-center">
          Try asking
        </p>

        <div className="flex flex-wrap gap-2 justify-center">
          <SuggestionChip text="Show all scenes with Aladdin" />
          <SuggestionChip text="What's Jasmine's character arc?" />
          <SuggestionChip text="Find plot holes in Act 2" />
          <SuggestionChip text="List all Agrabah locations" />
        </div>
      </div>
    </div>
  )
}

export default {
  Welcome,
  SuggestionChip,
}
