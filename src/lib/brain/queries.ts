/**
 * Phase 3: Neo4j Cypher Query Helpers
 * Reusable query functions for common graph operations
 */

import { v4 as uuidv4 } from 'uuid'
import type { Neo4jConnection } from './neo4j'
import type { BrainNode, BrainRelationship, SemanticSearchQuery, SemanticSearchResult } from './types'
import type { NodeType, RelationshipType } from './schema'
import { validateNodeSchema, validateRelationshipSchema, transformNodeProperties, parseNodeProperties } from './schema'

/**
 * Add a node to the knowledge graph
 */
export async function addNode(
  neo4j: Neo4jConnection,
  type: NodeType,
  properties: Record<string, any>,
  embedding?: number[]
): Promise<BrainNode> {
  // Validate schema
  const validation = validateNodeSchema(type, properties)
  if (!validation.valid) {
    throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`)
  }

  const nodeId = uuidv4()
  const transformedProps = transformNodeProperties(type, {
    ...properties,
    id: nodeId,
  })

  // Build Cypher query
  const query = `
    CREATE (n:BrainNode $properties)
    RETURN n
  `

  const params = {
    properties: {
      ...transformedProps,
      embedding: embedding || null,
    },
  }

  const result = await neo4j.executeWrite<{ n: any }>(query, params)

  if (!result.length) {
    throw new Error('Failed to create node')
  }

  return {
    id: nodeId,
    type,
    properties: parseNodeProperties(type, result[0].n.properties),
    embedding: embedding ? { vector: embedding, dimensions: embedding.length, model: 'jina-embeddings-v3' } : undefined,
    createdAt: new Date(transformedProps.createdAt),
    updatedAt: new Date(transformedProps.updatedAt),
  }
}

/**
 * Update a node
 */
export async function updateNode(
  neo4j: Neo4jConnection,
  nodeId: string,
  properties: Record<string, any>,
  embedding?: number[]
): Promise<BrainNode> {
  const query = `
    MATCH (n:BrainNode {id: $nodeId})
    SET n += $properties
    SET n.updatedAt = datetime()
    ${embedding ? 'SET n.embedding = $embedding' : ''}
    RETURN n
  `

  const result = await neo4j.executeWrite<{ n: any }>(query, {
    nodeId,
    properties,
    embedding: embedding || undefined,
  })

  if (!result.length) {
    throw new Error(`Node not found: ${nodeId}`)
  }

  const node = result[0].n.properties

  return {
    id: nodeId,
    type: node.type,
    properties: parseNodeProperties(node.type, node),
    embedding: embedding ? { vector: embedding, dimensions: embedding.length, model: 'jina-embeddings-v3' } : undefined,
    createdAt: new Date(node.createdAt),
    updatedAt: new Date(node.updatedAt),
  }
}

/**
 * Get a node by ID
 */
export async function getNode(neo4j: Neo4jConnection, nodeId: string): Promise<BrainNode | null> {
  const query = `
    MATCH (n:BrainNode {id: $nodeId})
    RETURN n
  `

  const result = await neo4j.executeRead<{ n: any }>(query, { nodeId })

  if (!result.length) {
    return null
  }

  const node = result[0].n.properties

  return {
    id: nodeId,
    type: node.type,
    properties: parseNodeProperties(node.type, node),
    embedding: node.embedding ? { vector: node.embedding, dimensions: node.embedding.length, model: 'jina-embeddings-v3' } : undefined,
    createdAt: new Date(node.createdAt),
    updatedAt: new Date(node.updatedAt),
  }
}

/**
 * Delete a node (with optional cascade)
 */
export async function deleteNode(
  neo4j: Neo4jConnection,
  nodeId: string,
  cascade = false
): Promise<{ deletedNodes: number; deletedRelationships: number }> {
  const query = cascade
    ? `
      MATCH (n:BrainNode {id: $nodeId})
      OPTIONAL MATCH (n)-[r]-()
      DELETE r, n
      RETURN count(n) as deletedNodes, count(r) as deletedRelationships
    `
    : `
      MATCH (n:BrainNode {id: $nodeId})
      DETACH DELETE n
      RETURN count(n) as deletedNodes, 0 as deletedRelationships
    `

  const result = await neo4j.executeWrite<{ deletedNodes: number; deletedRelationships: number }>(
    query,
    { nodeId }
  )

  return result[0] || { deletedNodes: 0, deletedRelationships: 0 }
}

/**
 * Add a relationship between nodes
 */
export async function addRelationship(
  neo4j: Neo4jConnection,
  fromNodeId: string,
  toNodeId: string,
  type: RelationshipType,
  properties: Record<string, any> = {}
): Promise<BrainRelationship> {
  // Get node types for validation
  const fromNode = await getNode(neo4j, fromNodeId)
  const toNode = await getNode(neo4j, toNodeId)

  if (!fromNode || !toNode) {
    throw new Error('One or both nodes not found')
  }

  // Validate relationship schema
  const validation = validateRelationshipSchema(type, fromNode.type, toNode.type, properties)
  if (!validation.valid) {
    throw new Error(`Relationship validation failed: ${validation.errors.join(', ')}`)
  }

  const relId = uuidv4()

  const query = `
    MATCH (from:BrainNode {id: $fromNodeId})
    MATCH (to:BrainNode {id: $toNodeId})
    CREATE (from)-[r:${type} $properties]->(to)
    RETURN r
  `

  const result = await neo4j.executeWrite<{ r: any }>(query, {
    fromNodeId,
    toNodeId,
    properties: {
      ...properties,
      id: relId,
      createdAt: new Date().toISOString(),
    },
  })

  if (!result.length) {
    throw new Error('Failed to create relationship')
  }

  return {
    id: relId,
    type,
    fromNodeId,
    toNodeId,
    properties,
    createdAt: new Date(),
  }
}

/**
 * Get relationships for a node
 */
export async function getRelationships(
  neo4j: Neo4jConnection,
  nodeId: string,
  options: {
    types?: string[]
    direction?: 'incoming' | 'outgoing' | 'both'
  } = {}
): Promise<BrainRelationship[]> {
  const { types, direction = 'both' } = options

  let relationshipPattern = ''
  if (direction === 'incoming') {
    relationshipPattern = '<-[r]-'
  } else if (direction === 'outgoing') {
    relationshipPattern = '-[r]->'
  } else {
    relationshipPattern = '-[r]-'
  }

  const typeFilter = types?.length ? `:${types.join('|')}` : ''

  const query = `
    MATCH (n:BrainNode {id: $nodeId})${relationshipPattern.replace('[r]', `[r${typeFilter}]`)}(other)
    RETURN r, other, startNode(r).id as fromId, endNode(r).id as toId
  `

  const result = await neo4j.executeRead<{
    r: any
    other: any
    fromId: string
    toId: string
  }>(query, { nodeId })

  return result.map(record => ({
    id: record.r.properties.id || uuidv4(),
    type: record.r.type as RelationshipType,
    fromNodeId: record.fromId,
    toNodeId: record.toId,
    properties: record.r.properties,
    createdAt: new Date(record.r.properties.createdAt),
  }))
}

/**
 * Semantic search using vector similarity
 */
export async function semanticSearch(
  neo4j: Neo4jConnection,
  queryEmbedding: number[],
  options: {
    types?: string[]
    limit?: number
    threshold?: number
    projectId?: string
  } = {}
): Promise<SemanticSearchResult[]> {
  const { types, limit = 10, threshold = 0.7, projectId } = options

  const typeFilter = types?.length ? `AND n.type IN $types` : ''
  const projectFilter = projectId ? `AND n.projectId = $projectId` : ''

  // Note: Vector similarity search requires Neo4j Enterprise or specific plugins
  // This is a simplified version - actual implementation may vary
  const query = `
    MATCH (n:BrainNode)
    WHERE n.embedding IS NOT NULL ${typeFilter} ${projectFilter}
    RETURN n,
      reduce(dot = 0.0, i IN range(0, size(n.embedding)-1) |
        dot + (n.embedding[i] * $embedding[i])
      ) AS score
    WHERE score >= $threshold
    ORDER BY score DESC
    LIMIT $limit
  `

  const result = await neo4j.executeRead<{ n: any; score: number }>(query, {
    embedding: queryEmbedding,
    types: types || [],
    threshold,
    limit,
    projectId: projectId || '',
  })

  return result.map(record => {
    const node = record.n.properties

    return {
      node: {
        id: node.id,
        type: node.type,
        properties: parseNodeProperties(node.type, node),
        createdAt: new Date(node.createdAt),
        updatedAt: new Date(node.updatedAt),
      },
      score: record.score,
      distance: 1 - record.score,
    }
  })
}

/**
 * Find contradictions between nodes
 */
export async function findContradictions(
  neo4j: Neo4jConnection,
  projectId: string
): Promise<Array<{ node1: BrainNode; node2: BrainNode; reason: string }>> {
  const query = `
    MATCH (n1:BrainNode {projectId: $projectId})-[r:CONTRADICTS]->(n2:BrainNode)
    RETURN n1, n2, r.reason as reason
  `

  const result = await neo4j.executeRead<{ n1: any; n2: any; reason: string }>(query, {
    projectId,
  })

  return result.map(record => ({
    node1: {
      id: record.n1.properties.id,
      type: record.n1.properties.type,
      properties: parseNodeProperties(record.n1.properties.type, record.n1.properties),
      createdAt: new Date(record.n1.properties.createdAt),
      updatedAt: new Date(record.n1.properties.updatedAt),
    },
    node2: {
      id: record.n2.properties.id,
      type: record.n2.properties.type,
      properties: parseNodeProperties(record.n2.properties.type, record.n2.properties),
      createdAt: new Date(record.n2.properties.createdAt),
      updatedAt: new Date(record.n2.properties.updatedAt),
    },
    reason: record.reason,
  }))
}

/**
 * Get nodes by type with filters
 */
export async function getNodesByType(
  neo4j: Neo4jConnection,
  type: NodeType,
  filters: Record<string, any> = {},
  limit = 100
): Promise<BrainNode[]> {
  const filterClauses = Object.entries(filters)
    .map(([key, value]) => `n.${key} = $${key}`)
    .join(' AND ')

  const whereClause = filterClauses ? `AND ${filterClauses}` : ''

  const query = `
    MATCH (n:BrainNode)
    WHERE n.type = $type ${whereClause}
    RETURN n
    LIMIT $limit
  `

  const result = await neo4j.executeRead<{ n: any }>(query, {
    type,
    ...filters,
    limit,
  })

  return result.map(record => {
    const node = record.n.properties

    return {
      id: node.id,
      type: node.type,
      properties: parseNodeProperties(node.type, node),
      embedding: node.embedding ? { vector: node.embedding, dimensions: node.embedding.length, model: 'jina-embeddings-v3' } : undefined,
      createdAt: new Date(node.createdAt),
      updatedAt: new Date(node.updatedAt),
    }
  })
}

/**
 * Traverse graph from a starting node
 */
export async function traverseGraph(
  neo4j: Neo4jConnection,
  startNodeId: string,
  options: {
    relationshipTypes?: string[]
    maxDepth?: number
    direction?: 'incoming' | 'outgoing' | 'both'
  } = {}
): Promise<{ nodes: BrainNode[]; relationships: BrainRelationship[] }> {
  const { relationshipTypes, maxDepth = 3, direction = 'both' } = options

  let relationshipPattern = '-[r]-'
  if (direction === 'incoming') {
    relationshipPattern = '<-[r]-'
  } else if (direction === 'outgoing') {
    relationshipPattern = '-[r]->'
  }

  const typeFilter = relationshipTypes?.length ? `:${relationshipTypes.join('|')}` : ''

  const query = `
    MATCH path = (start:BrainNode {id: $startNodeId})${relationshipPattern.replace('[r]', `[r${typeFilter}*1..${maxDepth}]`)}(end)
    RETURN nodes(path) as nodes, relationships(path) as rels
  `

  const result = await neo4j.executeRead<{ nodes: any[]; rels: any[] }>(query, {
    startNodeId,
  })

  const nodesMap = new Map<string, BrainNode>()
  const relationshipsMap = new Map<string, BrainRelationship>()

  result.forEach(record => {
    record.nodes.forEach((node: any) => {
      if (!nodesMap.has(node.properties.id)) {
        nodesMap.set(node.properties.id, {
          id: node.properties.id,
          type: node.properties.type,
          properties: parseNodeProperties(node.properties.type, node.properties),
          createdAt: new Date(node.properties.createdAt),
          updatedAt: new Date(node.properties.updatedAt),
        })
      }
    })

    record.rels.forEach((rel: any) => {
      if (!relationshipsMap.has(rel.properties.id)) {
        relationshipsMap.set(rel.properties.id, {
          id: rel.properties.id || uuidv4(),
          type: rel.type as RelationshipType,
          fromNodeId: rel.start.properties.id,
          toNodeId: rel.end.properties.id,
          properties: rel.properties,
          createdAt: new Date(rel.properties.createdAt),
        })
      }
    })
  })

  return {
    nodes: Array.from(nodesMap.values()),
    relationships: Array.from(relationshipsMap.values()),
  }
}
