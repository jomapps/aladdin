/**
 * ChatMode Component
 * General chat mode welcome screen and UI
 */

'use client'

import { MessageCircle, Sparkles, HelpCircle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

function Welcome() {
  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-indigo-600" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">General Chat Mode</h3>
        <p className="text-sm text-gray-600">
          Have a conversation about anything. This mode doesn't access your project data.
        </p>
      </div>

      {/* Capabilities */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase text-center">
          I can help with
        </p>

        <div className="space-y-2">
          {[
            {
              icon: Sparkles,
              title: 'Creative Writing',
              description: 'Brainstorm ideas and overcome writer's block',
              color: 'bg-yellow-100 text-yellow-600',
            },
            {
              icon: HelpCircle,
              title: 'General Questions',
              description: 'Ask about storytelling, structure, or techniques',
              color: 'bg-blue-100 text-blue-600',
            },
            {
              icon: Lightbulb,
              title: 'Ideas & Feedback',
              description: 'Get suggestions and constructive feedback',
              color: 'bg-purple-100 text-purple-600',
            },
          ].map((capability, index) => {
            const Icon = capability.icon
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className={cn('p-2 rounded-lg', capability.color)}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {capability.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
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
        <p className="text-xs font-medium text-gray-500 uppercase text-center">
          Start a conversation
        </p>

        <div className="space-y-2">
          {[
            'Explain the hero's journey structure',
            'How do I create compelling dialogue?',
            'What makes a good plot twist?',
            'Give me tips for character development',
          ].map((prompt, index) => (
            <button
              key={index}
              className="w-full text-left px-4 py-3 rounded-lg bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-sm text-gray-700"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          💡 Switch to Query, Data, or Task mode to work with your project
        </p>
      </div>
    </div>
  )
}

export default {
  Welcome,
}
