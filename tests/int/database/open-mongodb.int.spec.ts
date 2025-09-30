/**
 * Open MongoDB Database Integration Tests
 * Tests per-project open database functionality
 */

import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { MongoClient, Db, Collection } from 'mongodb'

// Utility functions to create (will be in src/lib/db/openDatabase.ts)
const mongoClient = new MongoClient(
  process.env.DATABASE_URI_OPEN || 'mongodb://localhost:27017'
)

let isConnected = false

async function getOpenDatabase(projectSlug: string): Promise<Db> {
  if (!isConnected) {
    await mongoClient.connect()
    isConnected = true
  }

  const dbName = `open_${projectSlug}`
  return mongoClient.db(dbName)
}

async function createCollection(
  projectSlug: string,
  collectionName: string
): Promise<Collection> {
  const db = await getOpenDatabase(projectSlug)

  // Create collection with validation
  await db.createCollection(collectionName, {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'projectId'],
        properties: {
          name: { bsonType: 'string' },
          projectId: { bsonType: 'string' },
          content: { bsonType: 'object' },
        },
      },
    },
  })

  return db.collection(collectionName)
}

describe('Open MongoDB Database', () => {
  const testSlug = `test-open-${Date.now()}`
  let testDb: Db

  beforeAll(async () => {
    testDb = await getOpenDatabase(testSlug)
  })

  afterAll(async () => {
    // Clean up test databases
    await testDb.dropDatabase()
    await mongoClient.close()
  })

  describe('Database Creation', () => {
    it('should create project-specific database', async () => {
      const db = await getOpenDatabase(testSlug)

      expect(db).toBeDefined()
      expect(db.databaseName).toBe(`open_${testSlug}`)
    })

    it('should follow naming convention open_[slug]', async () => {
      const customSlug = 'cyber-detective-2099'
      const db = await getOpenDatabase(customSlug)

      expect(db.databaseName).toBe('open_cyber-detective-2099')

      // Cleanup
      await db.dropDatabase()
    })

    it('should isolate databases by project', async () => {
      const slug1 = `isolation-test-1-${Date.now()}`
      const slug2 = `isolation-test-2-${Date.now()}`

      const db1 = await getOpenDatabase(slug1)
      const db2 = await getOpenDatabase(slug2)

      expect(db1.databaseName).not.toBe(db2.databaseName)

      // Cleanup
      await db1.dropDatabase()
      await db2.dropDatabase()
    })
  })

  describe('Collection Creation', () => {
    it('should create collection with validation schema', async () => {
      const collection = await createCollection(testSlug, 'characters')

      expect(collection).toBeDefined()
      expect(collection.collectionName).toBe('characters')
    })

    it('should enforce required fields', async () => {
      const collection = await createCollection(testSlug, 'test_required')

      // Try to insert document without required fields
      await expect(
        collection.insertOne({ invalid: 'data' } as any)
      ).rejects.toThrow()
    })

    it('should allow document with required fields', async () => {
      const collection = await createCollection(testSlug, 'test_valid')

      const result = await collection.insertOne({
        name: 'Test Character',
        projectId: 'proj_123',
        content: { description: 'A test character' },
      })

      expect(result.acknowledged).toBe(true)
      expect(result.insertedId).toBeDefined()
    })
  })

  describe('Document Operations', () => {
    let charactersCollection: Collection

    beforeAll(async () => {
      charactersCollection = await createCollection(testSlug, 'characters_crud')
    })

    it('should insert document with flexible content', async () => {
      const character = {
        name: 'John Doe',
        projectId: 'proj_456',
        content: {
          age: 30,
          role: 'protagonist',
          backstory: 'A mysterious detective...',
          customField: 'Any data structure',
          nested: {
            deep: {
              data: ['array', 'of', 'values'],
            },
          },
        },
      }

      const result = await charactersCollection.insertOne(character)

      expect(result.acknowledged).toBe(true)
      expect(result.insertedId).toBeDefined()
    })

    it('should query documents by projectId', async () => {
      const projectId = 'proj_query_test'

      // Insert multiple documents
      await charactersCollection.insertMany([
        { name: 'Character 1', projectId, content: {} },
        { name: 'Character 2', projectId, content: {} },
        { name: 'Character 3', projectId, content: {} },
      ])

      const results = await charactersCollection.find({ projectId }).toArray()

      expect(results.length).toBeGreaterThanOrEqual(3)
      results.forEach((doc) => {
        expect(doc.projectId).toBe(projectId)
      })
    })

    it('should update document', async () => {
      const inserted = await charactersCollection.insertOne({
        name: 'Update Test',
        projectId: 'proj_update',
        content: { status: 'draft' },
      })

      const updateResult = await charactersCollection.updateOne(
        { _id: inserted.insertedId },
        { $set: { 'content.status': 'final' } }
      )

      expect(updateResult.modifiedCount).toBe(1)

      const updated = await charactersCollection.findOne({ _id: inserted.insertedId })
      expect(updated?.content.status).toBe('final')
    })

    it('should delete document', async () => {
      const inserted = await charactersCollection.insertOne({
        name: 'Delete Test',
        projectId: 'proj_delete',
        content: {},
      })

      const deleteResult = await charactersCollection.deleteOne({
        _id: inserted.insertedId,
      })

      expect(deleteResult.deletedCount).toBe(1)

      const found = await charactersCollection.findOne({ _id: inserted.insertedId })
      expect(found).toBeNull()
    })
  })

  describe('Flexible Content Structure', () => {
    it('should store character with full content structure', async () => {
      const collection = await createCollection(testSlug, 'characters_full')

      const character = {
        name: 'Sarah Connor',
        projectId: 'terminator_proj',
        content: {
          fullName: 'Sarah Jeanette Connor',
          age: 29,
          role: 'protagonist',
          personalityTraits: ['brave', 'protective', 'resilient'],
          backstory: 'A waitress turned warrior...',
          appearance: {
            height: '5\'7"',
            hairColor: 'brown',
            eyeColor: 'blue',
          },
          relationships: [
            {
              characterId: 'kyle_reese',
              type: 'romantic',
              description: 'Future father of her son',
            },
          ],
        },
      }

      const result = await collection.insertOne(character)
      expect(result.acknowledged).toBe(true)

      const found = await collection.findOne({ _id: result.insertedId })
      expect(found?.name).toBe('Sarah Connor')
      expect(found?.content.personalityTraits).toEqual(['brave', 'protective', 'resilient'])
      expect(found?.content.appearance.height).toBe('5\'7"')
    })

    it('should store scene with cinematography details', async () => {
      const collection = await createCollection(testSlug, 'scenes')

      const scene = {
        name: 'Opening Chase',
        projectId: 'action_movie',
        content: {
          sceneNumber: '1A',
          locationName: 'Downtown LA Streets',
          timeOfDay: 'night',
          description: 'High-speed chase through city...',
          charactersPresent: [
            { characterId: 'hero', role: 'main' },
            { characterId: 'villain', role: 'main' },
          ],
          visualMood: 'tense',
          lighting: 'neon-lit streets',
          cameraAngles: ['low angle', 'tracking shot', 'aerial'],
          estimatedDuration: 180,
        },
      }

      const result = await collection.insertOne(scene)
      expect(result.acknowledged).toBe(true)

      const found = await collection.findOne({ _id: result.insertedId })
      expect(found?.content.cameraAngles).toContain('aerial')
      expect(found?.content.estimatedDuration).toBe(180)
    })
  })

  describe('Error Handling', () => {
    it('should handle duplicate collection creation gracefully', async () => {
      const collectionName = 'duplicate_test'

      // Create first time
      await createCollection(testSlug, collectionName)

      // Try to create again - should handle error
      await expect(createCollection(testSlug, collectionName)).rejects.toThrow()
    })

    it('should handle invalid database names', async () => {
      await expect(getOpenDatabase('')).rejects.toThrow()
    })
  })
})