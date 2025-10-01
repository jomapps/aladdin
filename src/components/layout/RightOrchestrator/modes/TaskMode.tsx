/**
 * TaskMode Component
 * Task execution mode welcome screen and UI
 */

'use client'

import { Zap, Layers, CheckCircle, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

function Welcome() {
  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
          <Zap className="w-8 h-8 text-orange-600" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Task Execution Mode</h3>
        <p className="text-sm text-gray-600">
          Execute complex tasks with multi-agent orchestration. I&apos;ll coordinate departments to
          complete your request.
        </p>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase text-center">Features</p>

        <div className="space-y-2">
          {[
            {
              icon: Layers,
              title: 'Department Coordination',
              description: 'Multiple specialized agents work together',
              color: 'bg-purple-100 text-purple-600',
            },
            {
              icon: BarChart3,
              title: 'Quality Tracking',
              description: 'Real-time quality scores for each step',
              color: 'bg-blue-100 text-blue-600',
            },
            {
              icon: CheckCircle,
              title: 'Progress Monitoring',
              description: 'Live updates as tasks complete',
              color: 'bg-green-100 text-green-600',
            },
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className={cn('p-2 rounded-lg', feature.color)}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{feature.title}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{feature.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Example tasks */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase text-center">Example tasks</p>

        <div className="space-y-2">
          {[
            'Create a new character with full profile',
            'Generate scene breakdown for Act 1',
            'Analyze character relationships',
            'Export project to screenplay format',
          ].map((task, index) => (
            <button
              key={index}
              className="w-full text-left px-4 py-3 rounded-lg bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-sm text-gray-700"
            >
              {task}
            </button>
          ))}
        </div>
      </div>

      {/* Departments */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase text-center">
          Available departments
        </p>

        <div className="grid grid-cols-3 gap-2">
          {['Character', 'Scene', 'Location', 'Prop', 'Dialogue', 'Export'].map((dept) => (
            <div
              key={dept}
              className="px-2 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs text-center font-medium"
            >
              {dept}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default {
  Welcome,
}
