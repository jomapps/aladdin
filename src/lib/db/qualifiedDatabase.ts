/**
 * Qualified Database Manager
 * Manages per-project MongoDB databases for qualified/validated content
 * Database name format: qualified_{projectSlug}
 *
 * Qualified databases contain content that has been:
 * - Validated by the brain service
 * - Approved by users
 * - Migrated from gather databases
 * - Ready for production use
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb'
import { validateProjectSlug } from './databaseNaming'

export interface QualifiedItem {
  _id?: ObjectId
  projectId: string
  projectSlug: string
  name: string
  collectionName?: string
  version: number
  createdAt: Date
  qualifiedAt: Date
  createdBy: string
  createdByType: 'user' | 'agent'
  qualityRating: number // 0-1
  brainValidated: boolean
  userApproved: boolean
  gatherSourceId?: string // Reference to original gather item
  content: Record<string, any> // Flexible JSON schema
  metadata?: {
    originalSummary?: string
    originalContext?: string
    qualificationNotes?: string
    validationHistory?: Array<{
      timestamp: Date
      validator: string
      score: number
      notes?: string
    }>
    approvalHistory?: Array<{
      timestamp: Date
      approver: string
      action: 'approved' | 'rejected' | 'modified'
      notes?: string
    }>
  }
}

export interface QualifiedQueryOptions {
  page?: number
  limit?: number
  search?: string
  sort?: 'latest' | 'oldest' | 'a-z' | 'z-a' | 'quality'
  collectionName?: string
  minQuality?: number
  validated?: boolean
  approved?: boolean
}

export interface QualifiedQueryResult {
  items: QualifiedItem[]
  total: number
  page: number
  pages: number
  hasMore: boolean
}

class QualifiedDatabaseManager {
  private client: MongoClient
  private isConnected: boolean = false

  constructor() {
    const uri = process.env.DATABASE_URI_QUALIFIED ||
                process.env.DATABASE_URI ||
                'mongodb://localhost:27017'
    this.client = new MongoClient(uri)
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect()
      this.isConnected = true
      console.log('✅ Connected to Qualified MongoDB')
    }
  }

  /**
   * Get database for a specific project
   * Database name format: qualified_{projectSlug}
   */
  async getProjectDatabase(projectSlug: string): Promise<Db> {
    await this.connect()

    // Validate project slug
    const validatedSlug = validateProjectSlug(projectSlug)
    const dbName = `qualified_${validatedSlug}`

    return this.client.db(dbName)
  }

  /**
   * Initialize qualified collection with flexible schema validation
   */
  async initializeQualifiedCollection(projectSlug: string, collectionName: string): Promise<Collection<QualifiedItem>> {
    const db = await this.getProjectDatabase(projectSlug)

    // Check if collection exists
    const collections = await db.listCollections({ name: collectionName }).toArray()

    if (collections.length === 0) {
      // Create collection with validation - only required fields, flexible content
      await db.createCollection(collectionName, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: [
              'projectId',
              'projectSlug',
              'name',
              'version',
              'createdAt',
              'qualifiedAt',
              'createdBy',
              'createdByType',
              'qualityRating',
              'brainValidated',
              'userApproved',
              'content'
            ],
            properties: {
              projectId: { bsonType: 'string' },
              projectSlug: { bsonType: 'string' },
              name: { bsonType: 'string' },
              collectionName: { bsonType: 'string' },
              version: { bsonType: 'number', minimum: 1 },
              createdAt: { bsonType: 'date' },
              qualifiedAt: { bsonType: 'date' },
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
              gatherSourceId: { bsonType: 'string' },
              content: {
                bsonType: 'object',
                description: 'Flexible JSON content structure'
              },
              metadata: {
                bsonType: 'object',
                properties: {
                  originalSummary: { bsonType: 'string' },
                  originalContext: { bsonType: 'string' },
                  qualificationNotes: { bsonType: 'string' },
                  validationHistory: {
                    bsonType: 'array',
                    items: {
                      bsonType: 'object',
                      required: ['timestamp', 'validator', 'score'],
                      properties: {
                        timestamp: { bsonType: 'date' },
                        validator: { bsonType: 'string' },
                        score: { bsonType: 'number' },
                        notes: { bsonType: 'string' }
                      }
                    }
                  },
                  approvalHistory: {
                    bsonType: 'array',
                    items: {
                      bsonType: 'object',
                      required: ['timestamp', 'approver', 'action'],
                      properties: {
                        timestamp: { bsonType: 'date' },
                        approver: { bsonType: 'string' },
                        action: {
                          bsonType: 'string',
                          enum: ['approved', 'rejected', 'modified']
                        },
                        notes: { bsonType: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })

      // Create indexes for efficient querying
      const collection = db.collection<QualifiedItem>(collectionName)
      await collection.createIndexes([
        { key: { projectId: 1 } },
        { key: { projectSlug: 1 } },
        { key: { qualifiedAt: -1 } },
        { key: { createdAt: -1 } },
        { key: { name: 'text', 'content': 'text' } },
        { key: { qualityRating: -1 } },
        { key: { brainValidated: 1 } },
        { key: { userApproved: 1 } },
        { key: { collectionName: 1 } },
        { key: { gatherSourceId: 1 } },
        { key: { version: -1 } }
      ])

      console.log(`✅ Created qualified collection: ${collectionName} for project: ${projectSlug}`)
    }

    return db.collection<QualifiedItem>(collectionName)
  }

  /**
   * Get or create a qualified collection
   */
  async getQualifiedCollection(projectSlug: string, collectionName: string): Promise<Collection<QualifiedItem>> {
    return this.initializeQualifiedCollection(projectSlug, collectionName)
  }

  /**
   * Create a new qualified item
   */
  async createQualifiedItem(
    projectSlug: string,
    collectionName: string,
    item: Omit<QualifiedItem, '_id' | 'qualifiedAt' | 'version'>
  ): Promise<QualifiedItem> {
    const collection = await this.getQualifiedCollection(projectSlug, collectionName)

    // Determine next version number
    const latestVersion = await collection
      .find({ projectId: item.projectId, name: item.name })
      .sort({ version: -1 })
      .limit(1)
      .toArray()

    const version = latestVersion.length > 0 ? latestVersion[0].version + 1 : 1

    const newItem: Omit<QualifiedItem, '_id'> = {
      ...item,
      version,
      qualifiedAt: new Date(),
      collectionName
    }

    // Clean undefined fields
    const cleanedItem = Object.fromEntries(
      Object.entries(newItem).filter(([_, value]) => value !== undefined)
    )

    const result = await collection.insertOne(cleanedItem as any)

    return {
      ...newItem,
      _id: result.insertedId
    } as QualifiedItem
  }

  /**
   * Get qualified items with pagination and filters
   */
  async getQualifiedItems(
    projectSlug: string,
    collectionName: string,
    options: QualifiedQueryOptions = {}
  ): Promise<QualifiedQueryResult> {
    const collection = await this.getQualifiedCollection(projectSlug, collectionName)

    const {
      page = 1,
      limit = 20,
      search,
      sort = 'latest',
      minQuality,
      validated,
      approved
    } = options

    // Build query
    const query: any = { projectSlug }

    if (search) {
      query.$text = { $search: search }
    }

    if (minQuality !== undefined) {
      query.qualityRating = { $gte: minQuality }
    }

    if (validated !== undefined) {
      query.brainValidated = validated
    }

    if (approved !== undefined) {
      query.userApproved = approved
    }

    // Build sort
    let sortQuery: any = {}
    switch (sort) {
      case 'latest':
        sortQuery = { qualifiedAt: -1 }
        break
      case 'oldest':
        sortQuery = { qualifiedAt: 1 }
        break
      case 'a-z':
        sortQuery = { name: 1 }
        break
      case 'z-a':
        sortQuery = { name: -1 }
        break
      case 'quality':
        sortQuery = { qualityRating: -1 }
        break
    }

    const skip = (page - 1) * limit

    // Execute query
    const [items, total] = await Promise.all([
      collection.find(query).sort(sortQuery).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query)
    ])

    const pages = Math.ceil(total / limit)

    return {
      items,
      total,
      page,
      pages,
      hasMore: skip + items.length < total
    }
  }

  /**
   * Get a single qualified item by ID
   */
  async getQualifiedItem(
    projectSlug: string,
    collectionName: string,
    itemId: string
  ): Promise<QualifiedItem | null> {
    const collection = await this.getQualifiedCollection(projectSlug, collectionName)
    return collection.findOne({ _id: new ObjectId(itemId), projectSlug })
  }

  /**
   * Update a qualified item (creates new version)
   */
  async updateQualifiedItem(
    projectSlug: string,
    collectionName: string,
    itemId: string,
    updates: Partial<Omit<QualifiedItem, '_id' | 'projectId' | 'projectSlug' | 'version' | 'createdAt' | 'qualifiedAt'>>
  ): Promise<QualifiedItem> {
    const collection = await this.getQualifiedCollection(projectSlug, collectionName)

    // Get current item
    const current = await collection.findOne({ _id: new ObjectId(itemId), projectSlug })
    if (!current) {
      throw new Error(`Qualified item not found: ${itemId}`)
    }

    // Create new version
    const newVersion: Omit<QualifiedItem, '_id'> = {
      ...current,
      ...updates,
      version: current.version + 1,
      qualifiedAt: new Date()
    }

    delete (newVersion as any)._id

    const result = await collection.insertOne(newVersion as any)

    return {
      ...newVersion,
      _id: result.insertedId
    } as QualifiedItem
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
   * Delete a qualified item (soft delete - marks as deleted)
   */
  async deleteQualifiedItem(
    projectSlug: string,
    collectionName: string,
    itemId: string
  ): Promise<boolean> {
    const collection = await this.getQualifiedCollection(projectSlug, collectionName)
    const result = await collection.deleteOne({ _id: new ObjectId(itemId), projectSlug })
    return result.deletedCount > 0
  }

  /**
   * Get count of qualified items
   */
  async getQualifiedCount(projectSlug: string, collectionName: string): Promise<number> {
    const collection = await this.getQualifiedCollection(projectSlug, collectionName)
    return collection.countDocuments({ projectSlug })
  }

  /**
   * Get items by quality threshold
   */
  async getHighQualityItems(
    projectSlug: string,
    collectionName: string,
    minQuality: number = 0.8,
    limit: number = 100
  ): Promise<QualifiedItem[]> {
    const collection = await this.getQualifiedCollection(projectSlug, collectionName)
    return collection
      .find({ projectSlug, qualityRating: { $gte: minQuality } })
      .sort({ qualityRating: -1 })
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
      console.log('🔌 Disconnected from Qualified MongoDB')
    }
  }
}

// Singleton instance
export const qualifiedDB = new QualifiedDatabaseManager()

// Helper functions for easy access
export async function getQualifiedDatabase(projectSlug: string): Promise<Db> {
  return qualifiedDB.getProjectDatabase(projectSlug)
}

export async function getQualifiedCollection(
  projectSlug: string,
  collectionName: string
): Promise<Collection<QualifiedItem>> {
  return qualifiedDB.getQualifiedCollection(projectSlug, collectionName)
}

export async function createQualifiedItem(
  projectSlug: string,
  collectionName: string,
  item: Omit<QualifiedItem, '_id' | 'qualifiedAt' | 'version'>
): Promise<QualifiedItem> {
  return qualifiedDB.createQualifiedItem(projectSlug, collectionName, item)
}

export async function getQualifiedItems(
  projectSlug: string,
  collectionName: string,
  options?: QualifiedQueryOptions
): Promise<QualifiedQueryResult> {
  return qualifiedDB.getQualifiedItems(projectSlug, collectionName, options)
}

export async function listQualifiedCollections(projectSlug: string): Promise<string[]> {
  return qualifiedDB.listProjectCollections(projectSlug)
}
