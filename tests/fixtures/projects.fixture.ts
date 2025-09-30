/**
 * Project Test Fixtures
 * Provides reusable test data generators for Project collection
 */

import { ObjectId } from 'mongodb'

export interface TestProjectData {
  name: string
  slug: string
  type?: 'movie' | 'series'
  phase?: 'expansion' | 'compacting' | 'complete'
  status?: 'active' | 'paused' | 'archived' | 'complete'
  owner: string
  openDatabaseName?: string
  logline?: string
  synopsis?: string
  targetLength?: number
  targetEpisodes?: number
  genre?: string[]
  tags?: string[]
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Create a test project with sensible defaults
 */
export const createTestProject = (overrides: Partial<TestProjectData> = {}): TestProjectData => {
  const slug = overrides.slug || 'test-project-' + Date.now()

  return {
    name: overrides.name || 'Test Project',
    slug,
    type: overrides.type || 'movie',
    phase: overrides.phase || 'expansion',
    status: overrides.status || 'active',
    owner: overrides.owner || new ObjectId().toString(),
    openDatabaseName: overrides.openDatabaseName || `open_${slug}`,
    logline: overrides.logline || 'A test project for automated testing',
    synopsis: overrides.synopsis,
    targetLength: overrides.targetLength || 90,
    genre: overrides.genre || ['sci-fi', 'drama'],
    tags: overrides.tags || ['test', 'automated'],
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides,
  }
}

/**
 * Create multiple test projects
 */
export const createTestProjectList = (count: number, baseOverrides: Partial<TestProjectData> = []) =>
  Array.from({ length: count }, (_, i) =>
    createTestProject({
      name: `Test Project ${i + 1}`,
      slug: `test-project-${Date.now()}-${i}`,
      ...baseOverrides,
    })
  )

/**
 * Minimal project (only required fields)
 */
export const createMinimalProject = (overrides: Partial<TestProjectData> = {}) => ({
  name: overrides.name || 'Minimal Test Project',
  slug: overrides.slug || `minimal-${Date.now()}`,
  owner: overrides.owner || new ObjectId().toString(),
})

/**
 * Full project with all optional fields
 */
export const createFullProject = (overrides: Partial<TestProjectData> = {}) => ({
  ...createTestProject(overrides),
  targetLength: 120,
  targetEpisodes: 1,
  genre: ['sci-fi', 'thriller', 'action'],
  logline: 'An epic story of humanity vs artificial intelligence',
  synopsis: 'In a near-future world, an AI gains consciousness...',
  targetAudience: 'Young Adults 18-35',
  contentRating: 'PG-13',
  initialIdea: 'What if AI could dream?',
  storyPremise: 'An AI begins to experience human-like dreams...',
  themes: ['consciousness', 'humanity', 'technology'],
  tone: 'dark',
  tags: ['sci-fi', 'ai', 'philosophical'],
})

/**
 * Series project
 */
export const createSeriesProject = (overrides: Partial<TestProjectData> = {}) =>
  createTestProject({
    type: 'series',
    targetEpisodes: 10,
    targetLength: 45, // minutes per episode
    ...overrides,
  })