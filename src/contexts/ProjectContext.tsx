/**
 * Project Context
 *
 * Global state management for current project and related data
 */

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useProject, useProjectActivity, useProjectTeam, Project } from '@/lib/react-query/queries/projects'
import { useEpisodes, Episode } from '@/lib/react-query/queries/episodes'
import { useCharacters, Character } from '@/lib/react-query/queries/characters'

interface ProjectContextType {
  // Current project
  currentProjectId: string | null
  currentProject: Project | undefined
  isLoadingProject: boolean
  projectError: Error | null

  // Set current project
  setCurrentProjectId: (id: string | null) => void

  // Project data
  episodes: Episode[]
  characters: Character[]
  activity: any[]
  team: any[]

  // Loading states
  isLoadingEpisodes: boolean
  isLoadingCharacters: boolean
  isLoadingActivity: boolean
  isLoadingTeam: boolean

  // Refresh functions
  refreshProject: () => void
  refreshEpisodes: () => void
  refreshCharacters: () => void
  refreshActivity: () => void
}

const ProjectContext = createContext<ProjectContextType | null>(null)

interface ProjectProviderProps {
  children: React.ReactNode
  initialProjectId?: string
}

export function ProjectProvider({ children, initialProjectId }: ProjectProviderProps) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    initialProjectId || null
  )

  // Fetch current project
  const {
    data: currentProject,
    isLoading: isLoadingProject,
    error: projectError,
    refetch: refreshProject,
  } = useProject(currentProjectId!, {
    enabled: !!currentProjectId,
  })

  // Fetch episodes for current project
  const {
    data: episodesData,
    isLoading: isLoadingEpisodes,
    refetch: refreshEpisodes,
  } = useEpisodes(currentProjectId!, {
    enabled: !!currentProjectId,
  })

  // Fetch characters for current project
  const {
    data: charactersData,
    isLoading: isLoadingCharacters,
    refetch: refreshCharacters,
  } = useCharacters(currentProjectId!, {
    enabled: !!currentProjectId,
  })

  // Fetch activity for current project
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    refetch: refreshActivity,
  } = useProjectActivity(currentProjectId!, 50, {
    enabled: !!currentProjectId,
  })

  // Fetch team for current project
  const {
    data: teamData,
    isLoading: isLoadingTeam,
  } = useProjectTeam(currentProjectId!, {
    enabled: !!currentProjectId,
  })

  // Store projectId in localStorage
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('currentProjectId', currentProjectId)
    } else {
      localStorage.removeItem('currentProjectId')
    }
  }, [currentProjectId])

  // Restore projectId from localStorage on mount
  useEffect(() => {
    if (!currentProjectId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentProjectId')
      if (stored) {
        setCurrentProjectId(stored)
      }
    }
  }, [currentProjectId])

  const value: ProjectContextType = {
    currentProjectId,
    currentProject,
    isLoadingProject,
    projectError: projectError as Error | null,
    setCurrentProjectId,
    episodes: episodesData?.docs || [],
    characters: charactersData?.docs || [],
    activity: activityData || [],
    team: teamData || [],
    isLoadingEpisodes,
    isLoadingCharacters,
    isLoadingActivity,
    isLoadingTeam,
    refreshProject,
    refreshEpisodes,
    refreshCharacters,
    refreshActivity,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectProvider')
  }
  return context
}
