/**
 * Project Readiness Store
 *
 * Manages state for project readiness evaluations with 30s background polling
 *
 * @see {@link /docs/idea/pages/project-readiness.md} for specification
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DepartmentEvaluation {
  departmentId: string
  departmentSlug: string
  departmentName: string
  departmentNumber: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  rating: number | null
  taskId: string | null
  evaluationSummary: string | null
  evaluationResult: string | null
  issues: string[]
  suggestions: string[]
  threshold: number
  lastEvaluatedAt: Date | null
}

interface ProjectReadinessState {
  // Data
  gatherCount: number
  gatherLineCount: number
  departments: DepartmentEvaluation[]
  projectReadinessScore: number | null

  // UI State
  expandedDepartments: Set<string>
  isEvaluating: Record<string, boolean>

  // Polling
  pollingInterval: NodeJS.Timeout | null

  // Actions
  startPolling: (projectId: string) => void
  stopPolling: () => void
  refreshData: (projectId: string) => Promise<void>
  toggleDepartment: (departmentId: string) => void
  startEvaluation: (projectId: string, departmentNumber: number) => Promise<void>
  cancelEvaluation: (projectId: string, taskId: string) => Promise<void>
  updateEvaluationStatus: (departmentId: string, status: any) => void
  reset: () => void
}

export const useProjectReadinessStore = create<ProjectReadinessState>()(
  persist(
    (set, get) => ({
      // Initial state
      gatherCount: 0,
      gatherLineCount: 0,
      departments: [],
      projectReadinessScore: null,
      expandedDepartments: new Set(),
      isEvaluating: {},
      pollingInterval: null,

      // Start 30-second background polling
      startPolling: (projectId: string) => {
        const { pollingInterval, refreshData } = get()

        // Clear existing interval
        if (pollingInterval) {
          clearInterval(pollingInterval)
        }

        // Initial fetch
        refreshData(projectId)

        // Start 30-second polling
        const interval = setInterval(() => {
          refreshData(projectId)
        }, 30000) // 30 seconds

        set({ pollingInterval: interval })
      },

      // Stop polling
      stopPolling: () => {
        const { pollingInterval } = get()
        if (pollingInterval) {
          clearInterval(pollingInterval)
          set({ pollingInterval: null })
        }
      },

      // Refresh all data
      refreshData: async (projectId: string) => {
        try {
          // Fetch gather count
          const gatherResponse = await fetch(`/api/v1/gather/${projectId}/count`)

          if (gatherResponse.ok) {
            const gatherData = await gatherResponse.json()
            set({
              gatherCount: gatherData.count || 0,
              gatherLineCount: gatherData.lineCount || 0,
            })
          }

          // Fetch department evaluations
          const evaluationsResponse = await fetch(`/api/v1/project-readiness/${projectId}`)

          if (evaluationsResponse.ok) {
            const evaluationsData = await evaluationsResponse.json()

            // Fetch task statuses for in-progress evaluations
            const inProgressDepts = evaluationsData.departments?.filter(
              (d: DepartmentEvaluation) => d.status === 'in_progress' && d.taskId,
            )

            if (inProgressDepts && inProgressDepts.length > 0) {
              for (const dept of inProgressDepts) {
                try {
                  const statusResponse = await fetch(
                    `/api/v1/project-readiness/${projectId}/task/${dept.taskId}/status`,
                  )

                  if (statusResponse.ok) {
                    const statusData = await statusResponse.json()

                    // Update if task completed or failed
                    if (
                      statusData.status === 'completed' ||
                      statusData.status === 'failed'
                    ) {
                      await fetch(
                        `/api/v1/project-readiness/${projectId}/department/${dept.departmentId}/sync`,
                        { method: 'POST' },
                      )
                    }
                  }
                } catch (error) {
                  console.error('Failed to check task status:', error)
                }
              }
            }

            // Refresh evaluations after sync
            const refreshedResponse = await fetch(
              `/api/v1/project-readiness/${projectId}`,
            )

            if (refreshedResponse.ok) {
              const refreshedData = await refreshedResponse.json()
              set({
                departments: refreshedData.departments || [],
                projectReadinessScore: refreshedData.projectReadinessScore || null,
              })
            }
          }
        } catch (error) {
          console.error('Failed to refresh project readiness data:', error)
        }
      },

      // Toggle department card expansion
      toggleDepartment: (departmentId: string) => {
        set((state) => {
          const expanded = new Set(state.expandedDepartments)
          if (expanded.has(departmentId)) {
            expanded.delete(departmentId)
          } else {
            expanded.add(departmentId)
          }
          return { expandedDepartments: expanded }
        })
      },

      // Start department evaluation
      startEvaluation: async (projectId: string, departmentNumber: number) => {
        const department = get().departments.find(
          (d) => d.departmentNumber === departmentNumber,
        )

        if (!department) return

        set((state) => ({
          isEvaluating: { ...state.isEvaluating, [department.departmentId]: true },
        }))

        try {
          const response = await fetch(`/api/v1/project-readiness/${projectId}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ departmentNumber }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Evaluation failed')
          }

          const result = await response.json()

          // Update department with task ID and in_progress status
          set((state) => ({
            departments: state.departments.map((d) =>
              d.departmentId === department.departmentId
                ? { ...d, status: 'in_progress' as const, taskId: result.taskId }
                : d,
            ),
          }))

          // Start immediate polling for this evaluation
          get().refreshData(projectId)
        } catch (error) {
          console.error('Evaluation failed:', error)
          set((state) => ({
            isEvaluating: { ...state.isEvaluating, [department.departmentId]: false },
          }))
          throw error
        }
      },

      // Cancel evaluation
      cancelEvaluation: async (projectId: string, taskId: string) => {
        try {
          await fetch(`/api/v1/project-readiness/${projectId}/task/${taskId}/cancel`, {
            method: 'DELETE',
          })

          // Refresh to get updated status
          get().refreshData(projectId)
        } catch (error) {
          console.error('Failed to cancel evaluation:', error)
          throw error
        }
      },

      // Update evaluation status
      updateEvaluationStatus: (departmentId: string, status: any) => {
        set((state) => ({
          departments: state.departments.map((d) =>
            d.departmentId === departmentId ? { ...d, ...status } : d,
          ),
          isEvaluating: { ...state.isEvaluating, [departmentId]: false },
        }))
      },

      // Reset store
      reset: () => {
        const { pollingInterval } = get()
        if (pollingInterval) {
          clearInterval(pollingInterval)
        }
        set({
          gatherCount: 0,
          gatherLineCount: 0,
          departments: [],
          projectReadinessScore: null,
          expandedDepartments: new Set(),
          isEvaluating: {},
          pollingInterval: null,
        })
      },
    }),
    {
      name: 'project-readiness-storage',
      partialize: (state) => ({
        expandedDepartments: Array.from(state.expandedDepartments),
        // Don't persist polling state or data
      }),
      // Restore Set from array
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray((state as any).expandedDepartments)) {
          state.expandedDepartments = new Set((state as any).expandedDepartments)
        }
      },
    },
  ),
)
