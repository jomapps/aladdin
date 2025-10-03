/**
 * ChatMode Component
 * General chat mode welcome screen and UI
 */

'use client'

import { MessageCircle, Sparkles, HelpCircle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WelcomeProps {
  onSuggestionClick?: (text: string) => void
}

function Welcome({ onSuggestionClick }: WelcomeProps) {
  return (
    <div className="max-w-md mx-auto space-y-6 py-8 px-4">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-zinc-900 dark:text-zinc-100" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Project AI Assistant</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Let's build your story together, one department at a time.
        </p>
      </div>

      {/* Workflow Instructions */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase text-center">
          How to get started
        </p>

        <div className="space-y-2">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Check Project Readiness
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  I'll analyze which department needs attention first based on readiness scores.
                  If no data exists yet, we'll start with Story.
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                  Start with the Department with Lowest Readiness
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  I'll ask: "Please tell me something about [Department Name]"
                  (e.g., Story, Characters, Setting, Plot, etc.)
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  Gather Information Iteratively
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300">
                  As you provide details, I'll help organize and refine your project until all departments reach the readiness threshold.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-800 dark:text-amber-200 text-center">
          💡 I'll guide you through each department systematically based on what needs the most attention
        </p>
      </div>
    </div>
  )
}

export default {
  Welcome,
}
