/**
 * ProjectProvider Component
 *
 * Provides project context to all components within a project scope
 * Fetches and caches project data using React Query
 */

'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useProject as useProjectQuery } from '@/lib/react-query'

interface Project {
  id: string
  slug: string
  name: string
  description?: string
  status?: string
  createdAt: string
  updatedAt: string
}

interface ProjectContextValue {
  project: Project | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

interface ProjectProviderProps {
  projectId: string
  children: ReactNode
}

export function ProjectProvider({ projectId, children }: ProjectProviderProps) {
  const { data, isLoading, error, refetch } = useProjectQuery(projectId)

  const value: ProjectContextValue = {
    project: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

/**
 * Hook to access project context
 * Must be used within ProjectProvider
 */
export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider')
  }
  return context
}

