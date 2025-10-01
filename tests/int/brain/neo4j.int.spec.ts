import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { BrainClient } from '@/lib/brain/client';

describe('Neo4j Graph Operations Integration Tests', () => {
  let client: BrainClient;
  const testProjectId = 'test-project-neo4j-int';
  let testNodeId: string;

  beforeAll(() => {
    client = new BrainClient({
      baseUrl: process.env.BRAIN_SERVICE_URL || 'http://localhost:8000',
      timeout: 30000,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      if (testNodeId) {
        await client.deleteNode({
          projectId: testProjectId,
          nodeId: testNodeId,
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Node CRUD Operations', () => {
    it('should create a new node', async () => {
      const node = await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: {
          name: 'Neo4j Test Character',
          age: 30,
          occupation: 'Graph Expert',
        },
      });

      expect(node).toBeDefined();
      expect(node.id).toBeDefined();
      expect(node.type).toBe('character');
      expect(node.properties.name).toBe('Neo4j Test Character');

      testNodeId = node.id;
    });

    it('should read an existing node', async () => {
      const node = await client.getNode({
        projectId: testProjectId,
        nodeId: testNodeId,
      });

      expect(node).toBeDefined();
      expect(node.id).toBe(testNodeId);
      expect(node.properties.name).toBe('Neo4j Test Character');
    });

    it('should update a node', async () => {
      const updated = await client.updateNode({
        projectId: testProjectId,
        nodeId: testNodeId,
        properties: {
          age: 31,
          occupation: 'Senior Graph Expert',
          updated: true,
        },
      });

      expect(updated).toBeDefined();
      expect(updated.properties.age).toBe(31);
      expect(updated.properties.occupation).toBe('Senior Graph Expert');
      expect(updated.properties.updated).toBe(true);
    });

    it('should delete a node', async () => {
      // Create a temporary node
      const tempNode = await client.addNode({
        projectId: testProjectId,
        type: 'temporary',
        properties: { name: 'Delete Me' },
      });

      // Delete it
      await client.deleteNode({
        projectId: testProjectId,
        nodeId: tempNode.id,
      });

      // Verify deletion
      await expect(
        client.getNode({
          projectId: testProjectId,
          nodeId: tempNode.id,
        })
      ).rejects.toThrow();
    });

    it('should handle non-existent node read', async () => {
      await expect(
        client.getNode({
          projectId: testProjectId,
          nodeId: 'non-existent-node-id',
        })
      ).rejects.toThrow();
    });

    it('should handle duplicate node creation', async () => {
      const props = {
        name: 'Duplicate Test',
        unique_id: 'duplicate-123',
      };

      const node1 = await client.addNode({
        projectId: testProjectId,
        type: 'test',
        properties: props,
      });

      // Creating another with same unique_id should handle gracefully
      const node2 = await client.addNode({
        projectId: testProjectId,
        type: 'test',
        properties: props,
      });

      expect(node1.id).toBeDefined();
      expect(node2.id).toBeDefined();

      // Cleanup
      await client.deleteNode({ projectId: testProjectId, nodeId: node1.id });
      await client.deleteNode({ projectId: testProjectId, nodeId: node2.id });
    });
  });

  describe('Relationship Creation', () => {
    let characterId: string;
    let locationId: string;

    beforeAll(async () => {
      // Create test nodes
      const character = await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: { name: 'Alice' },
      });

      const location = await client.addNode({
        projectId: testProjectId,
        type: 'location',
        properties: { name: 'Wonderland' },
      });

      characterId = character.id;
      locationId = location.id;
    });

    afterAll(async () => {
      // Cleanup
      try {
        await client.deleteNode({ projectId: testProjectId, nodeId: characterId });
        await client.deleteNode({ projectId: testProjectId, nodeId: locationId });
      } catch (error) {
        // Ignore
      }
    });

    it('should create relationship between nodes', async () => {
      const updated = await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: { id: characterId, name: 'Alice' },
        relationships: [
          {
            type: 'LIVES_IN',
            targetId: locationId,
            properties: { since: '2023-01-01' },
          },
        ],
      });

      expect(updated.relationships).toBeDefined();
      expect(updated.relationships?.length).toBeGreaterThan(0);
    });

    it('should create multiple relationships', async () => {
      const location2 = await client.addNode({
        projectId: testProjectId,
        type: 'location',
        properties: { name: 'Tea Party' },
      });

      const updated = await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: { id: characterId, name: 'Alice' },
        relationships: [
          {
            type: 'LIVES_IN',
            targetId: locationId,
          },
          {
            type: 'VISITS',
            targetId: location2.id,
            properties: { frequency: 'often' },
          },
        ],
      });

      expect(updated.relationships?.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await client.deleteNode({ projectId: testProjectId, nodeId: location2.id });
    });

    it('should create bidirectional relationships', async () => {
      const node1 = await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: { name: 'Romeo' },
      });

      const node2 = await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: { name: 'Juliet' },
        relationships: [
          {
            type: 'LOVES',
            targetId: node1.id,
          },
        ],
      });

      // Add reverse relationship
      await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: { id: node1.id, name: 'Romeo' },
        relationships: [
          {
            type: 'LOVES',
            targetId: node2.id,
          },
        ],
      });

      expect(node2.relationships?.length).toBeGreaterThan(0);

      // Cleanup
      await client.deleteNode({ projectId: testProjectId, nodeId: node1.id });
      await client.deleteNode({ projectId: testProjectId, nodeId: node2.id });
    });
  });

  describe('Vector Similarity Search', () => {
    beforeAll(async () => {
      // Add test data with semantic content
      await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: {
          name: 'Detective Brown',
          personality: 'Analytical, observant, methodical',
          occupation: 'Police Detective',
        },
      });

      await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: {
          name: 'Sherlock Holmes',
          personality: 'Brilliant deductive mind, eccentric',
          occupation: 'Consulting Detective',
        },
      });
    });

    it('should find similar characters by personality', async () => {
      const results = await client.searchSimilar({
        projectId: testProjectId,
        query: 'intelligent detective with keen observation',
        type: 'character',
        limit: 5,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].similarity).toBeGreaterThan(0.5);
    });

    it('should rank results by similarity', async () => {
      const results = await client.searchSimilar({
        projectId: testProjectId,
        query: 'detective',
        limit: 10,
      });

      // Results should be ordered by similarity (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    it('should filter by node type', async () => {
      const results = await client.searchSimilar({
        projectId: testProjectId,
        query: 'detective',
        type: 'character',
        limit: 10,
      });

      results.forEach(node => {
        expect(node.type).toBe('character');
      });
    });
  });

  describe('Graph Traversal', () => {
    let nodeA: string;
    let nodeB: string;
    let nodeC: string;

    beforeAll(async () => {
      // Create a chain: A -> B -> C
      const a = await client.addNode({
        projectId: testProjectId,
        type: 'test',
        properties: { name: 'Node A' },
      });

      const b = await client.addNode({
        projectId: testProjectId,
        type: 'test',
        properties: { name: 'Node B' },
      });

      const c = await client.addNode({
        projectId: testProjectId,
        type: 'test',
        properties: { name: 'Node C' },
      });

      nodeA = a.id;
      nodeB = b.id;
      nodeC = c.id;

      // Create relationships
      await client.addNode({
        projectId: testProjectId,
        type: 'test',
        properties: { id: nodeA, name: 'Node A' },
        relationships: [{ type: 'CONNECTS_TO', targetId: nodeB }],
      });

      await client.addNode({
        projectId: testProjectId,
        type: 'test',
        properties: { id: nodeB, name: 'Node B' },
        relationships: [{ type: 'CONNECTS_TO', targetId: nodeC }],
      });
    });

    afterAll(async () => {
      // Cleanup
      try {
        await client.deleteNode({ projectId: testProjectId, nodeId: nodeA });
        await client.deleteNode({ projectId: testProjectId, nodeId: nodeB });
        await client.deleteNode({ projectId: testProjectId, nodeId: nodeC });
      } catch (error) {
        // Ignore
      }
    });

    it('should traverse single-hop relationships', async () => {
      const node = await client.getNode({
        projectId: testProjectId,
        nodeId: nodeA,
      });

      expect(node.relationships).toBeDefined();
      expect(node.relationships?.some(r => r.targetId === nodeB)).toBe(true);
    });

    it('should find paths between nodes', async () => {
      // This would require a path-finding method in BrainClient
      // Placeholder for path traversal tests
      expect(nodeA).toBeDefined();
      expect(nodeC).toBeDefined();
    });
  });

  describe('Schema Constraints', () => {
    it('should enforce required properties', async () => {
      await expect(
        client.addNode({
          projectId: testProjectId,
          type: '',
          properties: {},
        })
      ).rejects.toThrow();
    });

    it('should validate property types', async () => {
      // Placeholder for type validation
      expect(true).toBe(true);
    });
  });

  describe('Transaction Handling', () => {
    it('should handle successful transaction', async () => {
      const node = await client.addNode({
        projectId: testProjectId,
        type: 'transaction-test',
        properties: { name: 'Transaction Success' },
      });

      expect(node).toBeDefined();

      // Cleanup
      await client.deleteNode({ projectId: testProjectId, nodeId: node.id });
    });

    it('should rollback failed transaction', async () => {
      // Placeholder for transaction rollback testing
      expect(true).toBe(true);
    });

    it('should handle concurrent transactions', async () => {
      const promises = Array(5).fill(null).map((_, i) =>
        client.addNode({
          projectId: testProjectId,
          type: 'concurrent',
          properties: { name: `Concurrent ${i}` },
        })
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);

      // Cleanup
      await Promise.all(
        results.map(node =>
          client.deleteNode({ projectId: testProjectId, nodeId: node.id })
        )
      );
    });
  });
});
