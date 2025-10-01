/**
 * React Query hooks for Projects
 */

'use client'

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../client'

// Types
export interface Project {
  id: string
  name: string
  slug: string
  type: 'movie' | 'series'
  phase: 'expansion' | 'compacting' | 'complete'
  status: 'active' | 'paused' | 'archived' | 'complete'
  logline?: string
  synopsis?: string
  genre?: Array<{ genre: string }>
  coverImage?: any
  owner: string
  team?: Array<{
    user: string
    role: string
    permissions?: Array<{ permission: string }>
  }>
  overallQuality?: number
  qualityBreakdown?: {
    story?: number
    characters?: number
    visuals?: number
    technical?: number
  }
  settings?: {
    brainValidationRequired?: boolean
    minQualityThreshold?: number
    autoGenerateImages?: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface ProjectListResponse {
  docs: Project[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ProjectActivity {
  id: string
  type: string
  action: string
  user: string
  details: Record<string, any>
  timestamp: string
}

// API Functions
async function fetchProjects(filters?: Record<string, any>): Promise<ProjectListResponse> {
  const params = new URLSearchParams(filters as any)
  const response = await fetch(`/api/v1/projects?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }
  const data = await response.json()

  // Transform API response to match ProjectListResponse interface
  // API returns { projects: [...] } but we expect { docs: [...] }
  return {
    docs: data.projects || [],
    totalDocs: data.totalDocs || 0,
    limit: data.limit || 10,
    page: data.page || 1,
    totalPages: data.totalPages || 0,
    hasNextPage: data.hasNextPage || false,
    hasPrevPage: data.hasPrevPage || false,
  }
}

async function fetchProject(id: string): Promise<Project> {
  const response = await fetch(`/api/v1/projects/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch project')
  }
  const data = await response.json()
  return data.project || data
}

async function fetchProjectActivity(projectId: string, limit = 50): Promise<ProjectActivity[]> {
  const response = await fetch(`/api/v1/projects/${projectId}/activity?limit=${limit}`)
  if (!response.ok) {
    throw new Error('Failed to fetch project activity')
  }
  const data = await response.json()
  return data.activities || data
}

async function fetchProjectTeam(projectId: string): Promise<any[]> {
  const response = await fetch(`/api/v1/projects/${projectId}/team`)
  if (!response.ok) {
    throw new Error('Failed to fetch project team')
  }
  const data = await response.json()
  return data.team || data
}

// Hooks
export function useProjects(
  filters?: Record<string, any>,
  options?: Omit<UseQueryOptions<ProjectListResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => fetchProjects(filters),
    ...options,
  })
}

export function useProject(
  id: string,
  options?: Omit<UseQueryOptions<Project>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => fetchProject(id),
    enabled: !!id,
    ...options,
  })
}

export function useProjectActivity(
  projectId: string,
  limit = 50,
  options?: Omit<UseQueryOptions<ProjectActivity[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.projects.activity(projectId),
    queryFn: () => fetchProjectActivity(projectId, limit),
    enabled: !!projectId,
    ...options,
  })
}

export function useProjectTeam(
  projectId: string,
  options?: Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.projects.team(projectId),
    queryFn: () => fetchProjectTeam(projectId),
    enabled: !!projectId,
    ...options,
  })
}
