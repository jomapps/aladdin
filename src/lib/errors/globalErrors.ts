/**
 * Global Error System
 *
 * Stores errors visible on all pages until user dismisses them.
 * Supports priority levels, categories, and persistence.
 *
 * Features:
 * - Persistent errors across page navigation
 * - Priority-based display
 * - Auto-dismiss for low-priority errors
 * - User dismissal tracking
 * - Error categorization
 *
 * Usage:
 * ```ts
 * import { addGlobalError, getGlobalErrors, dismissError } from '@/lib/errors/globalErrors'
 *
 * // Add error
 * await addGlobalError({
 *   type: 'generation',
 *   severity: 'error',
 *   message: 'Video generation failed',
 *   context: { sceneId: '123' }
 * })
 *
 * // Get active errors
 * const errors = await getGlobalErrors()
 *
 * // Dismiss error
 * await dismissError(errorId)
 * ```
 */

export type ErrorType =
  | 'system'
  | 'webhook'
  | 'generation'
  | 'processing'
  | 'automation'
  | 'notification'
  | 'validation'
  | 'network'
  | 'success' // For success messages

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface GlobalError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  context?: Record<string, any>
  timestamp: string
  dismissed: boolean
  dismissedAt?: string
  dismissible: boolean
  autoDismissMs?: number
}

interface AddErrorOptions {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  context?: Record<string, any>
  dismissible?: boolean
  autoDismissMs?: number
}

/**
 * In-memory store for development
 * In production, use Redis or database
 */
class GlobalErrorStore {
  private errors: Map<string, GlobalError> = new Map()
  private maxErrors = 100 // Prevent memory leak
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Auto-cleanup old dismissed errors every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000)
  }

  /**
   * Add new error to store
   */
  add(options: AddErrorOptions): GlobalError {
    const error: GlobalError = {
      id: this.generateId(),
      type: options.type,
      severity: options.severity,
      message: options.message,
      context: options.context,
      timestamp: new Date().toISOString(),
      dismissed: false,
      dismissible: options.dismissible !== false, // Default true
      autoDismissMs: options.autoDismissMs,
    }

    this.errors.set(error.id, error)

    // Auto-dismiss if configured
    if (error.autoDismissMs) {
      setTimeout(() => {
        this.dismiss(error.id)
      }, error.autoDismissMs)
    }

    // Enforce max errors limit
    if (this.errors.size > this.maxErrors) {
      this.cleanup(true)
    }

    return error
  }

  /**
   * Get all active (non-dismissed) errors
   */
  getActive(): GlobalError[] {
    const active = Array.from(this.errors.values()).filter((e) => !e.dismissed)

    // Sort by severity (critical > error > warning > info) and timestamp
    return active.sort((a, b) => {
      const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]

      if (severityDiff !== 0) return severityDiff

      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }

  /**
   * Get all errors (including dismissed)
   */
  getAll(): GlobalError[] {
    return Array.from(this.errors.values())
  }

  /**
   * Get error by ID
   */
  getById(id: string): GlobalError | undefined {
    return this.errors.get(id)
  }

  /**
   * Dismiss error by ID
   */
  dismiss(id: string): boolean {
    const error = this.errors.get(id)

    if (!error) return false

    if (!error.dismissible) {
      console.warn(`[GlobalErrors] Error ${id} is not dismissible`)
      return false
    }

    error.dismissed = true
    error.dismissedAt = new Date().toISOString()

    return true
  }

  /**
   * Dismiss all errors
   */
  dismissAll(): number {
    let count = 0

    for (const error of this.errors.values()) {
      if (!error.dismissed && error.dismissible) {
        error.dismissed = true
        error.dismissedAt = new Date().toISOString()
        count++
      }
    }

    return count
  }

  /**
   * Clear dismissed errors older than 24 hours
   */
  cleanup(force = false): number {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    let removed = 0

    for (const [id, error] of this.errors.entries()) {
      if (!error.dismissed && !force) continue

      const errorAge = now - new Date(error.dismissedAt || error.timestamp).getTime()

      if (errorAge > maxAge || force) {
        this.errors.delete(id)
        removed++
      }

      // If forcing cleanup and over limit, remove oldest dismissed first
      if (force && this.errors.size <= this.maxErrors) {
        break
      }
    }

    return removed
  }

  /**
   * Get error statistics
   */
  getStats() {
    const all = this.getAll()
    const active = this.getActive()

    return {
      total: all.length,
      active: active.length,
      dismissed: all.length - active.length,
      bySeverity: {
        critical: active.filter((e) => e.severity === 'critical').length,
        error: active.filter((e) => e.severity === 'error').length,
        warning: active.filter((e) => e.severity === 'warning').length,
        info: active.filter((e) => e.severity === 'info').length,
      },
      byType: active.reduce(
        (acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    }
  }

  /**
   * Generate unique error ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Cleanup on shutdown
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

/**
 * Singleton instance
 */
const globalErrorStore = new GlobalErrorStore()

/**
 * Public API
 */

/**
 * Add a global error
 */
export async function addGlobalError(options: AddErrorOptions): Promise<GlobalError> {
  const error = globalErrorStore.add(options)

  console.log('[GlobalErrors] Added error:', {
    id: error.id,
    type: error.type,
    severity: error.severity,
    message: error.message,
  })

  return error
}

/**
 * Get all active errors
 */
export async function getGlobalErrors(): Promise<GlobalError[]> {
  return globalErrorStore.getActive()
}

/**
 * Get error by ID
 */
export async function getErrorById(id: string): Promise<GlobalError | undefined> {
  return globalErrorStore.getById(id)
}

/**
 * Dismiss an error
 */
export async function dismissError(id: string): Promise<boolean> {
  const result = globalErrorStore.dismiss(id)

  if (result) {
    console.log('[GlobalErrors] Dismissed error:', id)
  }

  return result
}

/**
 * Dismiss all errors
 */
export async function dismissAllErrors(): Promise<number> {
  const count = globalErrorStore.dismissAll()

  console.log('[GlobalErrors] Dismissed all errors:', count)

  return count
}

/**
 * Get error statistics
 */
export async function getErrorStats() {
  return globalErrorStore.getStats()
}

/**
 * Clear old dismissed errors
 */
export async function cleanupErrors(): Promise<number> {
  const removed = globalErrorStore.cleanup()

  if (removed > 0) {
    console.log('[GlobalErrors] Cleaned up old errors:', removed)
  }

  return removed
}

/**
 * Helper: Add success message
 */
export async function addSuccessMessage(
  message: string,
  context?: Record<string, any>,
  autoDismissMs = 5000
): Promise<GlobalError> {
  return addGlobalError({
    type: 'success',
    severity: 'info',
    message,
    context,
    dismissible: true,
    autoDismissMs,
  })
}

/**
 * Helper: Add warning
 */
export async function addWarning(
  message: string,
  context?: Record<string, any>
): Promise<GlobalError> {
  return addGlobalError({
    type: 'validation',
    severity: 'warning',
    message,
    context,
    dismissible: true,
  })
}

/**
 * Helper: Add critical error
 */
export async function addCriticalError(
  message: string,
  context?: Record<string, any>
): Promise<GlobalError> {
  return addGlobalError({
    type: 'system',
    severity: 'critical',
    message,
    context,
    dismissible: false, // Critical errors require manual review
  })
}

/**
 * Export store for testing
 */
export { globalErrorStore }
