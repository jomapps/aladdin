/**
 * Projects Collection Integration Tests
 * Tests PayloadCMS Projects collection CRUD operations
 */

import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { Payload } from 'payload'
import { getTestPayload, cleanupTestData, createTestUser } from '../../utils/payload-helper'
import { createTestProject, createMinimalProject, createFullProject } from '../../fixtures/projects.fixture'

describe('Projects Collection', () => {
  let payload: Payload
  let testUserId: string

  beforeAll(async () => {
    payload = await getTestPayload()

    // Create test user for ownership
    const { user } = await createTestUser()
    testUserId = user.id
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('Create Operations', () => {
    it('should create project with required fields only', async () => {
      const projectData = createMinimalProject({ owner: testUserId })

      const project = await payload.create({
        collection: 'projects',
        data: projectData,
      })

      expect(project).toBeDefined()
      expect(project.id).toBeDefined()
      expect(project.name).toBe(projectData.name)
      expect(project.slug).toBe(projectData.slug)
      expect(project.owner).toBe(testUserId)
    })

    it('should auto-generate openDatabaseName from slug', async () => {
      const projectData = createTestProject({ owner: testUserId, slug: 'auto-db-test' })

      const project = await payload.create({
        collection: 'projects',
        data: projectData,
      })

      expect(project.openDatabaseName).toBe('open_auto-db-test')
    })

    it('should create project with full metadata', async () => {
      const projectData = createFullProject({ owner: testUserId })

      const project = await payload.create({
        collection: 'projects',
        data: projectData,
      })

      expect(project.id).toBeDefined()
      expect(project.logline).toBe(projectData.logline)
      expect(project.synopsis).toBe(projectData.synopsis)
      expect(project.genre).toEqual(projectData.genre)
      expect(project.themes).toEqual(projectData.themes)
      expect(project.tone).toBe(projectData.tone)
    })

    it('should enforce unique slug constraint', async () => {
      const slug = `unique-slug-${Date.now()}`
      const projectData1 = createTestProject({ owner: testUserId, slug })

      // Create first project
      await payload.create({
        collection: 'projects',
        data: projectData1,
      })

      // Try to create second project with same slug
      const projectData2 = createTestProject({ owner: testUserId, slug })

      await expect(
        payload.create({
          collection: 'projects',
          data: projectData2,
        })
      ).rejects.toThrow()
    })

    it('should validate project type enum', async () => {
      const projectData = createTestProject({ owner: testUserId })

      const project = await payload.create({
        collection: 'projects',
        data: projectData,
      })

      expect(project.type).toMatch(/^(movie|series)$/)
    })

    it('should validate project phase enum', async () => {
      const projectData = createTestProject({ owner: testUserId, phase: 'compacting' })

      const project = await payload.create({
        collection: 'projects',
        data: projectData,
      })

      expect(project.phase).toMatch(/^(expansion|compacting|complete)$/)
    })
  })

  describe('Read Operations', () => {
    it('should query projects by owner', async () => {
      // Create multiple projects
      await payload.create({
        collection: 'projects',
        data: createTestProject({ owner: testUserId, name: 'Owner Query Test 1' }),
      })

      await payload.create({
        collection: 'projects',
        data: createTestProject({ owner: testUserId, name: 'Owner Query Test 2' }),
      })

      const result = await payload.find({
        collection: 'projects',
        where: {
          owner: { equals: testUserId },
        },
      })

      expect(result.docs.length).toBeGreaterThanOrEqual(2)
      result.docs.forEach((project) => {
        expect(project.owner).toBe(testUserId)
      })
    })

    it('should query projects by status', async () => {
      await payload.create({
        collection: 'projects',
        data: createTestProject({ owner: testUserId, status: 'paused' }),
      })

      const result = await payload.find({
        collection: 'projects',
        where: {
          status: { equals: 'paused' },
        },
      })

      result.docs.forEach((project) => {
        expect(project.status).toBe('paused')
      })
    })

    it('should find project by id', async () => {
      const created = await payload.create({
        collection: 'projects',
        data: createTestProject({ owner: testUserId }),
      })

      const found = await payload.findByID({
        collection: 'projects',
        id: created.id,
      })

      expect(found).toBeDefined()
      expect(found.id).toBe(created.id)
      expect(found.name).toBe(created.name)
    })
  })

  describe('Update Operations', () => {
    it('should update project metadata', async () => {
      const project = await payload.create({
        collection: 'projects',
        data: createTestProject({ owner: testUserId }),
      })

      const updated = await payload.update({
        collection: 'projects',
        id: project.id,
        data: {
          logline: 'Updated logline',
          phase: 'compacting',
        },
      })

      expect(updated.logline).toBe('Updated logline')
      expect(updated.phase).toBe('compacting')
    })

    it('should update project tags', async () => {
      const project = await payload.create({
        collection: 'projects',
        data: createTestProject({ owner: testUserId, tags: ['initial'] }),
      })

      const updated = await payload.update({
        collection: 'projects',
        id: project.id,
        data: {
          tags: ['updated', 'new-tag'],
        },
      })

      expect(updated.tags).toEqual(['updated', 'new-tag'])
    })
  })

  describe('Delete Operations', () => {
    it('should delete project by id', async () => {
      const project = await payload.create({
        collection: 'projects',
        data: createTestProject({ owner: testUserId }),
      })

      await payload.delete({
        collection: 'projects',
        id: project.id,
      })

      await expect(
        payload.findByID({
          collection: 'projects',
          id: project.id,
        })
      ).rejects.toThrow()
    })
  })

  describe('Relationships', () => {
    it('should bind project owner relationship', async () => {
      const project = await payload.create({
        collection: 'projects',
        data: createTestProject({ owner: testUserId }),
      })

      // Populate owner relationship
      const projectWithOwner = await payload.findByID({
        collection: 'projects',
        id: project.id,
        depth: 1,
      })

      expect(projectWithOwner.owner).toBeDefined()
      expect(typeof projectWithOwner.owner).toBe('object')
      expect((projectWithOwner.owner as any).id).toBe(testUserId)
    })
  })
})