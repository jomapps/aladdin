/**
 * Database Naming Utilities
 * Provides consistent database and collection naming conventions
 * across the three-tier database system (gather, qualified, open)
 */

/**
 * Database naming patterns:
 * - Gather: aladdin-gather-{projectId} (MongoDB UUID format)
 * - Qualified: qualified_{projectSlug} (URL-safe slug)
 * - Open: open_{projectSlug} (URL-safe slug)
 */

/**
 * Validates and sanitizes a project slug for database naming
 * Ensures slug is URL-safe and follows naming conventions
 */
export function validateProjectSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    throw new Error('Project slug is required and must be a string')
  }

  // Remove leading/trailing whitespace
  const trimmed = slug.trim()

  if (trimmed.length === 0) {
    throw new Error('Project slug cannot be empty')
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  const validSlugRegex = /^[a-z0-9][a-z0-9-_]*[a-z0-9]$/i

  if (!validSlugRegex.test(trimmed)) {
    throw new Error(
      'Project slug must contain only alphanumeric characters, hyphens, and underscores. ' +
      'It must start and end with an alphanumeric character.'
    )
  }

  // Check length constraints (MongoDB database names have max 64 chars)
  // We reserve space for prefix (e.g., "qualified_" is 10 chars)
  const maxSlugLength = 50
  if (trimmed.length > maxSlugLength) {
    throw new Error(`Project slug must be ${maxSlugLength} characters or less`)
  }

  // MongoDB database names cannot contain: /\. "$*<>:|?
  const invalidChars = /[/\\. "$*<>:|?]/
  if (invalidChars.test(trimmed)) {
    throw new Error('Project slug contains invalid characters for MongoDB database names')
  }

  return trimmed
}

/**
 * Validates a MongoDB project ID (ObjectId or UUID format)
 */
export function validateProjectId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error('Project ID is required and must be a string')
  }

  const trimmed = id.trim()

  if (trimmed.length === 0) {
    throw new Error('Project ID cannot be empty')
  }

  // Check for MongoDB ObjectId format (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/

  // Check for UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!objectIdRegex.test(trimmed) && !uuidRegex.test(trimmed)) {
    throw new Error('Project ID must be a valid MongoDB ObjectId or UUID')
  }

  return trimmed
}

/**
 * Generate gather database name from project ID
 * Format: aladdin-gather-{projectId}
 */
export function getGatherDatabaseName(projectId: string): string {
  const validId = validateProjectId(projectId)
  return `aladdin-gather-${validId}`
}

/**
 * Generate qualified database name from project slug
 * Format: qualified_{projectSlug}
 */
export function getQualifiedDatabaseName(projectSlug: string): string {
  const validSlug = validateProjectSlug(projectSlug)
  return `qualified_${validSlug}`
}

/**
 * Generate open database name from project slug
 * Format: open_{projectSlug}
 */
export function getOpenDatabaseName(projectSlug: string): string {
  const validSlug = validateProjectSlug(projectSlug)
  return `open_${validSlug}`
}

/**
 * Extract project slug from database name
 */
export function extractProjectSlugFromDbName(dbName: string): string | null {
  // Match qualified_{slug} or open_{slug} patterns
  const qualifiedMatch = dbName.match(/^qualified_(.+)$/)
  if (qualifiedMatch) {
    return qualifiedMatch[1]
  }

  const openMatch = dbName.match(/^open_(.+)$/)
  if (openMatch) {
    return openMatch[1]
  }

  return null
}

/**
 * Extract project ID from gather database name
 */
export function extractProjectIdFromGatherDb(dbName: string): string | null {
  const match = dbName.match(/^aladdin-gather-(.+)$/)
  return match ? match[1] : null
}

/**
 * Validate collection name for MongoDB
 */
export function validateCollectionName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Collection name is required and must be a string')
  }

  const trimmed = name.trim()

  if (trimmed.length === 0) {
    throw new Error('Collection name cannot be empty')
  }

  // MongoDB collection names cannot:
  // - Start with "system." (reserved)
  // - Contain $ (except for special cases)
  // - Be empty string
  // - Contain null character

  if (trimmed.startsWith('system.')) {
    throw new Error('Collection name cannot start with "system."')
  }

  if (trimmed.includes('$')) {
    throw new Error('Collection name cannot contain "$" character')
  }

  if (trimmed.includes('\0')) {
    throw new Error('Collection name cannot contain null character')
  }

  // Max collection name length in MongoDB is 255 bytes
  // We'll be conservative and limit to 100 characters
  if (trimmed.length > 100) {
    throw new Error('Collection name must be 100 characters or less')
  }

  return trimmed
}

/**
 * Generate a safe collection name from user input
 */
export function generateCollectionName(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Input is required for collection name generation')
  }

  // Convert to lowercase, replace spaces with hyphens
  let safeName = input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '') // Remove invalid characters
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

  if (safeName.length === 0) {
    throw new Error('Cannot generate valid collection name from input')
  }

  // Ensure it doesn't start with system.
  if (safeName.startsWith('system-')) {
    safeName = 'coll-' + safeName
  }

  // Limit length
  if (safeName.length > 100) {
    safeName = safeName.substring(0, 100)
  }

  return validateCollectionName(safeName)
}

/**
 * Check if a database name is a gather database
 */
export function isGatherDatabase(dbName: string): boolean {
  return dbName.startsWith('aladdin-gather-')
}

/**
 * Check if a database name is a qualified database
 */
export function isQualifiedDatabase(dbName: string): boolean {
  return dbName.startsWith('qualified_')
}

/**
 * Check if a database name is an open database
 */
export function isOpenDatabase(dbName: string): boolean {
  return dbName.startsWith('open_')
}

/**
 * Get database tier from name
 */
export function getDatabaseTier(dbName: string): 'gather' | 'qualified' | 'open' | 'unknown' {
  if (isGatherDatabase(dbName)) return 'gather'
  if (isQualifiedDatabase(dbName)) return 'qualified'
  if (isOpenDatabase(dbName)) return 'open'
  return 'unknown'
}

/**
 * Validate database tier and name combination
 */
export function validateDatabaseName(
  dbName: string,
  expectedTier: 'gather' | 'qualified' | 'open'
): boolean {
  const actualTier = getDatabaseTier(dbName)
  return actualTier === expectedTier
}
