/**
 * Gather Database Manager
 * Manages per-project MongoDB databases for unqualified content collection
 * Database name format: aladdin-gather-{projectId}
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb'

export interface AutomationMetadata {
  taskId: string
  department: string
  departmentName: string
  iteration: number
  qualityScore: number
  basedOnNodes: string[]
  model: string
}

export interface GatherItem {
  _id?: ObjectId
  projectId: string
  lastUpdated: Date
  content: string // JSON stringified content
  imageUrl?: string
  documentUrl?: string
  summary: string
  context: string
  extractedText?: string
  duplicateCheckScore?: number
  iterationCount?: number
  createdAt: Date
  createdBy: string
  isAutomated?: boolean
  automationMetadata?: AutomationMetadata
}

export interface GatherQueryOptions {
  page?: number
  limit?: number
  search?: string
  sort?: 'latest' | 'oldest' | 'a-z' | 'z-a'
  hasImage?: boolean
  hasDocument?: boolean
  isAutomated?: boolean
  department?: string
}

export interface GatherQueryResult {
  items: GatherItem[]
  total: number
  page: number
  pages: number
  hasMore: boolean
}

class GatherDatabaseManager {
  private client: MongoClient
  private isConnected: boolean = false

  constructor() {
    const uri =
      process.env.DATABASE_URI_OPEN || process.env.DATABASE_URI || 'mongodb://localhost:27017'
    this.client = new MongoClient(uri)
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect()
      this.isConnected = true
      console.log('✅ Connected to Gather MongoDB')
    }
  }

  /**
   * Get database for a specific project
   * Database name format: aladdin-gather-{projectId}
   */
  async getProjectDatabase(projectId: string): Promise<Db> {
    await this.connect()
    const dbName = `aladdin-gather-${projectId}`
    return this.client.db(dbName)
  }

  /**
   * Initialize gather collection with schema validation
   */
  async initializeGatherCollection(projectId: string): Promise<Collection<GatherItem>> {
    const db = await this.getProjectDatabase(projectId)

    // Check if collection exists
    const collections = await db.listCollections({ name: 'gather' }).toArray()

    if (collections.length === 0) {
      // Create collection with validation
      await db.createCollection('gather', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['projectId', 'content', 'summary', 'context', 'createdAt', 'createdBy'],
            properties: {
              projectId: { bsonType: 'string' },
              lastUpdated: { bsonType: 'date' },
              content: { bsonType: 'string' },
              imageUrl: { bsonType: 'string' },
              documentUrl: { bsonType: 'string' },
              summary: { bsonType: 'string' },
              context: { bsonType: 'string' },
              extractedText: { bsonType: 'string' },
              duplicateCheckScore: { bsonType: 'number' },
              iterationCount: { bsonType: 'number' },
              createdAt: { bsonType: 'date' },
              createdBy: { bsonType: 'string' },
              isAutomated: { bsonType: 'bool' },
              automationMetadata: {
                bsonType: 'object',
                properties: {
                  taskId: { bsonType: 'string' },
                  department: { bsonType: 'string' },
                  departmentName: { bsonType: 'string' },
                  iteration: { bsonType: 'number' },
                  qualityScore: { bsonType: 'number' },
                  basedOnNodes: { bsonType: 'array', items: { bsonType: 'string' } },
                  model: { bsonType: 'string' },
                },
              },
            },
          },
        },
      })

      // Create indexes
      const collection = db.collection<GatherItem>('gather')
      await collection.createIndexes([
        { key: { projectId: 1 } },
        { key: { lastUpdated: -1 } },
        { key: { createdAt: -1 } },
        { key: { summary: 'text', context: 'text', content: 'text' } },
        { key: { isAutomated: 1 } },
        { key: { 'automationMetadata.department': 1 } },
        { key: { 'automationMetadata.taskId': 1 } },
      ])

      console.log(`✅ Created gather collection for project: ${projectId}`)
    }

    return db.collection<GatherItem>('gather')
  }

  /**
   * Get gather collection for a project
   */
  async getGatherCollection(projectId: string): Promise<Collection<GatherItem>> {
    return this.initializeGatherCollection(projectId)
  }

  /**
   * Create a new gather item
   */
  async createGatherItem(
    projectId: string,
    item: Omit<GatherItem, '_id' | 'createdAt' | 'lastUpdated'>,
  ): Promise<GatherItem> {
    const collection = await this.getGatherCollection(projectId)

    const newItem: Omit<GatherItem, '_id'> = {
      ...item,
      projectId,
      createdAt: new Date(),
      lastUpdated: new Date(),
    }

    // Remove undefined fields to pass MongoDB validation
    // MongoDB schema validation fails when optional fields are undefined
    const cleanedItem = Object.fromEntries(
      Object.entries(newItem).filter(([_, value]) => value !== undefined),
    )

    const result = await collection.insertOne(cleanedItem as any)

    return {
      ...newItem,
      _id: result.insertedId,
    } as GatherItem
  }

  /**
   * Get gather items with pagination and filters
   */
  async getGatherItems(
    projectId: string,
    options: GatherQueryOptions = {},
  ): Promise<GatherQueryResult> {
    const collection = await this.getGatherCollection(projectId)

    const { page = 1, limit = 20, search, sort = 'latest', hasImage, hasDocument } = options

    // Build query
    const query: any = { projectId }

    if (search) {
      query.$text = { $search: search }
    }

    if (hasImage !== undefined) {
      query.imageUrl = hasImage ? { $exists: true, $ne: null } : { $exists: false }
    }

    if (hasDocument !== undefined) {
      query.documentUrl = hasDocument ? { $exists: true, $ne: null } : { $exists: false }
    }

    if (options.isAutomated !== undefined) {
      query.isAutomated = options.isAutomated
    }

    if (options.department) {
      query['automationMetadata.department'] = options.department
    }

    // Build sort
    let sortQuery: any = {}
    switch (sort) {
      case 'latest':
        sortQuery = { lastUpdated: -1 }
        break
      case 'oldest':
        sortQuery = { lastUpdated: 1 }
        break
      case 'a-z':
        sortQuery = { summary: 1 }
        break
      case 'z-a':
        sortQuery = { summary: -1 }
        break
    }

    const skip = (page - 1) * limit

    // Execute query
    const [items, total] = await Promise.all([
      collection.find(query).sort(sortQuery).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ])

    const pages = Math.ceil(total / limit)

    return {
      items,
      total,
      page,
      pages,
      hasMore: skip + items.length < total,
    }
  }

  /**
   * Get a single gather item by ID
   */
  async getGatherItem(projectId: string, itemId: string): Promise<GatherItem | null> {
    const collection = await this.getGatherCollection(projectId)
    return collection.findOne({ _id: new ObjectId(itemId), projectId })
  }

  /**
   * Update a gather item
   */
  async updateGatherItem(
    projectId: string,
    itemId: string,
    updates: Partial<Omit<GatherItem, '_id' | 'projectId' | 'createdAt' | 'createdBy'>>,
  ): Promise<GatherItem | null> {
    const collection = await this.getGatherCollection(projectId)

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(itemId), projectId },
      {
        $set: {
          ...updates,
          lastUpdated: new Date(),
        },
      },
      { returnDocument: 'after' },
    )

    return result || null
  }

  /**
   * Delete a gather item (hard delete)
   */
  async deleteGatherItem(projectId: string, itemId: string): Promise<boolean> {
    const collection = await this.getGatherCollection(projectId)
    const result = await collection.deleteOne({ _id: new ObjectId(itemId), projectId })
    return result.deletedCount > 0
  }

  /**
   * Get count of gather items for a project
   */
  async getGatherCount(projectId: string): Promise<number> {
    const collection = await this.getGatherCollection(projectId)
    return collection.countDocuments({ projectId })
  }

  /**
   * Delete file reference from gather item
   */
  async deleteFileReference(
    projectId: string,
    itemId: string,
    fileType: 'image' | 'document',
  ): Promise<boolean> {
    const collection = await this.getGatherCollection(projectId)
    const field = fileType === 'image' ? 'imageUrl' : 'documentUrl'

    const result = await collection.updateOne(
      { _id: new ObjectId(itemId), projectId },
      {
        $unset: { [field]: '' },
        $set: { lastUpdated: new Date() },
      },
    )

    return result.modifiedCount > 0
  }

  /**
   * Get automated gather items
   */
  async getAutomatedItems(projectId: string, limit = 100): Promise<GatherItem[]> {
    const collection = await this.getGatherCollection(projectId)
    return collection.find({ projectId, isAutomated: true }).limit(limit).toArray()
  }

  /**
   * Get items by department
   */
  async getItemsByDepartment(
    projectId: string,
    department: string,
    limit = 100,
  ): Promise<GatherItem[]> {
    const collection = await this.getGatherCollection(projectId)
    return collection
      .find({ projectId, 'automationMetadata.department': department })
      .limit(limit)
      .toArray()
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.close()
      this.isConnected = false
      console.log('🔌 Disconnected from Gather MongoDB')
    }
  }
}

// Singleton instance
export const gatherDB = new GatherDatabaseManager()

// Helper functions for easy access
export async function getGatherDatabase(projectId: string): Promise<Db> {
  return gatherDB.getProjectDatabase(projectId)
}

export async function getGatherCollection(projectId: string): Promise<Collection<GatherItem>> {
  return gatherDB.getGatherCollection(projectId)
}
