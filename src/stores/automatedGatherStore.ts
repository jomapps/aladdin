/**
 * Automated Gather Store - Zustand State Management
 * Manages automation state, progress tracking, and department status
 */

import { create } from 'zustand'
import type { TaskStatus, TaskStatusValue } from '@/lib/task-service/types'

// ========== TYPES ==========

export interface DepartmentProgress {
  departmentSlug: string
  departmentName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  currentStep?: string
  qualityScore?: number
  startedAt?: string
  completedAt?: string
  error?: string
}

export interface AutomationProgress {
  currentDepartment?: string
  completedDepartments: string[]
  failedDepartments: string[]
  overallProgress: number
  departments: Record<string, DepartmentProgress>
}

export interface AutomatedGatherState {
  // Current automation task
  taskId: string | null
  status: TaskStatusValue | null

  // Progress tracking
  progress: AutomationProgress

  // Real-time updates
  lastUpdate: string | null

  // Actions
  startAutomation: (taskId: string) => void
  updateProgress: (status: TaskStatus) => void
  updateDepartmentProgress: (department: DepartmentProgress) => void
  setStatus: (status: TaskStatusValue) => void
  cancelAutomation: () => void
  reset: () => void
}

// ========== INITIAL STATE ==========

const initialProgress: AutomationProgress = {
  completedDepartments: [],
  failedDepartments: [],
  overallProgress: 0,
  departments: {},
}

// ========== STORE ==========

export const useAutomatedGatherStore = create<AutomatedGatherState>((set, get) => ({
  // Initial state
  taskId: null,
  status: null,
  progress: initialProgress,
  lastUpdate: null,

  // Start automation
  startAutomation: (taskId: string) => {
    set({
      taskId,
      status: 'queued',
      progress: initialProgress,
      lastUpdate: new Date().toISOString(),
    })
  },

  // Update progress from task status
  updateProgress: (taskStatus: TaskStatus) => {
    const { taskId, status, progress, current_step } = taskStatus

    set((state) => ({
      taskId: taskId,
      status: status,
      progress: {
        ...state.progress,
        overallProgress: progress || 0,
        currentDepartment: current_step,
      },
      lastUpdate: new Date().toISOString(),
    }))
  },

  // Update individual department progress
  updateDepartmentProgress: (department: DepartmentProgress) => {
    set((state) => {
      const departments = {
        ...state.progress.departments,
        [department.departmentSlug]: department,
      }

      // Update completed/failed lists
      const completedDepartments = Object.values(departments)
        .filter((d) => d.status === 'completed')
        .map((d) => d.departmentSlug)

      const failedDepartments = Object.values(departments)
        .filter((d) => d.status === 'failed')
        .map((d) => d.departmentSlug)

      // Calculate overall progress
      const totalDepartments = Object.keys(departments).length
      const processedDepartments = completedDepartments.length + failedDepartments.length
      const overallProgress =
        totalDepartments > 0 ? (processedDepartments / totalDepartments) * 100 : 0

      return {
        progress: {
          ...state.progress,
          departments,
          completedDepartments,
          failedDepartments,
          overallProgress,
          currentDepartment:
            department.status === 'processing' ? department.departmentSlug : state.progress.currentDepartment,
        },
        lastUpdate: new Date().toISOString(),
      }
    })
  },

  // Set status
  setStatus: (status: TaskStatusValue) => {
    set({
      status,
      lastUpdate: new Date().toISOString(),
    })
  },

  // Cancel automation
  cancelAutomation: () => {
    set({
      status: 'cancelled',
      lastUpdate: new Date().toISOString(),
    })
  },

  // Reset state
  reset: () => {
    set({
      taskId: null,
      status: null,
      progress: initialProgress,
      lastUpdate: null,
    })
  },
}))
