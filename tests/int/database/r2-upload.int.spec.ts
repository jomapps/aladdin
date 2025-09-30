import { describe, it, expect, beforeAll } from 'vitest'
import { getTestPayload, cleanupTestData } from '../../utils/payload-helper'
import { createMockImageFile } from '../../utils/mock-r2'
import type { Payload } from 'payload'

describe('R2 Media Upload Integration Tests', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  it('uploads file with metadata', async () => {
    const mockFile = createMockImageFile('test-image.jpg')

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Test Image',
        caption: 'Test caption',
      },
      file: mockFile,
    })

    expect(media.filename).toBe('test-image.jpg')
    expect(media.alt).toBe('Test Image')
    expect(media.caption).toBe('Test caption')
    expect(media.url).toBeTruthy()
  })

  it('stores file metadata', async () => {
    const mockFile = createMockImageFile('metadata-test.jpg')

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Metadata Test',
      },
      file: mockFile,
    })

    expect(media.mimeType).toBeTruthy()
    expect(media.filesize).toBeGreaterThan(0)
    expect(media.width).toBeTruthy()
    expect(media.height).toBeTruthy()
  })

  it('links media to project', async () => {
    // Create test project first
    const testUser = await payload.create({
      collection: 'users',
      data: {
        email: `media-test-${Date.now()}@example.com`,
        password: 'test123456',
      },
    })

    const testProject = await payload.create({
      collection: 'projects',
      data: {
        name: `Media Test Project ${Date.now()}`,
        owner: testUser.id,
      },
    })

    const mockFile = createMockImageFile('project-media.jpg')

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Project Media',
        project: testProject.id,
      },
      file: mockFile,
    })

    expect(media.project).toBe(testProject.id)
  })

  it('stores linked document metadata', async () => {
    const mockFile = createMockImageFile('linked-doc.jpg')

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Linked Document',
        linkedDocument: {
          database: 'open_test-project',
          collection: 'characters',
          documentId: '507f1f77bcf86cd799439011',
          field: 'profileImage',
        },
      },
      file: mockFile,
    })

    expect(media.linkedDocument?.database).toBe('open_test-project')
    expect(media.linkedDocument?.collection).toBe('characters')
    expect(media.linkedDocument?.documentId).toBe('507f1f77bcf86cd799439011')
  })

  it('stores generation metadata', async () => {
    const mockFile = createMockImageFile('generated-image.jpg')

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Generated Image',
        generatedBy: {
          agent: 'image-generator',
          prompt: 'A futuristic cityscape at sunset',
          model: 'fal-ai/flux-pro/v1.1',
        },
      },
      file: mockFile,
    })

    expect(media.generatedBy?.agent).toBe('image-generator')
    expect(media.generatedBy?.prompt).toBeTruthy()
    expect(media.generatedBy?.model).toBe('fal-ai/flux-pro/v1.1')
  })

  it('queries media by project', async () => {
    // Create test project
    const testUser = await payload.create({
      collection: 'users',
      data: {
        email: `query-test-${Date.now()}@example.com`,
        password: 'test123456',
      },
    })

    const testProject = await payload.create({
      collection: 'projects',
      data: {
        name: `Query Test Project ${Date.now()}`,
        owner: testUser.id,
      },
    })

    // Create multiple media items
    const mockFile1 = createMockImageFile('query-1.jpg')
    const mockFile2 = createMockImageFile('query-2.jpg')

    await payload.create({
      collection: 'media',
      data: { alt: 'Query 1', project: testProject.id },
      file: mockFile1,
    })

    await payload.create({
      collection: 'media',
      data: { alt: 'Query 2', project: testProject.id },
      file: mockFile2,
    })

    const result = await payload.find({
      collection: 'media',
      where: {
        project: {
          equals: testProject.id,
        },
      },
    })

    expect(result.docs.length).toBeGreaterThanOrEqual(2)
  })

  it('deletes media', async () => {
    const mockFile = createMockImageFile('delete-test.jpg')

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Delete Test',
      },
      file: mockFile,
    })

    await payload.delete({
      collection: 'media',
      id: media.id,
    })

    const result = await payload.findByID({
      collection: 'media',
      id: media.id,
    }).catch(() => null)

    expect(result).toBeNull()
  })
})