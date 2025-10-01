/**
 * React Query hooks for Characters
 */

'use client'

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../client'

// Types
export interface Character {
  id: string
  project: string
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  description?: string
  backstory?: string
  appearance?: string
  personality?: string
  goals?: string[]
  relationships?: Array<{
    character: string
    type: string
    description?: string
  }>
  profileImage?: any
  masterImage?: any
  createdAt: string
  updatedAt: string
}

export interface CharacterListResponse {
  docs: Character[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// API Functions
async function fetchCharacters(projectId?: string): Promise<CharacterListResponse> {
  const params = new URLSearchParams()
  if (projectId) {
    params.append('where[project][equals]', projectId)
  }
  const response = await fetch(`/api/v1/characters?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch characters')
  }
  return response.json()
}

async function fetchCharacter(id: string): Promise<Character> {
  const response = await fetch(`/api/v1/characters/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch character')
  }
  const data = await response.json()
  return data.character || data
}

// Hooks
export function useCharacters(
  projectId?: string,
  options?: Omit<UseQueryOptions<CharacterListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.characters.list(projectId),
    queryFn: () => fetchCharacters(projectId),
    ...options,
  })
}

export function useCharacter(
  id: string,
  options?: Omit<UseQueryOptions<Character>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.characters.detail(id),
    queryFn: () => fetchCharacter(id),
    enabled: !!id,
    ...options,
  })
}
