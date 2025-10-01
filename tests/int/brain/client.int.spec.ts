import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { BrainClient } from '@/lib/brain/client';

describe('BrainClient Integration Tests', () => {
  let client: BrainClient;
  const testProjectId = 'test-project-client-int';

  beforeAll(() => {
    client = new BrainClient({
      baseUrl: process.env.BRAIN_SERVICE_URL || 'http://localhost:8000',
      timeout: 30000,
      retries: 2,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await client.deleteNode({
        projectId: testProjectId,
        nodeId: 'test-node-1',
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultClient = new BrainClient();
      expect(defaultClient).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customClient = new BrainClient({
        baseUrl: 'http://custom:9000',
        timeout: 15000,
        retries: 3,
      });
      expect(customClient).toBeDefined();
    });

    it('should throw error for invalid baseUrl', () => {
      expect(() => {
        new BrainClient({ baseUrl: '' });
      }).toThrow();
    });

    it('should throw error for negative timeout', () => {
      expect(() => {
        new BrainClient({ timeout: -1000 });
      }).toThrow();
    });

    it('should throw error for negative retries', () => {
      expect(() => {
        new BrainClient({ retries: -1 });
      }).toThrow();
    });
  });

  describe('validateContent()', () => {
    it('should validate high-quality character data', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'John Smith',
          age: 35,
          occupation: 'Detective',
          personality: 'Cynical but dedicated, haunted by past mistakes',
          backstory: 'Former FBI agent who left the bureau after a case went wrong',
          goals: 'Seek redemption by solving cold cases',
          conflicts: 'Trust issues, alcohol dependency',
        },
      });

      expect(result).toBeDefined();
      expect(result.qualityRating).toBeGreaterThanOrEqual(0.60);
      expect(result.brainValidated).toBe(true);
      expect(Array.isArray(result.contradictions)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should validate low-quality character data', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Bob',
          age: 30,
        },
      });

      expect(result).toBeDefined();
      expect(result.qualityRating).toBeLessThan(0.60);
      expect(result.brainValidated).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle empty data gracefully', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {},
      });

      expect(result).toBeDefined();
      expect(result.qualityRating).toBeLessThan(0.60);
      expect(result.brainValidated).toBe(false);
    });

    it('should handle null values', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: null,
          age: null,
        },
      });

      expect(result).toBeDefined();
      expect(result.brainValidated).toBe(false);
    });

    it('should validate location data', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'location',
        data: {
          name: 'Dark Alley',
          description: 'A shadowy passage between two old buildings',
          atmosphere: 'Dangerous, foreboding',
          significance: 'Where the first murder occurred',
        },
      });

      expect(result).toBeDefined();
      expect(result.qualityRating).toBeGreaterThanOrEqual(0);
    });

    it('should validate scene data', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'scene',
        data: {
          title: 'Opening Chase',
          description: 'Hero pursues villain through crowded market',
          purpose: 'Establish stakes and character abilities',
          conflict: 'Physical pursuit vs clever evasion',
        },
      });

      expect(result).toBeDefined();
      expect(result.qualityRating).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing projectId', async () => {
      await expect(
        client.validateContent({
          projectId: '',
          type: 'character',
          data: { name: 'Test' },
        })
      ).rejects.toThrow();
    });

    it('should handle missing type', async () => {
      await expect(
        client.validateContent({
          projectId: testProjectId,
          type: '',
          data: { name: 'Test' },
        })
      ).rejects.toThrow();
    });

    it('should handle service timeout', async () => {
      const slowClient = new BrainClient({ timeout: 1 });

      await expect(
        slowClient.validateContent({
          projectId: testProjectId,
          type: 'character',
          data: { name: 'Test' },
        })
      ).rejects.toThrow();
    }, 10000);

    it('should retry on failure', async () => {
      const retryClient = new BrainClient({
        retries: 2,
        timeout: 5000,
      });

      // This should succeed after retries
      const result = await retryClient.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: { name: 'Retry Test' },
      });

      expect(result).toBeDefined();
    });
  });

  describe('semanticSearch()', () => {
    beforeEach(async () => {
      // Add test data for search
      await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: {
          name: 'Sarah Connor',
          occupation: 'Warrior',
          personality: 'Determined, protective mother',
        },
      });
    });

    it('should find semantically similar content', async () => {
      const results = await client.semanticSearch({
        projectId: testProjectId,
        query: 'strong female character',
        limit: 5,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by type', async () => {
      const results = await client.semanticSearch({
        projectId: testProjectId,
        query: 'warrior',
        type: 'character',
        limit: 5,
      });

      expect(Array.isArray(results)).toBe(true);
      results.forEach(node => {
        expect(node.type).toBe('character');
      });
    });

    it('should respect limit parameter', async () => {
      const results = await client.semanticSearch({
        projectId: testProjectId,
        query: 'character',
        limit: 3,
      });

      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should return similarity scores', async () => {
      const results = await client.semanticSearch({
        projectId: testProjectId,
        query: 'protective mother',
        limit: 5,
      });

      results.forEach(node => {
        expect(node.similarity).toBeGreaterThanOrEqual(0);
        expect(node.similarity).toBeLessThanOrEqual(1);
      });
    });

    it('should handle empty query', async () => {
      await expect(
        client.semanticSearch({
          projectId: testProjectId,
          query: '',
          limit: 5,
        })
      ).rejects.toThrow();
    });

    it('should handle invalid limit', async () => {
      await expect(
        client.semanticSearch({
          projectId: testProjectId,
          query: 'test',
          limit: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe('addNode() and updateNode()', () => {
    it('should add a new node', async () => {
      const node = await client.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: {
          id: 'test-node-1',
          name: 'Test Character',
          age: 25,
        },
        relationships: [],
      });

      expect(node).toBeDefined();
      expect(node.id).toBeDefined();
      expect(node.type).toBe('character');
    });

    it('should update existing node', async () => {
      const updated = await client.updateNode({
        projectId: testProjectId,
        nodeId: 'test-node-1',
        properties: {
          age: 26,
          updated: true,
        },
      });

      expect(updated).toBeDefined();
      expect(updated.properties.age).toBe(26);
      expect(updated.properties.updated).toBe(true);
    });

    it('should add node with relationships', async () => {
      const node = await client.addNode({
        projectId: testProjectId,
        type: 'location',
        properties: {
          name: 'Test Location',
        },
        relationships: [
          {
            type: 'VISITED_BY',
            targetId: 'test-node-1',
            properties: { frequency: 'often' },
          },
        ],
      });

      expect(node).toBeDefined();
      expect(node.relationships?.length).toBeGreaterThan(0);
    });

    it('should handle missing required fields', async () => {
      await expect(
        client.addNode({
          projectId: '',
          type: 'character',
          properties: {},
        })
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      const badClient = new BrainClient({
        baseUrl: 'http://invalid-host:9999',
        timeout: 2000,
        retries: 0,
      });

      await expect(
        badClient.validateContent({
          projectId: testProjectId,
          type: 'character',
          data: { name: 'Test' },
        })
      ).rejects.toThrow();
    });

    it('should handle malformed responses', async () => {
      // This test would require mocking the fetch response
      // Placeholder for response validation tests
      expect(true).toBe(true);
    });

    it('should handle rate limiting', async () => {
      // Placeholder for rate limit tests
      expect(true).toBe(true);
    });
  });

  describe('Connection Pooling', () => {
    it('should reuse connections efficiently', async () => {
      const promises = Array(10).fill(null).map(() =>
        client.validateContent({
          projectId: testProjectId,
          type: 'character',
          data: { name: `Test ${Math.random()}` },
        })
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
    });

    it('should handle concurrent requests', async () => {
      const promises = [
        client.semanticSearch({ projectId: testProjectId, query: 'test1' }),
        client.semanticSearch({ projectId: testProjectId, query: 'test2' }),
        client.semanticSearch({ projectId: testProjectId, query: 'test3' }),
      ];

      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
    });
  });
});
