/**
 * TaskProgress Component
 * Displays task execution progress with department steps
 */

'use client'

import { TaskProgress as TaskProgressType } from '@/stores/orchestratorStore'
import { CheckCircle, Circle, Loader, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskProgressProps {
  progress: TaskProgressType
}

export default function TaskProgress({ progress }: TaskProgressProps) {
  const statusConfig = {
    pending: {
      icon: Circle,
      color: 'text-gray-400',
      bg: 'bg-gray-50',
      label: 'Pending',
    },
    running: {
      icon: Loader,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      label: 'Running',
      animate: true,
    },
    complete: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      label: 'Complete',
    },
    failed: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      label: 'Failed',
    },
  }

  const taskConfig = statusConfig[progress.status]
  const TaskIcon = taskConfig.icon

  return (
    <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-white">
      {/* Overall status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TaskIcon
            className={cn('w-5 h-5', taskConfig.color, taskConfig.animate && 'animate-spin')}
          />
          <span className="text-sm font-medium text-gray-900">
            {taskConfig.label}
          </span>
        </div>

        {/* Overall progress percentage */}
        <span className="text-sm text-gray-600">
          {Math.round(progress.progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-purple-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress.progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {progress.steps.map((step, index) => {
          const stepConfig = statusConfig[step.status]
          const StepIcon = stepConfig.icon

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-colors',
                stepConfig.bg
              )}
            >
              {/* Step number / icon */}
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 flex-shrink-0">
                {step.status === 'complete' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : step.status === 'failed' ? (
                  <XCircle className="w-4 h-4 text-red-600" />
                ) : step.status === 'running' ? (
                  <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <span className="text-xs text-gray-500">{index + 1}</span>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {step.name}
                    </div>

                    {step.agent && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Agent: {step.agent}
                      </div>
                    )}
                  </div>

                  {/* Quality score */}
                  {step.qualityScore !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Quality:</span>
                      <span className={cn(
                        'text-xs font-medium',
                        step.qualityScore >= 0.8
                          ? 'text-green-600'
                          : step.qualityScore >= 0.6
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      )}>
                        {Math.round(step.qualityScore * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall quality */}
      {progress.overallQuality !== undefined && progress.status === 'complete' && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Overall Quality</span>
            <span className={cn(
              'text-sm font-semibold',
              progress.overallQuality >= 0.8
                ? 'text-green-600'
                : progress.overallQuality >= 0.6
                ? 'text-yellow-600'
                : 'text-red-600'
            )}>
              {Math.round(progress.overallQuality * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
