/**
 * Brain Service Constants
 * Shared constants for Brain service integration
 */

/**
 * DEPRECATED: Use userId instead for GLOBAL context
 *
 * Brain project_id strategy:
 * - GLOBAL (no project): userId
 * - Project-specific: userId-projectId
 *
 * @deprecated This constant is no longer used. Brain service uses:
 *   - userId for global chat context
 *   - userId-projectId for project-specific chat context
 */
export const GLOBAL_PROJECT_ID = 'global'

/**
 * Default similarity threshold for semantic search
 */
export const DEFAULT_SIMILARITY_THRESHOLD = 0.6

/**
 * Default limit for search results
 */
export const DEFAULT_SEARCH_LIMIT = 10
