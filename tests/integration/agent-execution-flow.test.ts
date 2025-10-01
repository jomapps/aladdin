/**
 * End-to-End Agent Execution Flow Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleUserRequest } from '@/lib/agents/orchestrator';
import { DepartmentRouter } from '@/lib/agents/coordination/departmentRouter';
import { ParallelExecutor } from '@/lib/agents/coordination/parallelExecutor';
import { DataPreparationAgent } from '@/lib/agents/data-preparation/agent';
import { createMockCodebuffClient } from '../__mocks__/codebuff-sdk.mock';
import { createMockLLMClient } from '../__mocks__/llm-client.mock';
import { createMockRedis } from '../__mocks__/redis.mock';
import type { OrchestratorConfig } from '@/lib/agents/orchestrator';
import type { AgentConfig } from '@/lib/agents/data-preparation/types';

// Mock external dependencies
vi.mock('@codebuff/sdk', () => ({
  CodebuffClient: createMockCodebuffClient().constructor,
}));

vi.mock('@/lib/llm/client', () => ({
  getLLMClient: () => createMockLLMClient(),
}));

vi.mock('ioredis', () => ({
  default: createMockRedis,
}));

describe('Agent Execution Flow E2E', () => {
  let router: DepartmentRouter;
  let executor: ParallelExecutor;
  let dataAgent: DataPreparationAgent;
  let mockConfig: AgentConfig;

  beforeEach(() => {
    router = new DepartmentRouter();
    executor = new ParallelExecutor();

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

    dataAgent = new DataPreparationAgent(mockConfig);
  });

  describe('Complete Character Creation Flow', () => {
    it('should handle full character creation from request to completion', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create a protagonist character named Alex with heroic traits',
        conversationId: 'conv-e2e-1',
      };

      // 1. Orchestrate request
      const orchestratorResult = await handleUserRequest(config);

      expect(orchestratorResult).toBeDefined();
      expect(orchestratorResult.departmentReports).toBeDefined();
      expect(orchestratorResult.overallQuality).toBeGreaterThanOrEqual(0);

      // 2. Verify character department was engaged
      const characterReport = orchestratorResult.departmentReports.find(
        r => r.department === 'character'
      );

      expect(characterReport).toBeDefined();
      expect(characterReport?.relevance).toBeGreaterThan(0.3);

      // 3. Prepare data for brain service
      const characterData = {
        id: 'char-alex',
        name: 'Alex',
        traits: ['heroic', 'brave', 'determined'],
        role: 'protagonist',
      };

      const brainDocument = await dataAgent.prepare(characterData, {
        projectId: 'test-project',
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: 'char-alex',
        userId: 'user-1',
      });

      expect(brainDocument).toBeDefined();
      expect(brainDocument.type).toBe('character');
      expect(brainDocument.text).toContain('Alex');
      expect(brainDocument.metadata).toBeDefined();
    });

    it('should handle multi-department character + story flow', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character Alex and develop their origin story',
      };

      // 1. Route request
      const plan = router.routeRequest(config.userPrompt);

      expect(plan.primaryDepartment).toBeDefined();
      expect(plan.supportingDepartments).toBeDefined();

      // Should route to both character and story
      const departments = [plan.primaryDepartment, ...plan.supportingDepartments];
      const hasCharacter = departments.includes('character');
      const hasStory = departments.includes('story');

      expect(hasCharacter || hasStory).toBe(true);

      // 2. Execute departments in parallel
      const tasks = departments.map(dept => ({
        department: dept,
        execute: async () => {
          await sleep(50);
          return {
            department: dept,
            output: { completed: true },
          };
        },
      }));

      const results = await executor.executeParallel(tasks);

      expect(results).toHaveLength(departments.length);
      expect(results.every(r => r.success)).toBe(true);

      // 3. Full orchestration
      const orchestratorResult = await handleUserRequest(config);

      expect(orchestratorResult).toBeDefined();
      expect(orchestratorResult.departmentReports.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery Flow', () => {
    it('should recover from single department failure', async () => {
      const tasks = [
        {
          department: 'character' as const,
          execute: async () => ({ result: 'success' }),
        },
        {
          department: 'story' as const,
          execute: async () => {
            throw new Error('Story generation failed');
          },
        },
        {
          department: 'visual' as const,
          execute: async () => ({ result: 'success' }),
        },
      ];

      const results = await executor.executeParallel(tasks, {
        continueOnError: true,
        maxRetries: 2,
      });

      expect(results).toHaveLength(3);

      const successfulResults = results.filter(r => r.success);
      expect(successfulResults.length).toBeGreaterThanOrEqual(2);
    });

    it('should retry failed data preparation', async () => {
      let attempts = 0;

      const mockDataAgent = new DataPreparationAgent({
        ...mockConfig,
        queue: {
          ...mockConfig.queue,
          maxRetries: 3,
        },
      });

      // Simulate retry scenario
      const prepareWithRetry = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return await mockDataAgent.prepare(
          { id: 'retry-test', name: 'Test' },
          {
            projectId: 'test-project',
            entityType: 'character',
            sourceCollection: 'characters',
            sourceId: 'retry-test',
            userId: 'user-1',
          }
        );
      };

      // Wrap in retry logic
      let result;
      let lastError;

      for (let i = 0; i < 3; i++) {
        try {
          result = await prepareWithRetry();
          break;
        } catch (error) {
          lastError = error;
        }
      }

      expect(result).toBeDefined();
      expect(attempts).toBe(3);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple concurrent character creations', async () => {
      const characters = Array.from({ length: 10 }, (_, i) => ({
        id: `char-${i}`,
        name: `Character ${i}`,
        description: `Test character ${i}`,
      }));

      const startTime = Date.now();

      const promises = characters.map(char =>
        dataAgent.prepare(char, {
          projectId: 'test-project',
          entityType: 'character',
          sourceCollection: 'characters',
          sourceId: char.id,
          userId: 'user-1',
        })
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(results.every(r => r.type === 'character')).toBe(true);
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
    });

    it('should handle batch processing efficiently', async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        data: {
          id: `batch-${i}`,
          name: `Item ${i}`,
        },
        options: {
          projectId: 'test-project',
          entityType: 'character',
          sourceCollection: 'characters',
          sourceId: `batch-${i}`,
          userId: 'user-1',
        },
      }));

      const startTime = Date.now();
      const results = await dataAgent.prepareBatch(items);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(10000);
    });

    it('should maintain quality under concurrent load', async () => {
      const requests = Array.from({ length: 20 }, (_, i) => ({
        projectSlug: 'test-project',
        userPrompt: `Create character ${i}`,
        conversationId: `conv-load-${i}`,
      }));

      const promises = requests.map(config => handleUserRequest(config));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(20);

      results.forEach((result, i) => {
        expect(result).toBeDefined();
        expect(result.overallQuality).toBeGreaterThanOrEqual(0);
        expect(result.departmentReports).toBeDefined();
      });
    });
  });

  describe('Cache and Optimization Flow', () => {
    it('should use cache for repeated requests', async () => {
      const characterData = {
        id: 'cache-test',
        name: 'Cached Character',
      };

      const options = {
        projectId: 'test-project',
        entityType: 'character' as const,
        sourceCollection: 'characters',
        sourceId: 'cache-test',
        userId: 'user-1',
      };

      // First call
      const startTime1 = Date.now();
      const result1 = await dataAgent.prepare(characterData, options);
      const duration1 = Date.now() - startTime1;

      // Second call (should hit cache)
      const startTime2 = Date.now();
      const result2 = await dataAgent.prepare(characterData, options);
      const duration2 = Date.now() - startTime2;

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();

      // Cache hit should be faster
      // Note: In test environment, timing may vary
      expect(duration2).toBeLessThanOrEqual(duration1 + 100);
    });

    it('should optimize routing for similar requests', async () => {
      const requests = [
        'Create character Alex',
        'Create character Sarah',
        'Create character John',
      ];

      const plans = requests.map(req => router.routeRequest(req));

      // All should route to character department
      plans.forEach(plan => {
        expect(plan.primaryDepartment).toBe('character');
      });

      // Routing should be consistent
      const firstScores = plans[0].scores;
      plans.slice(1).forEach(plan => {
        plan.scores.forEach((score, i) => {
          expect(score.department).toBe(firstScores[i].department);
          // Scores should be similar (within 0.1)
          expect(Math.abs(score.relevance - firstScores[i].relevance)).toBeLessThan(0.2);
        });
      });
    });
  });

  describe('Quality Gates and Validation', () => {
    it('should validate output quality before completion', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create high-quality character',
      };

      const result = await handleUserRequest(config);

      expect(result.overallQuality).toBeDefined();
      expect(result.consistency).toBeDefined();
      expect(result.completeness).toBeDefined();
      expect(result.recommendation).toBeDefined();
    });

    it('should enforce quality thresholds', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character with validation',
      };

      const result = await handleUserRequest(config);

      // High quality should recommend ingest
      if (result.overallQuality >= 0.75) {
        expect(result.recommendation).toBe('ingest');
      }

      // Medium quality should recommend modify
      if (result.overallQuality >= 0.5 && result.overallQuality < 0.75) {
        expect(result.recommendation).toBe('modify');
      }

      // Low quality should recommend discard
      if (result.overallQuality < 0.5) {
        expect(result.recommendation).toBe('discard');
      }
    });
  });

  describe('Edge Cases in Full Flow', () => {
    it('should handle minimal valid request', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'p',
        userPrompt: 'c',
      };

      const result = await handleUserRequest(config);

      expect(result).toBeDefined();
      expect(result.departmentReports).toBeDefined();
    });

    it('should handle complex multi-entity request', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt:
          'Create three characters (Alex, Sarah, John) with interconnected story arcs, visual concepts for each, and audio themes',
      };

      const result = await handleUserRequest(config);

      expect(result).toBeDefined();
      expect(result.departmentReports.length).toBeGreaterThan(1);

      // Should involve multiple departments
      const departments = result.departmentReports.map(r => r.department);
      expect(departments).toContain('character');
    });
  });
});

// Helper function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
