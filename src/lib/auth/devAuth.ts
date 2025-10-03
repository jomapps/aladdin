/**
 * Development Authentication Helper
 *
 * Provides consistent authentication handling for development mode.
 * In development, automatically logs in as the first user in the database.
 */

import { getPayload } from 'payload'
import type { Payload } from 'payload'
import type { NextRequest } from 'next/server'

export interface AuthResult {
  userId: string | null
  isDevMode: boolean
}

// Cache the first user ID to avoid repeated database queries
let cachedDevUserId: string | null = null

/**
 * Get the first user from the database for development mode auto-login
 *
 * @param payload - PayloadCMS instance
 * @returns First user's ID or null if no users exist
 */
async function getFirstUser(payload: Payload): Promise<string | null> {
  // Return cached value if available
  if (cachedDevUserId) {
    return cachedDevUserId
  }

  try {
    const users = await payload.find({
      collection: 'users',
      limit: 1,
      sort: 'createdAt', // Get the oldest user (likely admin)
    })

    if (users.docs.length > 0) {
      cachedDevUserId = users.docs[0].id
      console.log('[DevAuth] Auto-login as first user:', users.docs[0].email || cachedDevUserId)
      return cachedDevUserId
    }

    console.warn('[DevAuth] No users found in database. Run `pnpm db:seed` to create users.')
    return null
  } catch (error) {
    console.error('[DevAuth] Failed to fetch first user:', error)
    return null
  }
}

/**
 * Authenticate user or auto-login in development mode
 *
 * In development mode:
 * - Automatically logs in as the first user in the database
 * - Returns valid user ID for relationships
 * - Skips authentication checks
 *
 * In production mode:
 * - Validates user session
 * - Returns actual user ID
 *
 * @param request - Next.js request object
 * @param payload - PayloadCMS instance
 * @returns AuthResult with userId and dev mode flag
 */
export async function authenticateRequest(
  request: NextRequest,
  payload: Payload,
): Promise<AuthResult> {
  const isDevMode = process.env.NODE_ENV === 'development'

  if (isDevMode) {
    // Auto-login as first user in development
    const userId = await getFirstUser(payload)

    if (!userId) {
      console.warn('[DevAuth] Development mode but no users available')
    }

    return {
      userId,
      isDevMode: true,
    }
  }

  // Production mode - require authentication
  const { user } = await payload.auth({ req: request as any })

  return {
    userId: user?.id || null,
    isDevMode: false,
  }
}

/**
 * Validate that a string is a valid MongoDB ObjectId
 *
 * @param id - String to validate
 * @returns true if valid ObjectId format (24 hex characters)
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/**
 * Validate and sanitize an ObjectId for use in relationships
 *
 * @param id - ID to validate
 * @param fieldName - Name of field for logging
 * @returns Valid ObjectId or undefined
 */
export function validateObjectId(
  id: string | null | undefined,
  fieldName: string,
): string | undefined {
  if (!id) {
    return undefined
  }

  if (!isValidObjectId(id)) {
    console.warn(`[DevAuth] Invalid ${fieldName} format:`, id)
    return undefined
  }

  return id
}
