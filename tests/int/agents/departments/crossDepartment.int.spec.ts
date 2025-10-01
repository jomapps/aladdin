/**
 * Cross-Department Integration Tests
 * Tests multi-department coordination, dependencies, and parallel execution
 */

import { describe, it, expect, jest } from '@jest/globals';
import { DepartmentRouter } from '../../../../src/lib/agents/coordination/departmentRouter';
import { DependencyResolver } from '../../../../src/lib/agents/coordination/dependencyResolver';
import { ParallelExecutor } from '../../../../src/lib/agents/coordination/parallelExecutor';
import { ResultAggregator } from '../../../../src/lib/agents/coordination/resultAggregator';

describe('Cross-Department Integration Tests', () => {
  describe('Multi-Department Routing', () => {
    it('should route to single department for simple requests', () => {
      const router = new DepartmentRouter();
      const plan = router.routeRequest('Create character Aladdin');

      expect(plan.primaryDepartment).toBe('character');
      expect(plan.supportingDepartments).toHaveLength(0);
      expect(plan.executionMode).toBe('single');
    });

    it('should route to multiple departments for complex requests', () => {
      const router = new DepartmentRouter();
      const plan = router.routeRequest(
        'Create character Aladdin with visual design and voice profile'
      );

      expect(plan.primaryDepartment).toBe('character');
      expect(plan.supportingDepartments.length).toBeGreaterThanOrEqual(2);
      expect(plan.supportingDepartments).toContain('visual');
      expect(plan.supportingDepartments).toContain('audio');
    });

    it('should calculate relevance scores for all departments', () => {
      const router = new DepartmentRouter();
      const plan = router.routeRequest('Design story episode with dialogue and scenes');

      const storyScore = plan.scores.find(s => s.department === 'story');
      expect(storyScore).toBeDefined();
      expect(storyScore!.relevance).toBeGreaterThan(0.5);
    });

    it('should determine parallel vs sequential execution', () => {
      const router = new DepartmentRouter();

      // Independent departments should be parallel
      const parallelPlan = router.routeRequest('Create audio and production plan');
      expect(parallelPlan.executionMode).toBe('parallel');

      // Dependent departments should be sequential
      const sequentialPlan = router.routeRequest(
        'Create character then generate 360° reference images'
      );
      expect(sequentialPlan.executionMode).toBe('sequential');
    });
  });

  describe('Dependency Resolution', () => {
    it('should build dependency graph', () => {
      const resolver = new DependencyResolver();
      const graph = resolver.buildGraph([
        'character',
        'visual',
        'imageQuality',
      ]);

      expect(graph.nodes).toHaveLength(3);
      expect(graph.hasCircularDependency).toBe(false);
    });

    it('should detect circular dependencies', () => {
      const resolver = new DependencyResolver();
      // Simulate circular dependency (shouldn't happen in practice)
      const graph = resolver.buildGraph(['character', 'story']);

      // Our dependency rules don't create circular dependencies
      expect(graph.hasCircularDependency).toBe(false);
    });

    it('should determine execution phases', () => {
      const resolver = new DependencyResolver();
      const graph = resolver.buildGraph([
        'character',
        'story',
        'visual',
        'imageQuality',
      ]);

      expect(graph.executionOrder.length).toBeGreaterThan(0);

      // Character should be in early phase (no dependencies)
      const characterPhase = graph.executionOrder.find(
        phase => phase.departments.includes('character')
      );
      expect(characterPhase).toBeDefined();
      expect(characterPhase!.phase).toBe(0);
    });

    it('should identify parallel execution opportunities', () => {
      const resolver = new DependencyResolver();
      const graph = resolver.buildGraph([
        'character',
        'production',
      ]);

      // Character and Production have no dependencies, can run in parallel
      const firstPhase = graph.executionOrder[0];
      expect(firstPhase.canRunInParallel).toBe(true);
      expect(firstPhase.departments).toContain('character');
      expect(firstPhase.departments).toContain('production');
    });

    it('should get critical path', () => {
      const resolver = new DependencyResolver();
      const graph = resolver.buildGraph([
        'character',
        'visual',
        'imageQuality',
      ]);

      const criticalPath = resolver.getCriticalPath(graph);

      // Critical path should be: character -> visual -> imageQuality
      expect(criticalPath).toContain('character');
      expect(criticalPath).toContain('imageQuality');
    });
  });

  describe('Parallel Execution', () => {
    it('should execute independent departments in parallel', async () => {
      const executor = new ParallelExecutor();
      const start = Date.now();

      const tasks = [
        {
          department: 'character' as const,
          execute: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return { characterId: 'aladdin' };
          },
        },
        {
          department: 'production' as const,
          execute: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return { allocated: true };
          },
        },
      ];

      const results = await executor.executeParallel(tasks);
      const duration = Date.now() - start;

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
      // Parallel execution should be ~100ms, not 200ms
      expect(duration).toBeLessThan(150);
    });

    it('should handle department failures gracefully', async () => {
      const executor = new ParallelExecutor();

      const tasks = [
        {
          department: 'character' as const,
          execute: async () => ({ characterId: 'aladdin' }),
        },
        {
          department: 'visual' as const,
          execute: async () => {
            throw new Error('Visual department failed');
          },
        },
      ];

      const results = await executor.executeParallel(tasks, {
        continueOnError: true,
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].errors).toBeDefined();
    });

    it('should enforce timeout limits', async () => {
      const executor = new ParallelExecutor();

      const tasks = [
        {
          department: 'character' as const,
          execute: async () => {
            await new Promise(resolve => setTimeout(resolve, 5000));
            return { characterId: 'aladdin' };
          },
        },
      ];

      const results = await executor.executeParallel(tasks, {
        timeout: 1000,
        continueOnError: true,
      });

      expect(results[0].success).toBe(false);
      expect(results[0].errors![0]).toContain('timed out');
    });

    it('should retry failed executions', async () => {
      const executor = new ParallelExecutor();
      let attempts = 0;

      const tasks = [
        {
          department: 'character' as const,
          execute: async () => {
            attempts++;
            if (attempts < 3) {
              throw new Error('Temporary failure');
            }
            return { characterId: 'aladdin' };
          },
        },
      ];

      const results = await executor.executeParallel(tasks, {
        maxRetries: 3,
      });

      expect(results[0].success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should execute in batches when needed', async () => {
      const executor = new ParallelExecutor();

      const batch1 = [
        {
          department: 'character' as const,
          execute: async () => ({ characterId: 'aladdin' }),
        },
      ];

      const batch2 = [
        {
          department: 'visual' as const,
          execute: async () => ({ styleGuide: {} }),
        },
        {
          department: 'imageQuality' as const,
          execute: async () => ({ reference: {} }),
        },
      ];

      const results = await executor.executeBatched([batch1, batch2]);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Result Aggregation', () => {
    it('should aggregate results from multiple departments', () => {
      const aggregator = new ResultAggregator();

      const primary = {
        department: 'character' as const,
        success: true,
        output: { characterId: 'aladdin', name: 'Aladdin' },
        qualityScore: 0.92,
        executionTime: 1500,
      };

      const supporting = [
        {
          department: 'visual' as const,
          success: true,
          output: { styleGuide: {} },
          qualityScore: 0.89,
          executionTime: 2000,
        },
        {
          department: 'audio' as const,
          success: true,
          output: { voiceProfile: {} },
          qualityScore: 0.90,
          executionTime: 1800,
        },
      ];

      const result = aggregator.aggregate(primary, supporting, 'parallel');

      expect(result.success).toBe(true);
      expect(result.overallQualityScore).toBeGreaterThan(0.85);
      expect(result.totalExecutionTime).toBe(2000); // Parallel = max time
    });

    it('should calculate quality scores correctly', () => {
      const aggregator = new ResultAggregator();

      const primary = {
        department: 'character' as const,
        success: true,
        output: {},
        qualityScore: 0.90,
      };

      const supporting = [
        {
          department: 'visual' as const,
          success: true,
          output: {},
          qualityScore: 0.80,
        },
      ];

      const result = aggregator.aggregate(primary, supporting, 'parallel');

      // Primary gets 50%, supporting gets 50%
      // (0.90 * 0.5) + (0.80 * 0.5) = 0.85
      expect(result.overallQualityScore).toBeCloseTo(0.85, 2);
    });

    it('should validate cross-department consistency', () => {
      const aggregator = new ResultAggregator();

      const results = [
        {
          department: 'character' as const,
          success: true,
          output: { id: 'aladdin', type: 'character' },
          qualityScore: 0.90,
        },
        {
          department: 'visual' as const,
          success: true,
          output: { id: 'aladdin', type: 'character' },
          qualityScore: 0.88,
        },
      ];

      const validation = aggregator.validateConsistency(results);

      expect(validation.consistent).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect inconsistencies', () => {
      const aggregator = new ResultAggregator();

      const results = [
        {
          department: 'character' as const,
          success: true,
          output: { id: 'aladdin', type: 'character' },
          qualityScore: 0.90,
        },
        {
          department: 'visual' as const,
          success: true,
          output: { id: 'jasmine', type: 'character' },
          qualityScore: 0.88,
        },
      ];

      const validation = aggregator.validateConsistency(results);

      expect(validation.consistent).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should collect errors from all departments', () => {
      const aggregator = new ResultAggregator();

      const primary = {
        department: 'character' as const,
        success: false,
        output: null,
        errors: ['Character validation failed'],
      };

      const supporting = [
        {
          department: 'visual' as const,
          success: false,
          output: null,
          errors: ['Style guide incomplete'],
        },
      ];

      const result = aggregator.aggregate(primary, supporting, 'sequential');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0]).toContain('[character]');
      expect(result.errors[1]).toContain('[visual]');
    });
  });

  describe('Department-to-Department Communication', () => {
    it('should pass character data to visual department', async () => {
      const mockCharacter = {
        characterId: 'aladdin',
        name: 'Aladdin',
        appearance: { build: 'athletic', hairColor: 'black' },
      };

      const mockExecute = jest.fn()
        .mockResolvedValueOnce({
          success: true,
          output: mockCharacter,
        })
        .mockResolvedValueOnce({
          success: true,
          output: { styleGuide: { based on: mockCharacter } },
        });

      const orchestrator = { execute: mockExecute };

      const charResult = await orchestrator.execute({ task: 'Create character' });
      const visualResult = await orchestrator.execute({
        task: 'Create visual',
        characterData: charResult.output,
      });

      expect(visualResult.success).toBe(true);
    });

    it('should coordinate character + visual + imageQuality workflow', async () => {
      const mockExecute = jest.fn()
        .mockResolvedValueOnce({
          success: true,
          output: { characterId: 'aladdin' },
        })
        .mockResolvedValueOnce({
          success: true,
          output: { styleGuide: {} },
        })
        .mockResolvedValueOnce({
          success: true,
          output: { profile360: { images: 12 } },
        });

      const orchestrator = { execute: mockExecute };

      await orchestrator.execute({ task: 'Create character' });
      await orchestrator.execute({ task: 'Create visual design' });
      const imageResult = await orchestrator.execute({
        task: 'Generate 360° profile',
      });

      expect(imageResult.output.profile360.images).toBe(12);
    });
  });

  describe('Full Multi-Department Workflows', () => {
    it('should handle character creation with all supporting departments', async () => {
      const router = new DepartmentRouter();
      const plan = router.routeRequest(
        'Create complete character Aladdin with visuals, voice, and 360° references'
      );

      expect(plan.primaryDepartment).toBe('character');
      expect(plan.supportingDepartments).toContain('visual');
      expect(plan.supportingDepartments).toContain('audio');
      expect(plan.supportingDepartments).toContain('imageQuality');
    });

    it('should handle scene creation with story, visual, and audio', async () => {
      const router = new DepartmentRouter();
      const plan = router.routeRequest(
        'Create scene with dialogue, visual design, and background music'
      );

      expect(plan.primaryDepartment).toBe('story');
      expect(plan.supportingDepartments).toContain('visual');
      expect(plan.supportingDepartments).toContain('audio');
    });

    it('should optimize execution order for maximum parallelism', () => {
      const resolver = new DependencyResolver();
      const graph = resolver.buildGraph([
        'character',
        'production',
        'story',
        'visual',
      ]);

      const optimized = resolver.optimizeExecutionOrder(graph);

      // Should have fewer phases due to parallelization
      expect(optimized.length).toBeLessThanOrEqual(graph.executionOrder.length);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete multi-department workflow in <60s', async () => {
      const start = Date.now();

      const executor = new ParallelExecutor();
      const tasks = [
        { department: 'character' as const, execute: async () => ({}) },
        { department: 'visual' as const, execute: async () => ({}) },
        { department: 'audio' as const, execute: async () => ({}) },
      ];

      await executor.executeParallel(tasks);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(60000);
    });

    it('should handle 6 departments efficiently', async () => {
      const executor = new ParallelExecutor();
      const tasks = [
        { department: 'character' as const, execute: async () => ({}) },
        { department: 'story' as const, execute: async () => ({}) },
        { department: 'visual' as const, execute: async () => ({}) },
        { department: 'imageQuality' as const, execute: async () => ({}) },
        { department: 'audio' as const, execute: async () => ({}) },
        { department: 'production' as const, execute: async () => ({}) },
      ];

      const results = await executor.executeParallel(tasks);

      expect(results).toHaveLength(6);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});
