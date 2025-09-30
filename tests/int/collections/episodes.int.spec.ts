import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getTestPayload, cleanupTestData } from '../../utils/payload-helper'
import { createTestUser, createTestProject } from '../../fixtures/projects.fixture'
import type { Payload } from 'payload'

describe('Episodes Collection Integration Tests', () => {
  let payload: Payload
  let testProjectId: string

  beforeAll(async () => {
    payload = await getTestPayload()

    // Create test user and project
    const testUser = await payload.create({
      collection: 'users',
      data: createTestUser(),
    })

    const testProject = await payload.create({
      collection: 'projects',
      data: createTestProject({
        owner: testUser.id,
        type: 'series',
      }),
    })

    testProjectId = testProject.id
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  it('creates episode with project relationship', async () => {
    const episode = await payload.create({
      collection: 'episodes',
      data: {
        name: 'Test Episode',
        project: testProjectId,
        episodeNumber: 1,
      },
    })

    expect(episode.name).toBe('Test Episode')
    expect(episode.project).toBe(testProjectId)
    expect(episode.episodeNumber).toBe(1)
  })

  it('validates episode numbering', async () => {
    const episode = await payload.create({
      collection: 'episodes',
      data: {
        name: 'Episode 5',
        project: testProjectId,
        episodeNumber: 5,
      },
    })

    expect(episode.episodeNumber).toBe(5)
  })

  it('stores season number (optional)', async () => {
    const episode = await payload.create({
      collection: 'episodes',
      data: {
        name: 'Season 2 Episode 1',
        project: testProjectId,
        episodeNumber: 1,
        seasonNumber: 2,
      },
    })

    expect(episode.seasonNumber).toBe(2)
  })

  it('validates episode status transitions', async () => {
    const episode = await payload.create({
      collection: 'episodes',
      data: {
        name: 'Status Test',
        project: testProjectId,
        episodeNumber: 10,
        status: 'outlined',
      },
    })

    const updated = await payload.update({
      collection: 'episodes',
      id: episode.id,
      data: {
        status: 'scripted',
      },
    })

    expect(updated.status).toBe('scripted')
  })

  it('queries episodes by project', async () => {
    await payload.create({
      collection: 'episodes',
      data: {
        name: 'Episode 1',
        project: testProjectId,
        episodeNumber: 1,
      },
    })

    await payload.create({
      collection: 'episodes',
      data: {
        name: 'Episode 2',
        project: testProjectId,
        episodeNumber: 2,
      },
    })

    const result = await payload.find({
      collection: 'episodes',
      where: {
        project: {
          equals: testProjectId,
        },
      },
    })

    expect(result.docs.length).toBeGreaterThanOrEqual(2)
  })

  it('queries episodes by episode number', async () => {
    await payload.create({
      collection: 'episodes',
      data: {
        name: 'Query Test Episode',
        project: testProjectId,
        episodeNumber: 99,
      },
    })

    const result = await payload.find({
      collection: 'episodes',
      where: {
        episodeNumber: {
          equals: 99,
        },
      },
    })

    expect(result.docs.some(e => e.name === 'Query Test Episode')).toBe(true)
  })

  it('updates episode content', async () => {
    const episode = await payload.create({
      collection: 'episodes',
      data: {
        name: 'Update Test',
        project: testProjectId,
        episodeNumber: 20,
      },
    })

    const updated = await payload.update({
      collection: 'episodes',
      id: episode.id,
      data: {
        synopsis: 'Updated episode synopsis',
        targetLength: 45,
      },
    })

    expect(updated.synopsis).toBe('Updated episode synopsis')
    expect(updated.targetLength).toBe(45)
  })

  it('deletes episode', async () => {
    const episode = await payload.create({
      collection: 'episodes',
      data: {
        name: 'Delete Test',
        project: testProjectId,
        episodeNumber: 999,
      },
    })

    await payload.delete({
      collection: 'episodes',
      id: episode.id,
    })

    const result = await payload.findByID({
      collection: 'episodes',
      id: episode.id,
    }).catch(() => null)

    expect(result).toBeNull()
  })
})