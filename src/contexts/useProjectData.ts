/**
 * useProjectData Hook
 *
 * Hook to access project data with computed values
 */

'use client'

import { useMemo } from 'react'
import { useProjectContext } from './ProjectContext'

export function useProjectData() {
  const context = useProjectContext()

  // Compute derived values
  const derivedData = useMemo(() => {
    const { currentProject, episodes, characters } = context

    // Total episodes
    const totalEpisodes = episodes.length

    // Total characters
    const totalCharacters = characters.length

    // Main characters (protagonist/antagonist)
    const mainCharacters = characters.filter(
      (c) => c.role === 'protagonist' || c.role === 'antagonist'
    )

    // Supporting characters
    const supportingCharacters = characters.filter(
      (c) => c.role === 'supporting'
    )

    // Episode statistics
    const episodeStats = {
      total: totalEpisodes,
      draft: episodes.filter((e) => e.status === 'draft').length,
      inProgress: episodes.filter((e) => e.status === 'in-progress').length,
      review: episodes.filter((e) => e.status === 'review').length,
      approved: episodes.filter((e) => e.status === 'approved').length,
      final: episodes.filter((e) => e.status === 'final').length,
    }

    // Average quality
    const episodesWithQuality = episodes.filter((e) => e.quality != null)
    const averageEpisodeQuality =
      episodesWithQuality.length > 0
        ? episodesWithQuality.reduce((sum, e) => sum + (e.quality || 0), 0) /
          episodesWithQuality.length
        : 0

    // Overall progress
    const overallProgress = currentProject
      ? ((currentProject.expansionProgress || 0) +
          (currentProject.compactingProgress || 0)) /
        2
      : 0

    // Project health indicator
    const projectHealth =
      currentProject?.phase === 'complete'
        ? 'complete'
        : currentProject?.status === 'active'
        ? 'healthy'
        : currentProject?.status === 'paused'
        ? 'paused'
        : 'archived'

    return {
      totalEpisodes,
      totalCharacters,
      mainCharacters,
      supportingCharacters,
      episodeStats,
      averageEpisodeQuality,
      overallProgress,
      projectHealth,
    }
  }, [context.currentProject, context.episodes, context.characters])

  return {
    ...context,
    ...derivedData,
  }
}
