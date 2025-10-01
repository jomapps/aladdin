/**
 * Cache Strategies and Key Generators
 * Phase 7: Production Polish
 */

/**
 * TTL configurations for different entity types
 */
export const TTL_CONFIG = {
  // User data - 15 minutes
  user: 900,

  // Project data - 10 minutes
  project: 600,

  // Scene data - 5 minutes
  scene: 300,

  // Character data - 10 minutes
  character: 600,

  // Asset metadata - 30 minutes
  asset: 1800,

  // Agent results - 1 hour
  agentResult: 3600,

  // Quality metrics - 2 minutes
  qualityMetrics: 120,

  // System health - 1 minute
  health: 60,

  // Static content - 24 hours
  static: 86400,
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  // User keys
  user: (userId: string) => `user:${userId}`,
  userProjects: (userId: string) => `user:${userId}:projects`,

  // Project keys
  project: (projectId: string) => `project:${projectId}`,
  projectScenes: (projectId: string) => `project:${projectId}:scenes`,
  projectCharacters: (projectId: string) => `project:${projectId}:characters`,
  projectMetrics: (projectId: string) => `project:${projectId}:metrics`,

  // Scene keys
  scene: (sceneId: string) => `scene:${sceneId}`,
  sceneContent: (sceneId: string) => `scene:${sceneId}:content`,

  // Character keys
  character: (characterId: string) => `character:${characterId}`,
  characterProfile: (characterId: string) => `character:${characterId}:profile`,

  // Agent keys
  agentResult: (taskId: string) => `agent:result:${taskId}`,
  agentStatus: (agentId: string) => `agent:status:${agentId}`,

  // Quality keys
  qualityDashboard: (projectId: string) => `quality:${projectId}:dashboard`,
  qualityDepartment: (projectId: string, deptId: string) =>
    `quality:${projectId}:dept:${deptId}`,

  // System keys
  systemHealth: () => 'system:health',
  systemMetrics: () => 'system:metrics',
}

/**
 * Invalidation strategies
 */
export const InvalidationRules = {
  // When project is updated
  onProjectUpdate: (projectId: string): string[] => [
    CacheKeys.project(projectId),
    CacheKeys.projectScenes(projectId),
    CacheKeys.projectCharacters(projectId),
    CacheKeys.projectMetrics(projectId),
    `quality:${projectId}:*`,
  ],

  // When scene is updated
  onSceneUpdate: (sceneId: string, projectId: string): string[] => [
    CacheKeys.scene(sceneId),
    CacheKeys.sceneContent(sceneId),
    CacheKeys.projectScenes(projectId),
    CacheKeys.projectMetrics(projectId),
  ],

  // When character is updated
  onCharacterUpdate: (characterId: string, projectId: string): string[] => [
    CacheKeys.character(characterId),
    CacheKeys.characterProfile(characterId),
    CacheKeys.projectCharacters(projectId),
  ],

  // When quality metrics are updated
  onQualityUpdate: (projectId: string): string[] => [
    CacheKeys.qualityDashboard(projectId),
    `quality:${projectId}:dept:*`,
    CacheKeys.projectMetrics(projectId),
  ],

  // When user is updated
  onUserUpdate: (userId: string): string[] => [
    CacheKeys.user(userId),
    CacheKeys.userProjects(userId),
  ],
}

/**
 * Cache warming strategies
 */
export const WarmingStrategies = {
  // Warm project data on access
  async warmProject(projectId: string, cache: any): Promise<void> {
    // This would fetch and cache project data
    // Implementation would depend on data access layer
    console.log(`Warming cache for project ${projectId}`)
  },

  // Warm user data on login
  async warmUser(userId: string, cache: any): Promise<void> {
    console.log(`Warming cache for user ${userId}`)
  },

  // Warm quality dashboard on department access
  async warmQualityDashboard(projectId: string, cache: any): Promise<void> {
    console.log(`Warming quality dashboard cache for project ${projectId}`)
  },
}

/**
 * Helper to invalidate cache by patterns
 */
export async function invalidateByRules(
  cache: any,
  rules: string[],
): Promise<{ invalidated: number }> {
  let total = 0

  for (const pattern of rules) {
    if (pattern.includes('*')) {
      // Pattern-based invalidation
      const count = await cache.invalidate(pattern)
      total += count
    } else {
      // Direct key invalidation
      await cache.delete(pattern)
      total++
    }
  }

  return { invalidated: total }
}

/**
 * Helper to get TTL for entity type
 */
export function getTTL(entityType: keyof typeof TTL_CONFIG): number {
  return TTL_CONFIG[entityType] || TTL_CONFIG.static
}
