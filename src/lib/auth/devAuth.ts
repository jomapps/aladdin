/**
 * Development Authentication Helper
 * 
 * Provides consistent authentication handling for development mode.
 * In development, authentication is bypassed and user relationships are optional.
 */

import { getPayload } from 'payload'
import type { Payload } from 'payload'
import type { NextRequest } from 'next/server'

export interface AuthResult {
  userId: string | null
  isDevMode: boolean
}

/**
 * Authenticate user or bypass in development mode
 * 
 * In development mode:
 * - Returns null userId (no user relationship)
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
  payload: Payload
): Promise<AuthResult> {
  const isDevMode = process.env.NODE_ENV === 'development'

  if (isDevMode) {
    console.log('[DevAuth] Development mode - bypassing authentication')
    return {
      userId: null, // No user relationship in dev mode
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
export function validateObjectId(id: string | null | undefined, fieldName: string): string | undefined {
  if (!id) {
    return undefined
  }

  if (!isValidObjectId(id)) {
    console.warn(`[DevAuth] Invalid ${fieldName} format:`, id)
    return undefined
  }

  return id
}

