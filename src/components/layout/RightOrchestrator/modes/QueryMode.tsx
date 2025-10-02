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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm transition-colors"
    >
      <Search className="w-3 h-3" />
      {text}
    </button>
  )
}

interface WelcomeProps {
  onSuggestionClick?: (text: string) => void
}

function Welcome({ onSuggestionClick }: WelcomeProps) {
  return (
    <div className="max-w-md mx-auto space-y-6 py-8 px-4">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Search className="w-8 h-8 text-zinc-900 dark:text-zinc-100" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Query Mode</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ask questions about your project. I can search through characters, scenes, locations, and
          more.
        </p>
      </div>

      {/* Entity types */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase text-center">
          Search across
        </p>

        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Users, label: 'Characters' },
            { icon: FileText, label: 'Scenes' },
            { icon: MapPin, label: 'Locations' },
            { icon: Box, label: 'Props' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="p-1.5 rounded bg-zinc-900 dark:bg-zinc-100">
                  <Icon className="w-4 h-4 text-white dark:text-black" />
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase text-center">
          Try asking
        </p>

        <div className="flex flex-wrap gap-2 justify-center">
          <SuggestionChip
            text="Show all scenes with Aladdin"
            onClick={() => onSuggestionClick?.('Show all scenes with Aladdin')}
          />
          <SuggestionChip
            text="What's Jasmine's character arc?"
            onClick={() => onSuggestionClick?.("What's Jasmine's character arc?")}
          />
          <SuggestionChip
            text="Find plot holes in Act 2"
            onClick={() => onSuggestionClick?.('Find plot holes in Act 2')}
          />
          <SuggestionChip
            text="List all Agrabah locations"
            onClick={() => onSuggestionClick?.('List all Agrabah locations')}
          />
        </div>
      </div>
    </div>
  )
}

export default {
  Welcome,
  SuggestionChip,
}
