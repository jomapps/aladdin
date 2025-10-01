/**
 * Phase 3: Neo4j Driver Connection and Management
 * Handles connection pooling and lifecycle for Neo4j database
 */

import neo4j, { Driver, Session, Result, Integer } from 'neo4j-driver'
import type { BrainConfig } from './types'

export class Neo4jConnection {
  private driver: Driver | null = null
  private config: BrainConfig

  constructor(config: BrainConfig) {
    this.config = config
  }

  /**
   * Initialize Neo4j driver connection
   */
  async connect(): Promise<Driver> {
    if (this.driver) {
      return this.driver
    }

    const uri = this.config.neo4jUri || process.env.NEO4J_URI
    const user = this.config.neo4jUser || process.env.NEO4J_USER || 'neo4j'
    const password = this.config.neo4jPassword || process.env.NEO4J_PASSWORD

    if (!uri || !password) {
      throw new Error('Neo4j connection configuration missing. Set NEO4J_URI and NEO4J_PASSWORD.')
    }

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000, // 60 seconds
        maxTransactionRetryTime: 30000, // 30 seconds
      })

      // Verify connectivity
      await this.driver.verifyConnectivity()

      console.log('✅ Neo4j connection established:', uri)

      return this.driver
    } catch (error: any) {
      throw new Error(`Failed to connect to Neo4j: ${error.message}`)
    }
  }

  /**
   * Get a new session for executing queries
   */
  getSession(database?: string): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized. Call connect() first.')
    }

    return this.driver.session({
      database: database || 'neo4j',
      defaultAccessMode: neo4j.session.WRITE,
    })
  }

  /**
   * Execute a read query
   */
  async executeRead<T = any>(
    query: string,
    parameters: Record<string, any> = {}
  ): Promise<T[]> {
    const session = this.getSession()

    try {
      const result = await session.executeRead(tx => tx.run(query, parameters))
      return result.records.map(record => record.toObject() as T)
    } finally {
      await session.close()
    }
  }

  /**
   * Execute a write query
   */
  async executeWrite<T = any>(
    query: string,
    parameters: Record<string, any> = {}
  ): Promise<T[]> {
    const session = this.getSession()

    try {
      const result = await session.executeWrite(tx => tx.run(query, parameters))
      return result.records.map(record => record.toObject() as T)
    } finally {
      await session.close()
    }
  }

  /**
   * Execute a raw query
   */
  async execute(query: string, parameters: Record<string, any> = {}): Promise<Result> {
    const session = this.getSession()

    try {
      return await session.run(query, parameters)
    } finally {
      await session.close()
    }
  }

  /**
   * Execute a transaction with automatic retry
   */
  async executeTransaction<T>(
    work: (tx: any) => Promise<T>
  ): Promise<T> {
    const session = this.getSession()

    try {
      return await session.executeWrite(work)
    } finally {
      await session.close()
    }
  }

  /**
   * Create database indexes for performance
   */
  async createIndexes(): Promise<void> {
    const indexes = [
      // Node indexes
      'CREATE INDEX node_type_idx IF NOT EXISTS FOR (n:BrainNode) ON (n.type)',
      'CREATE INDEX node_project_idx IF NOT EXISTS FOR (n:BrainNode) ON (n.projectId)',
      'CREATE INDEX node_created_idx IF NOT EXISTS FOR (n:BrainNode) ON (n.createdAt)',

      // Vector index for embeddings (if supported)
      // 'CREATE VECTOR INDEX embedding_idx IF NOT EXISTS FOR (n:BrainNode) ON (n.embedding)',

      // Relationship indexes
      'CREATE INDEX rel_type_idx IF NOT EXISTS FOR ()-[r:RELATES_TO]-() ON (r.type)',
    ]

    for (const indexQuery of indexes) {
      try {
        await this.execute(indexQuery)
        console.log(`✅ Created index: ${indexQuery.split('IF NOT EXISTS')[1]?.trim()}`)
      } catch (error: any) {
        console.warn(`⚠️  Index creation warning: ${error.message}`)
      }
    }
  }

  /**
   * Create database constraints
   */
  async createConstraints(): Promise<void> {
    const constraints = [
      'CREATE CONSTRAINT node_id_unique IF NOT EXISTS FOR (n:BrainNode) REQUIRE n.id IS UNIQUE',
    ]

    for (const constraintQuery of constraints) {
      try {
        await this.execute(constraintQuery)
        console.log(`✅ Created constraint: ${constraintQuery.split('IF NOT EXISTS')[1]?.trim()}`)
      } catch (error: any) {
        console.warn(`⚠️  Constraint creation warning: ${error.message}`)
      }
    }
  }

  /**
   * Initialize database schema
   */
  async initializeSchema(): Promise<void> {
    console.log('🔧 Initializing Neo4j schema...')

    await this.createConstraints()
    await this.createIndexes()

    console.log('✅ Neo4j schema initialized')
  }

  /**
   * Clear all data (dangerous - use only for testing)
   */
  async clearDatabase(): Promise<void> {
    console.warn('⚠️  Clearing entire Neo4j database...')

    await this.execute('MATCH (n) DETACH DELETE n')

    console.log('✅ Database cleared')
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalNodes: number
    totalRelationships: number
    nodesByType: Record<string, number>
  }> {
    const [totalNodesResult] = await this.executeRead<{ count: Integer }>(
      'MATCH (n:BrainNode) RETURN count(n) as count'
    )

    const [totalRelsResult] = await this.executeRead<{ count: Integer }>(
      'MATCH ()-[r]->() RETURN count(r) as count'
    )

    const nodesByTypeResults = await this.executeRead<{ type: string; count: Integer }>(
      'MATCH (n:BrainNode) RETURN n.type as type, count(n) as count'
    )

    const nodesByType: Record<string, number> = {}
    nodesByTypeResults.forEach(result => {
      if (result.type) {
        nodesByType[result.type] = neo4j.integer.toNumber(result.count)
      }
    })

    return {
      totalNodes: neo4j.integer.toNumber(totalNodesResult?.count || 0),
      totalRelationships: neo4j.integer.toNumber(totalRelsResult?.count || 0),
      nodesByType,
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.driver) {
        return false
      }

      await this.driver.verifyConnectivity()
      return true
    } catch {
      return false
    }
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close()
      this.driver = null
      console.log('✅ Neo4j connection closed')
    }
  }
}

/**
 * Global Neo4j connection instance
 */
let neo4jInstance: Neo4jConnection | null = null

export function getNeo4jConnection(config?: BrainConfig): Neo4jConnection {
  const fullConfig: BrainConfig = config || {
    apiUrl: process.env.BRAIN_API_URL || '',
    apiKey: process.env.BRAIN_API_KEY || '',
    neo4jUri: process.env.NEO4J_URI,
    neo4jUser: process.env.NEO4J_USER,
    neo4jPassword: process.env.NEO4J_PASSWORD,
  }

  if (!neo4jInstance) {
    neo4jInstance = new Neo4jConnection(fullConfig)
  }

  return neo4jInstance
}

export { Neo4jConnection as default }
