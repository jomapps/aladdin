/**
 * PayloadCMS Test Helper
 * Manages PayloadCMS instance and provides cleanup utilities
 */

import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

let cachedPayload: Payload | null = null

/**
 * Get PayloadCMS instance (cached for performance)
 */
export async function getTestPayload(): Promise<Payload> {
  if (cachedPayload) return cachedPayload

  const payloadConfig = await config
  cachedPayload = await getPayload({ config: payloadConfig })

  return cachedPayload
}

/**
 * Clean up all test data from collections
 * Called in afterAll hooks to ensure clean state
 */
export async function cleanupTestData(): Promise<void> {
  const payload = await getTestPayload()

  // Delete test projects (identified by slug starting with 'test-' or 'minimal-')
  await payload.delete({
    collection: 'projects',
    where: {
      or: [
        { slug: { like: 'test-%' } },
        { slug: { like: 'minimal-%' } },
      ],
    },
  })

  // Delete test users (identified by email domain)
  await payload.delete({
    collection: 'users',
    where: {
      email: { like: '%@test.example.com' },
    },
  })

  // Delete test episodes
  await payload.delete({
    collection: 'episodes',
    where: {
      name: { like: 'Test Episode%' },
    },
  })

  // Delete test conversations
  await payload.delete({
    collection: 'conversations',
    where: {
      name: { like: 'Test Conversation%' },
    },
  })

  // Delete test workflows
  await payload.delete({
    collection: 'workflows',
    where: {
      name: { like: 'Test Workflow%' },
    },
  })

  // Delete test media
  await payload.delete({
    collection: 'media',
    where: {
      filename: { like: 'test-%' },
    },
  })
}

/**
 * Create a test user for authentication tests
 */
export async function createTestUser(overrides: {
  email?: string
  password?: string
  name?: string
} = {}) {
  const payload = await getTestPayload()

  const email = overrides.email || `test-${Date.now()}@test.example.com`
  const password = overrides.password || 'TestPassword123!'
  const name = overrides.name || 'Test User'

  const user = await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      name,
    },
  })

  return { user, email, password }
}

/**
 * Login test user and return authentication token
 */
export async function loginTestUser(email: string, password: string) {
  const payload = await getTestPayload()

  const result = await payload.login({
    collection: 'users',
    data: {
      email,
      password,
    },
  })

  return result
}

/**
 * Wait for operation to complete (for async hooks)
 */
export async function waitForOperation(ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}