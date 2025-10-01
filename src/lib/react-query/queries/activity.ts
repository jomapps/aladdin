/**
 * Activity & Recent Items Query Hooks
 *
 * Provides React Query hooks for fetching user activity and recent items
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../client'

export interface RecentItem {
  id: string
  type: 'project' | 'episode' | 'character' | 'scene' | 'document'
  name: string
  href: string
  timestamp: string
  projectId?: string
}

export interface ActivityLog {
  id: string
  type: string
  action: string
  entityType: string
  entityId: string
  entityName: string
  user: string
  details: Record<string, any>
  timestamp: string
  projectId?: string
}

// API Functions
async function fetchRecentItems(limit = 5): Promise<RecentItem[]> {
  const response = await fetch(`/api/v1/activity/recent?limit=${limit}`)
  if (!response.ok) {
    throw new Error('Failed to fetch recent items')
  }
  const data = await response.json()
  return data.items || data
}

async function fetchUserActivity(limit = 50): Promise<ActivityLog[]> {
  const response = await fetch(`/api/v1/activity/logs?limit=${limit}`)
  if (!response.ok) {
    throw new Error('Failed to fetch activity logs')
  }
  const data = await response.json()
  return data.logs || data
}

async function fetchProjectRecentActivity(projectId: string, limit = 10): Promise<ActivityLog[]> {
  const response = await fetch(`/api/v1/projects/${projectId}/activity?limit=${limit}`)
  if (!response.ok) {
    throw new Error('Failed to fetch project activity')
  }
  const data = await response.json()
  // API returns { activities: [...] }
  const activities = data.activities || data.activity || data || []

  // Transform to ActivityLog format
  return activities.map((activity: any) => ({
    id: activity.id,
    type: activity.type || 'action',
    action: activity.action || 'viewed',
    entityType: activity.entityType || activity.collection || 'unknown',
    entityId: activity.entityId || activity.id,
    entityName: activity.entityName || activity.name || 'Untitled',
    user: activity.user || 'Unknown User',
    details: activity.details || {},
    timestamp: activity.timestamp || activity.createdAt || new Date().toISOString(),
    projectId: activity.project || activity.projectId || projectId,
  }))
}

// Hooks
export function useRecentItems(
  options?: { limit?: number } & Omit<UseQueryOptions<RecentItem[]>, 'queryKey' | 'queryFn'>,
) {
  const { limit = 5, ...queryOptions } = options || {}

  return useQuery({
    queryKey: ['activity', 'recent', limit],
    queryFn: () => fetchRecentItems(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...queryOptions,
  })
}

export function useUserActivity(
  options?: { limit?: number } & Omit<UseQueryOptions<ActivityLog[]>, 'queryKey' | 'queryFn'>,
) {
  const { limit = 50, ...queryOptions } = options || {}

  return useQuery({
    queryKey: ['activity', 'logs', limit],
    queryFn: () => fetchUserActivity(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...queryOptions,
  })
}

export function useProjectRecentActivity(
  projectId: string,
  options?: { limit?: number } & Omit<UseQueryOptions<ActivityLog[]>, 'queryKey' | 'queryFn'>,
) {
  const { limit = 10, ...queryOptions } = options || {}

  return useQuery({
    queryKey: queryKeys.projects.activity(projectId),
    queryFn: () => fetchProjectRecentActivity(projectId, limit),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...queryOptions,
  })
}
