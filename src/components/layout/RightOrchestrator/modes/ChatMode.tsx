/**
 * ChatMode Component
 * General chat mode welcome screen and UI
 */

'use client'

import { MessageCircle, Sparkles, HelpCircle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

function Welcome() {
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
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">General Chat</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Have a conversation about anything. This mode doesn't access your project data.
        </p>
      </div>

      {/* Capabilities */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase text-center">
          I can help with
        </p>

        <div className="space-y-2">
          {[
            {
              icon: Sparkles,
              title: 'Creative Writing',
              description: "Brainstorm ideas and overcome writer's block",
            },
            {
              icon: HelpCircle,
              title: 'General Questions',
              description: 'Ask about storytelling, structure, or techniques',
            },
            {
              icon: Lightbulb,
              title: 'Ideas & Feedback',
              description: 'Get suggestions and constructive feedback',
            },
          ].map((capability, index) => {
            const Icon = capability.icon
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="p-2 rounded-lg bg-zinc-900 dark:bg-zinc-100">
                  <Icon className="w-4 h-4 text-white dark:text-black" />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {capability.title}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {capability.description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Starter prompts */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase text-center">
          Start a conversation
        </p>

        <div className="space-y-2">
          {[
            "Explain the hero's journey structure",
            'How do I create compelling dialogue?',
            'What makes a good plot twist?',
            'Give me tips for character development',
          ].map((prompt, index) => (
            <button
              key={index}
              className="w-full text-left px-4 py-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-sm text-zinc-900 dark:text-zinc-100"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center">
          💡 Switch to Query, Data, or Task mode to work with your project
        </p>
      </div>
    </div>
  )
}

export default {
  Welcome,
}
