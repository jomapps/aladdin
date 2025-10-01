/**
 * DataPreview Component
 * Displays data validation preview
 */

'use client'

import { DataPreview as DataPreviewType } from '@/stores/orchestratorStore'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataPreviewProps {
  preview: DataPreviewType
}

export default function DataPreview({ preview }: DataPreviewProps) {
  const statusConfig = {
    validating: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'Validating...',
    },
    valid: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Valid',
    },
    invalid: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Invalid',
    },
  }

  const config = statusConfig[preview.status]
  const StatusIcon = config.icon

  return (
    <div className="space-y-3">
      {/* Status header */}
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', config.bg, config.border)}>
        <StatusIcon className={cn('w-4 h-4', config.color)} />
        <span className={cn('text-sm font-medium', config.color)}>
          {config.label}
        </span>
      </div>

      {/* Fields */}
      <div className="space-y-2">
        {preview.fields.map((field, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg border',
              field.valid
                ? 'bg-white border-gray-200'
                : 'bg-red-50 border-red-200'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {field.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({field.type})
                  </span>
                </div>

                <div className="mt-1 text-sm text-gray-600 font-mono truncate">
                  {JSON.stringify(field.value)}
                </div>

                {/* Issues */}
                {field.issues && field.issues.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {field.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                        <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Validation icon */}
              {field.valid ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Errors */}
      {preview.errors.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-red-600 uppercase">
            Errors
          </div>
          {preview.errors.map((error, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded text-sm text-red-700">
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {preview.warnings.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-yellow-600 uppercase">
            Warnings
          </div>
          {preview.warnings.map((warning, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
