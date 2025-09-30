import { MongoClient, Db, Collection } from 'mongodb'

/**
 * Open Database Manager
 * Manages per-project MongoDB databases for flexible content storage
 */
class OpenDatabaseManager {
  private client: MongoClient
  private isConnected: boolean = false

  constructor() {
    const uri = process.env.DATABASE_URI_OPEN || process.env.DATABASE_URI || 'mongodb://localhost:27017'
    this.client = new MongoClient(uri)
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect()
      this.isConnected = true
      console.log('✅ Connected to Open MongoDB')
    }
  }

  /**
   * Get database for a specific project
   * Database name format: open_[project-slug]
   */
  async getProjectDatabase(projectSlug: string): Promise<Db> {
    await this.connect()
    const dbName = `open_${projectSlug}`
    return this.client.db(dbName)
  }

  /**
   * Create a new collection with base schema validation
   */
  async createCollection(
    projectSlug: string,
    collectionName: string
  ): Promise<Collection> {
    const db = await this.getProjectDatabase(projectSlug)

    // Check if collection exists
    const collections = await db.listCollections({ name: collectionName }).toArray()
    if (collections.length > 0) {
      return db.collection(collectionName)
    }

    // Create with base validation (only name and projectId required)
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'projectId'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'Name is required'
            },
            projectId: {
              bsonType: 'string',
              description: 'Project ID binding is required'
            },
            collectionName: { bsonType: 'string' },
            version: { bsonType: 'number' },
            createdBy: { bsonType: 'string' },
            createdByType: {
              bsonType: 'string',
              enum: ['user', 'agent']
            },
            qualityRating: {
              bsonType: 'number',
              minimum: 0,
              maximum: 1
            },
            brainValidated: { bsonType: 'bool' },
            userApproved: { bsonType: 'bool' },
            content: {
              bsonType: 'object',
              description: 'Flexible content structure'
            }
          }
        }
      }
    })

    console.log(`✅ Created collection: ${collectionName} in open_${projectSlug}`)
    return db.collection(collectionName)
  }

  /**
   * Get or create a collection
   */
  async getCollection(
    projectSlug: string,
    collectionName: string
  ): Promise<Collection> {
    const db = await this.getProjectDatabase(projectSlug)

    // Check if exists
    const collections = await db.listCollections({ name: collectionName }).toArray()
    if (collections.length === 0) {
      return this.createCollection(projectSlug, collectionName)
    }

    return db.collection(collectionName)
  }

  /**
   * List all collections for a project
   */
  async listProjectCollections(projectSlug: string): Promise<string[]> {
    const db = await this.getProjectDatabase(projectSlug)
    const collections = await db.listCollections().toArray()
    return collections.map(c => c.name).filter(name => !name.startsWith('system.'))
  }

  /**
   * Delete a collection
   */
  async deleteCollection(projectSlug: string, collectionName: string): Promise<void> {
    const db = await this.getProjectDatabase(projectSlug)
    await db.dropCollection(collectionName)
    console.log(`🗑️  Deleted collection: ${collectionName} from open_${projectSlug}`)
  }

  /**
   * Delete entire project database
   */
  async deleteProjectDatabase(projectSlug: string): Promise<void> {
    await this.connect()
    const dbName = `open_${projectSlug}`
    await this.client.db(dbName).dropDatabase()
    console.log(`🗑️  Deleted database: ${dbName}`)
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.close()
      this.isConnected = false
      console.log('🔌 Disconnected from Open MongoDB')
    }
  }
}

// Singleton instance
export const openDB = new OpenDatabaseManager()

// Helper functions for easy access
export async function getOpenDatabase(projectSlug: string): Promise<Db> {
  return openDB.getProjectDatabase(projectSlug)
}

export async function getOpenCollection(
  projectSlug: string,
  collectionName: string
): Promise<Collection> {
  return openDB.getCollection(projectSlug, collectionName)
}

export async function createOpenCollection(
  projectSlug: string,
  collectionName: string
): Promise<Collection> {
  return openDB.createCollection(projectSlug, collectionName)
}

export async function listOpenCollections(projectSlug: string): Promise<string[]> {
  return openDB.listProjectCollections(projectSlug)
}

export async function deleteOpenCollection(
  projectSlug: string,
  collectionName: string
): Promise<void> {
  return openDB.deleteCollection(projectSlug, collectionName)
}

export async function deleteOpenDatabase(projectSlug: string): Promise<void> {
  return openDB.deleteProjectDatabase(projectSlug)
}