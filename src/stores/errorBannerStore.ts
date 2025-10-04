/**
 * Global Error Banner Store
 *
 * Manages global error state that displays at the top of all pages
 */

import { create } from 'zustand'

export interface GlobalError {
  id: string
  type: 'error' | 'warning' | 'critical'
  message: string
  details?: string
  timestamp: string
  dismissible: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface ErrorBannerState {
  errors: GlobalError[]

  // Actions
  addError: (error: Omit<GlobalError, 'id' | 'timestamp'>) => void
  dismissError: (errorId: string) => void
  clearAllErrors: () => void
}

export const useErrorBannerStore = create<ErrorBannerState>((set) => ({
  errors: [],

  addError: (error) => {
    const newError: GlobalError = {
      ...error,
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      dismissible: error.dismissible ?? true,
    }

    set((state) => ({
      errors: [...state.errors, newError],
    }))

    // Auto-dismiss non-critical errors after 10 seconds
    if (error.type !== 'critical') {
      setTimeout(() => {
        set((state) => ({
          errors: state.errors.filter((e) => e.id !== newError.id),
        }))
      }, 10000)
    }
  },

  dismissError: (errorId) => {
    set((state) => ({
      errors: state.errors.filter((error) => error.id !== errorId),
    }))
  },

  clearAllErrors: () => {
    set({ errors: [] })
  },
}))
