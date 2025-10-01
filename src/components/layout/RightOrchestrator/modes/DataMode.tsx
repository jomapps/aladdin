/**
 * DataMode Component
 * Data ingestion mode welcome screen and UI
 */

'use client'

import { Database, Upload, FileCheck, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

function Welcome() {
  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Database className="w-8 h-8 text-green-600" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Data Ingestion Mode</h3>
        <p className="text-sm text-gray-600">
          Add or update project data. I'll validate and structure the information before ingesting it.
        </p>
      </div>

      {/* Process steps */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase text-center">
          How it works
        </p>

        <div className="space-y-2">
          {[
            {
              icon: Upload,
              title: 'Describe your data',
              description: 'Tell me what you want to add',
              color: 'bg-blue-100 text-blue-600',
            },
            {
              icon: FileCheck,
              title: 'Review validation',
              description: 'I'll structure and validate it',
              color: 'bg-purple-100 text-purple-600',
            },
            {
              icon: Database,
              title: 'Confirm ingestion',
              description: 'Approve to add to your project',
              color: 'bg-green-100 text-green-600',
            },
          ].map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className={cn('p-2 rounded-lg', step.color)}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {step.description}
                  </div>
                </div>

                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-gray-300 text-xs text-gray-500 font-medium">
                  {index + 1}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Data types */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase text-center">
          Supported data types
        </p>

        <div className="flex flex-wrap gap-2 justify-center">
          {['Characters', 'Scenes', 'Locations', 'Props', 'Dialogues', 'Notes'].map((type) => (
            <div
              key={type}
              className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm"
            >
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          All data is validated and structured before being added to your project. You'll have a chance to review and approve.
        </p>
      </div>
    </div>
  )
}

export default {
  Welcome,
}
