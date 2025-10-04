/**
 * Qualification Store
 *
 * Manages state for the qualification process including:
 * - Real-time progress tracking
 * - Phase updates (A → B → C → D)
 * - Department status tracking
 * - Live progress polling
 */

import { create } from 'zustand'

export interface QualificationDepartment {
  departmentId: string
  departmentName: string
  departmentSlug: string
  departmentNumber: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  currentPhase: 'A' | 'B' | 'C' | 'D' | null
  qualifiedDataCount: number
  startedAt: string | null
  completedAt: string | null
  error: string | null
}

export interface QualificationProgress {
  projectId: string
  totalDepartments: number
  completedDepartments: number
  currentDepartment: QualificationDepartment | null
  departments: QualificationDepartment[]
  overallProgress: number
  startedAt: string | null
  estimatedCompletion: string | null
}

interface QualificationState {
  progress: QualificationProgress | null
  isPolling: boolean
  pollingInterval: NodeJS.Timeout | null

  // Actions
  startQualification: (projectId: string) => Promise<void>
  startPolling: (projectId: string) => void
  stopPolling: () => void
  fetchProgress: (projectId: string) => Promise<void>
  cancelQualification: (projectId: string) => Promise<void>
}

export const useQualificationStore = create<QualificationState>((set, get) => ({
  progress: null,
  isPolling: false,
  pollingInterval: null,

  startQualification: async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/qualification/start`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to start qualification')
      }

      const data = await response.json()
      set({ progress: data })

      // Start polling for updates
      get().startPolling(projectId)
    } catch (error) {
      console.error('[QualificationStore] Failed to start qualification:', error)
      throw error
    }
  },

  startPolling: (projectId: string) => {
    const { isPolling, pollingInterval } = get()

    // Don't start if already polling
    if (isPolling && pollingInterval) {
      return
    }

    set({ isPolling: true })

    // Initial fetch
    get().fetchProgress(projectId)

    // Poll every 2 seconds
    const interval = setInterval(() => {
      get().fetchProgress(projectId)
    }, 2000)

    set({ pollingInterval: interval })
  },

  stopPolling: () => {
    const { pollingInterval } = get()

    if (pollingInterval) {
      clearInterval(pollingInterval)
      set({ pollingInterval: null, isPolling: false })
    }
  },

  fetchProgress: async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/qualification/progress`)

      if (!response.ok) {
        throw new Error('Failed to fetch qualification progress')
      }

      const data = await response.json()
      set({ progress: data })

      // Stop polling if all departments completed
      if (data.completedDepartments === data.totalDepartments) {
        get().stopPolling()
      }
    } catch (error) {
      console.error('[QualificationStore] Failed to fetch progress:', error)
    }
  },

  cancelQualification: async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/qualification/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel qualification')
      }

      get().stopPolling()
    } catch (error) {
      console.error('[QualificationStore] Failed to cancel qualification:', error)
      throw error
    }
  },
}))
