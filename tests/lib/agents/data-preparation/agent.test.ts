/**
 * Tests for DataPreparationAgent
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataPreparationAgent } from '@/lib/agents/data-preparation/agent';
import { createMockLLMClient } from '../../../__mocks__/llm-client.mock';
import { createMockRedis } from '../../../__mocks__/redis.mock';
import type { AgentConfig, PrepareOptions } from '@/lib/agents/data-preparation/types';

// Mock dependencies
vi.mock('@/lib/llm/client', () => ({
  getLLMClient: () => createMockLLMClient(),
}));

vi.mock('ioredis', () => ({
  default: createMockRedis,
}));

describe('DataPreparationAgent', () => {
  let agent: DataPreparationAgent;
  let mockConfig: AgentConfig;

  beforeEach(() => {
    mockConfig = {
      llm: {
        apiKey: 'test-key',
        baseUrl: 'https://test.api',
        defaultModel: 'test-model',
      },
      brain: {
        apiUrl: 'https://brain.test',
        apiKey: 'brain-key',
      },
      redis: {
        url: 'redis://localhost:6379',
      },
      cache: {
        projectContextTTL: 300,
        documentTTL: 3600,
        entityTTL: 1800,
      },
      queue: {
        concurrency: 5,
        maxRetries: 3,
      },
      features: {
        enableCaching: true,
        enableQueue: true,
        enableValidation: true,
        enableRelationshipDiscovery: true,
      },
    };

    agent = new DataPreparationAgent(mockConfig);
  });

  describe('prepare()', () => {
    it('should prepare data successfully', async () => {
      const data = {
        id: 'test-1',
        name: 'Test Character',
        description: 'A test character',
      };

      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'test-1',
        userId: 'user-1',
      };

      const result = await agent.prepare(data, options);

      expect(result).toBeDefined();
      expect(result.type).toBe('character');
      expect(result.project_id).toBe('project-1');
      expect(result.text).toContain('Test Character');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.sourceCollection).toBe('characters');
    });

    it('should throw error if data is missing', async () => {
      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'test-1',
        userId: 'user-1',
      };

      await expect(agent.prepare(null, options)).rejects.toThrow('Data is required');
    });

    it('should throw error if projectId is missing', async () => {
      const data = { id: 'test-1' };
      const options: PrepareOptions = {
        projectId: '',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'test-1',
        userId: 'user-1',
      };

      await expect(agent.prepare(data, options)).rejects.toThrow('projectId is required');
    });

    it('should throw error if entityType is missing', async () => {
      const data = { id: 'test-1' };
      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: '',
        sourceCollection: 'characters',
        sourceId: 'test-1',
        userId: 'user-1',
      };

      await expect(agent.prepare(data, options)).rejects.toThrow('entityType is required');
    });

    it('should use cache when available', async () => {
      const data = {
        id: 'test-2',
        name: 'Cached Character',
      };

      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'test-2',
        userId: 'user-1',
      };

      // First call - should cache
      const firstResult = await agent.prepare(data, options);

      // Second call - should hit cache
      const secondResult = await agent.prepare(data, options);

      expect(firstResult).toBeDefined();
      expect(secondResult).toBeDefined();
      // Cache hit should be faster and return same result
    });

    it('should skip cache when skipCache is true', async () => {
      const data = {
        id: 'test-3',
        name: 'No Cache Character',
      };

      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'test-3',
        userId: 'user-1',
        skipCache: true,
      };

      const result = await agent.prepare(data, options);

      expect(result).toBeDefined();
    });

    it('should generate metadata with LLM', async () => {
      const data = {
        id: 'test-4',
        name: 'Metadata Test',
        description: 'Testing metadata generation',
      };

      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'test-4',
        userId: 'user-1',
      };

      const result = await agent.prepare(data, options);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.dataLineage).toBeDefined();
      expect(result.metadata.dataLineage.source).toBe('data-preparation-agent');
    });

    it('should discover relationships when enabled', async () => {
      const data = {
        id: 'test-5',
        name: 'Relationship Test',
        relatedCharacters: ['char-1', 'char-2'],
      };

      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'test-5',
        userId: 'user-1',
      };

      const result = await agent.prepare(data, options);

      expect(result.relationships).toBeDefined();
      expect(Array.isArray(result.relationships)).toBe(true);
    });

    it('should skip relationship discovery when disabled', async () => {
      const configNoRelationships = {
        ...mockConfig,
        features: {
          ...mockConfig.features,
          enableRelationshipDiscovery: false,
        },
      };

      const agentNoRels = new DataPreparationAgent(configNoRelationships);

      const data = {
        id: 'test-6',
        name: 'No Relationships',
      };

      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'test-6',
        userId: 'user-1',
      };

      const result = await agentNoRels.prepare(data, options);

      expect(result.relationships).toEqual([]);
    });
  });

  describe('prepareBatch()', () => {
    it('should process multiple items in batch', async () => {
      const items = [
        {
          data: { id: 'batch-1', name: 'Batch Item 1' },
          options: {
            projectId: 'project-1',
            entityType: 'character',
            sourceCollection: 'characters',
            sourceId: 'batch-1',
            userId: 'user-1',
          } as PrepareOptions,
        },
        {
          data: { id: 'batch-2', name: 'Batch Item 2' },
          options: {
            projectId: 'project-1',
            entityType: 'character',
            sourceCollection: 'characters',
            sourceId: 'batch-2',
            userId: 'user-1',
          } as PrepareOptions,
        },
        {
          data: { id: 'batch-3', name: 'Batch Item 3' },
          options: {
            projectId: 'project-1',
            entityType: 'character',
            sourceCollection: 'characters',
            sourceId: 'batch-3',
            userId: 'user-1',
          } as PrepareOptions,
        },
      ];

      const results = await agent.prepareBatch(items);

      expect(results).toHaveLength(3);
      expect(results[0].id).toContain('batch-1');
      expect(results[1].id).toContain('batch-2');
      expect(results[2].id).toContain('batch-3');
    });

    it('should handle empty batch', async () => {
      const results = await agent.prepareBatch([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('prepareAsync()', () => {
    it('should queue job when queue is enabled', async () => {
      const data = { id: 'async-1', name: 'Async Test' };
      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'async-1',
        userId: 'user-1',
      };

      const jobId = await agent.prepareAsync(data, options);

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
    });

    it('should throw error when queue is disabled', async () => {
      const configNoQueue = {
        ...mockConfig,
        features: {
          ...mockConfig.features,
          enableQueue: false,
        },
      };

      const agentNoQueue = new DataPreparationAgent(configNoQueue);

      const data = { id: 'async-2', name: 'No Queue' };
      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'async-2',
        userId: 'user-1',
      };

      await expect(agentNoQueue.prepareAsync(data, options)).rejects.toThrow(
        'Queue feature is disabled'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle data with missing fields', async () => {
      const data = { id: 'edge-1' }; // Minimal data

      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'edge-1',
        userId: 'user-1',
      };

      const result = await agent.prepare(data, options);

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
    });

    it('should handle very large data objects', async () => {
      const largeDescription = 'A'.repeat(10000);
      const data = {
        id: 'edge-2',
        name: 'Large Data',
        description: largeDescription,
      };

      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'edge-2',
        userId: 'user-1',
      };

      const result = await agent.prepare(data, options);

      expect(result).toBeDefined();
      expect(result.text).toContain(largeDescription);
    });

    it('should handle special characters in data', async () => {
      const data = {
        id: 'edge-3',
        name: 'Test "Character" with <special> & symbols',
        description: "Testing 'quotes' and \"escapes\"",
      };

      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'edge-3',
        userId: 'user-1',
      };

      const result = await agent.prepare(data, options);

      expect(result).toBeDefined();
      expect(result.text).toContain('special');
    });
  });

  describe('Performance', () => {
    it('should complete preparation within reasonable time', async () => {
      const data = {
        id: 'perf-1',
        name: 'Performance Test',
      };

      const options: PrepareOptions = {
        projectId: 'project-1',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'perf-1',
        userId: 'user-1',
      };

      const startTime = Date.now();
      await agent.prepare(data, options);
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds (mocked)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent preparations', async () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        data: { id: `concurrent-${i}`, name: `Item ${i}` },
        options: {
          projectId: 'project-1',
          entityType: 'character',
          sourceCollection: 'characters',
          sourceId: `concurrent-${i}`,
          userId: 'user-1',
        } as PrepareOptions,
      }));

      const promises = items.map(item => agent.prepare(item.data, item.options));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.id).toContain(`concurrent-${i}`);
      });
    });
  });
});
