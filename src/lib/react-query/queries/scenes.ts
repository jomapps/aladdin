/**
 * React Query hooks for Scenes
 */

'use client'

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../client'

// Types
export interface Scene {
  id: string
  episode: string
  sceneNumber: number
  title?: string
  location?: string
  timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk'
  description?: string
  dialogue?: any
  characters?: string[]
  duration?: number
  quality?: number
  status: 'draft' | 'in-progress' | 'review' | 'approved'
  createdAt: string
  updatedAt: string
}

export interface SceneListResponse {
  docs: Scene[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// API Functions
async function fetchScenes(episodeId?: string): Promise<SceneListResponse> {
  const params = new URLSearchParams()
  if (episodeId) {
    params.append('where[episode][equals]', episodeId)
  }
  // Use PayloadCMS built-in API which returns { docs: [...], totalDocs, ... }
  const response = await fetch(`/api/scenes?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch scenes')
  }
  return response.json()
}

async function fetchScene(id: string): Promise<Scene> {
  // Use PayloadCMS built-in API
  const response = await fetch(`/api/scenes/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch scene')
  }
  return response.json()
}

// Hooks
export function useScenes(
  episodeId?: string,
  options?: Omit<UseQueryOptions<SceneListResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.scenes.list(episodeId),
    queryFn: () => fetchScenes(episodeId),
    ...options,
  })
}

export function useScene(
  id: string,
  options?: Omit<UseQueryOptions<Scene>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.scenes.detail(id),
    queryFn: () => fetchScene(id),
    enabled: !!id,
    ...options,
  })
}
