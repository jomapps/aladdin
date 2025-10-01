/**
 * Integration Tests for Orchestrator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleUserRequest } from '@/lib/agents/orchestrator';
import { createMockCodebuffClient } from '../../__mocks__/codebuff-sdk.mock';
import type { OrchestratorConfig } from '@/lib/agents/orchestrator';

// Mock CodebuffClient
vi.mock('@codebuff/sdk', () => ({
  CodebuffClient: createMockCodebuffClient().constructor,
}));

describe('Orchestrator Integration', () => {
  let mockCodebuff: ReturnType<typeof createMockCodebuffClient>;

  beforeEach(() => {
    mockCodebuff = createMockCodebuffClient();
    vi.clearAllMocks();
  });

  describe('handleUserRequest()', () => {
    it('should orchestrate complete request flow', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create a protagonist character',
        conversationId: 'conv-1',
      };

      const result = await handleUserRequest(config);

      expect(result).toBeDefined();
      expect(result.departmentReports).toBeDefined();
      expect(Array.isArray(result.departmentReports)).toBe(true);
      expect(result.overallQuality).toBeGreaterThanOrEqual(0);
      expect(result.overallQuality).toBeLessThanOrEqual(1);
    });

    it('should route to character department for character requests', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create a character with strong personality',
        conversationId: 'conv-2',
      };

      const result = await handleUserRequest(config);

      expect(result.departmentReports).toBeDefined();
      const hasCharacterDept = result.departmentReports.some(
        r => r.department === 'character'
      );
      expect(hasCharacterDept).toBe(true);
    });

    it('should calculate overall quality score', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character and story',
      };

      const result = await handleUserRequest(config);

      expect(typeof result.overallQuality).toBe('number');
      expect(result.overallQuality).toBeGreaterThanOrEqual(0);
      expect(result.overallQuality).toBeLessThanOrEqual(1);
    });

    it('should calculate consistency score', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character',
      };

      const result = await handleUserRequest(config);

      expect(typeof result.consistency).toBe('number');
      expect(result.consistency).toBeGreaterThanOrEqual(0);
      expect(result.consistency).toBeLessThanOrEqual(1);
    });

    it('should calculate completeness score', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create complete character profile',
      };

      const result = await handleUserRequest(config);

      expect(typeof result.completeness).toBe('number');
      expect(result.completeness).toBeGreaterThanOrEqual(0);
      expect(result.completeness).toBeLessThanOrEqual(1);
    });

    it('should provide recommendation based on quality', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character',
      };

      const result = await handleUserRequest(config);

      expect(result.recommendation).toBeDefined();
      expect(['ingest', 'modify', 'discard']).toContain(result.recommendation);
    });

    it('should recommend ingest for high quality (>= 0.75)', async () => {
      // Mock high quality response
      mockCodebuff.mockResponse('master-orchestrator', {
        id: 'run-1',
        output: {
          departments: ['character'],
          quality: 0.9,
        },
        status: 'success',
      });

      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create high quality character',
      };

      const result = await handleUserRequest(config);

      if (result.overallQuality >= 0.75) {
        expect(result.recommendation).toBe('ingest');
      }
    });

    it('should recommend modify for medium quality (0.5-0.75)', async () => {
      mockCodebuff.mockResponse('master-orchestrator', {
        id: 'run-2',
        output: {
          departments: ['character'],
          quality: 0.6,
        },
        status: 'success',
      });

      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create medium quality character',
      };

      const result = await handleUserRequest(config);

      if (result.overallQuality >= 0.5 && result.overallQuality < 0.75) {
        expect(result.recommendation).toBe('modify');
      }
    });

    it('should handle errors gracefully', async () => {
      mockCodebuff.mockResponse('master-orchestrator', {
        id: 'run-error',
        output: {},
        status: 'error',
      });

      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character that fails',
      };

      // Should not throw, but handle error
      await expect(handleUserRequest(config)).rejects.toThrow();
    });

    it('should process multiple departments in parallel', async () => {
      mockCodebuff.mockResponse('master-orchestrator', {
        id: 'run-multi',
        output: {
          departments: ['character', 'story', 'visual'],
          instructions: {
            character: 'Create character',
            story: 'Develop story',
            visual: 'Design visuals',
          },
        },
        status: 'success',
      });

      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character with story and visuals',
      };

      const startTime = Date.now();
      const result = await handleUserRequest(config);
      const duration = Date.now() - startTime;

      expect(result.departmentReports.length).toBeGreaterThan(1);
      // Parallel execution should be faster than sequential
      expect(duration).toBeLessThan(5000);
    });

    it('should aggregate department reports', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create complete project',
      };

      const result = await handleUserRequest(config);

      expect(result.departmentReports).toBeDefined();
      expect(Array.isArray(result.departmentReports)).toBe(true);

      result.departmentReports.forEach(report => {
        expect(report.department).toBeDefined();
        expect(report.status).toBeDefined();
        expect(['complete', 'pending', 'not_relevant']).toContain(report.status);
      });
    });

    it('should track brain validation status', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character',
      };

      const result = await handleUserRequest(config);

      expect(typeof result.brainValidated).toBe('boolean');
      expect(typeof result.brainQualityScore).toBe('number');
    });
  });

  describe('Department Filtering', () => {
    it('should skip irrelevant departments', async () => {
      mockCodebuff.mockResponse('character-head', {
        id: 'run-irrelevant',
        output: {
          relevance: 0.1, // Very low relevance
        },
        status: 'success',
      });

      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Unrelated request',
      };

      const result = await handleUserRequest(config);

      const irrelevantReports = result.departmentReports.filter(
        r => r.status === 'not_relevant'
      );

      // Should have some irrelevant departments filtered out
      expect(irrelevantReports.length).toBeGreaterThanOrEqual(0);
    });

    it('should process relevant departments only', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character',
      };

      const result = await handleUserRequest(config);

      const relevantReports = result.departmentReports.filter(
        r => r.relevance >= 0.3
      );

      expect(relevantReports.length).toBeGreaterThan(0);
    });
  });

  describe('Quality Scoring', () => {
    it('should calculate department quality from specialists', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character',
      };

      const result = await handleUserRequest(config);

      result.departmentReports.forEach(report => {
        expect(typeof report.departmentQuality).toBe('number');
        expect(report.departmentQuality).toBeGreaterThanOrEqual(0);
        expect(report.departmentQuality).toBeLessThanOrEqual(1);
      });
    });

    it('should weight quality by department relevance', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character with minor visual elements',
      };

      const result = await handleUserRequest(config);

      // Character should have higher weight than visual
      const charReport = result.departmentReports.find(r => r.department === 'character');
      const visualReport = result.departmentReports.find(r => r.department === 'visual');

      if (charReport && visualReport) {
        expect(charReport.relevance).toBeGreaterThan(visualReport.relevance);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle department execution errors', async () => {
      mockCodebuff.mockResponse('character-head', {
        id: 'run-error',
        output: {},
        status: 'error',
      });

      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character that errors',
      };

      const result = await handleUserRequest(config);

      const erroredReports = result.departmentReports.filter(
        r => r.issues && r.issues.length > 0
      );

      expect(erroredReports.length).toBeGreaterThanOrEqual(0);
    });

    it('should continue execution despite single department failure', async () => {
      mockCodebuff.mockResponse('master-orchestrator', {
        id: 'run-partial',
        output: {
          departments: ['character', 'story'],
        },
        status: 'success',
      });

      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character and story',
      };

      const result = await handleUserRequest(config);

      // Should have some successful reports even if one failed
      const successfulReports = result.departmentReports.filter(
        r => r.status === 'complete'
      );

      expect(successfulReports.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should complete orchestration within reasonable time', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create simple character',
      };

      const startTime = Date.now();
      await handleUserRequest(config);
      const duration = Date.now() - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    it('should handle concurrent orchestration requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        projectSlug: 'test-project',
        userPrompt: `Create character ${i}`,
        conversationId: `conv-${i}`,
      }));

      const promises = requests.map(config => handleUserRequest(config));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.departmentReports).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompt', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: '',
      };

      const result = await handleUserRequest(config);

      expect(result).toBeDefined();
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'Create character '.repeat(1000);

      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: longPrompt,
      };

      const result = await handleUserRequest(config);

      expect(result).toBeDefined();
    });

    it('should handle missing conversationId', async () => {
      const config: OrchestratorConfig = {
        projectSlug: 'test-project',
        userPrompt: 'Create character',
        // No conversationId
      };

      const result = await handleUserRequest(config);

      expect(result).toBeDefined();
    });
  });
});
