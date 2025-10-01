/**
 * React Query hooks for Episodes
 */

'use client'

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../client'

// Types
export interface Episode {
  id: string
  project: string
  title: string
  episodeNumber: number
  season?: number
  synopsis?: string
  status: 'draft' | 'in-progress' | 'review' | 'approved' | 'final'
  targetLength?: number
  actualLength?: number
  quality?: number
  scenes?: string[]
  createdAt: string
  updatedAt: string
}

export interface EpisodeListResponse {
  docs: Episode[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// API Functions
async function fetchEpisodes(projectId?: string): Promise<EpisodeListResponse> {
  const params = new URLSearchParams()
  if (projectId) {
    params.append('where[project][equals]', projectId)
  }
  const response = await fetch(`/api/v1/episodes?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch episodes')
  }
  return response.json()
}

async function fetchEpisode(id: string): Promise<Episode> {
  const response = await fetch(`/api/v1/episodes/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch episode')
  }
  const data = await response.json()
  return data.episode || data
}

// Hooks
export function useEpisodes(
  projectId?: string,
  options?: Omit<UseQueryOptions<EpisodeListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.episodes.list(projectId),
    queryFn: () => fetchEpisodes(projectId),
    ...options,
  })
}

export function useEpisode(
  id: string,
  options?: Omit<UseQueryOptions<Episode>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.episodes.detail(id),
    queryFn: () => fetchEpisode(id),
    enabled: !!id,
    ...options,
  })
}
