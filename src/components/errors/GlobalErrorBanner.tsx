/**
 * Global Error Banner
 *
 * Fixed position error display shown at the top of all pages
 * Handles critical errors, warnings, and dismissible notifications
 */

'use client'

import { useState } from 'react'
import { useErrorBannerStore } from '@/stores/errorBannerStore'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  AlertTriangle,
  XCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function GlobalErrorBanner() {
  const { errors, dismissError, clearAllErrors } = useErrorBannerStore()
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set())

  // Don't render if no errors
  if (errors.length === 0) {
    return null
  }

  const toggleExpanded = (errorId: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev)
      if (next.has(errorId)) {
        next.delete(errorId)
      } else {
        next.add(errorId)
      }
      return next
    })
  }

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const getErrorStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-500/15 text-red-100'
      case 'warning':
        return 'border-amber-500 bg-amber-500/15 text-amber-100'
      default:
        return 'border-blue-500 bg-blue-500/15 text-blue-100'
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 space-y-2 p-4">
      {errors.map((error) => {
        const isExpanded = expandedErrors.has(error.id)

        return (
          <Alert
            key={error.id}
            className={cn(
              'relative border shadow-lg transition-all',
              getErrorStyle(error.type),
              error.type === 'critical' && 'animate-pulse'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 pt-0.5">
                {getErrorIcon(error.type)}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <AlertDescription className="text-sm font-medium">
                    {error.message}
                  </AlertDescription>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {error.details && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-current hover:bg-white/10"
                        onClick={() => toggleExpanded(error.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {error.dismissible && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-current hover:bg-white/10"
                        onClick={() => dismissError(error.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {error.details && isExpanded && (
                  <div className="rounded-md bg-black/20 p-3">
                    <pre className="overflow-x-auto text-xs">
                      <code>{error.details}</code>
                    </pre>
                  </div>
                )}

                {/* Action Button */}
                {error.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={error.action.onClick}
                    className="border-current/30 bg-white/10 text-current hover:bg-white/20"
                  >
                    {error.action.label}
                  </Button>
                )}

                {/* Timestamp */}
                <p className="text-xs opacity-70">
                  {new Date(error.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </Alert>
        )
      })}

      {/* Clear All Button */}
      {errors.length > 1 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={clearAllErrors}
            className="border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-800"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Hook to add errors from anywhere in the app
 */
export function useGlobalError() {
  const addError = useErrorBannerStore((state) => state.addError)

  return {
    showError: (message: string, details?: string) => {
      addError({
        type: 'error',
        message,
        details,
        dismissible: true,
      })
    },
    showWarning: (message: string, details?: string) => {
      addError({
        type: 'warning',
        message,
        details,
        dismissible: true,
      })
    },
    showCritical: (message: string, details?: string, action?: { label: string; onClick: () => void }) => {
      addError({
        type: 'critical',
        message,
        details,
        dismissible: false,
        action,
      })
    },
  }
}
