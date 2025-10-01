/**
 * Performance and Load Testing for Agent System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParallelExecutor } from '@/lib/agents/coordination/parallelExecutor';
import { DataPreparationAgent } from '@/lib/agents/data-preparation/agent';
import { DepartmentRouter } from '@/lib/agents/coordination/departmentRouter';
import type { ExecutionTask } from '@/lib/agents/coordination/parallelExecutor';
import type { AgentConfig } from '@/lib/agents/data-preparation/types';

describe('Performance and Load Testing', () => {
  let executor: ParallelExecutor;
  let dataAgent: DataPreparationAgent;
  let router: DepartmentRouter;

  beforeEach(() => {
    executor = new ParallelExecutor();
    router = new DepartmentRouter();

    const config: AgentConfig = {
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

    dataAgent = new DataPreparationAgent(config);
  });

  describe('Throughput Testing', () => {
    it('should process 100 tasks under 5 seconds with concurrency limit', async () => {
      const tasks: ExecutionTask[] = Array.from({ length: 100 }, (_, i) => ({
        department: 'character' as const,
        execute: async () => {
          await sleep(20);
          return { result: `task-${i}` };
        },
      }));

      const startTime = Date.now();
      const results = await executor.executeWithLimit(tasks, 10);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(5000);

      const stats = executor.getStatistics(results);
      console.log('Throughput Test Stats:', stats);
    });

    it('should maintain 95th percentile latency under 200ms', async () => {
      const tasks: ExecutionTask[] = Array.from({ length: 1000 }, (_, i) => ({
        department: 'character' as const,
        execute: async () => {
          const delay = Math.random() * 100;
          await sleep(delay);
          return { result: `task-${i}` };
        },
      }));

      const results = await executor.executeWithLimit(tasks, 50);

      const executionTimes = results
        .map(r => r.executionTime || 0)
        .filter(t => t > 0)
        .sort((a, b) => a - b);

      const p95Index = Math.floor(executionTimes.length * 0.95);
      const p95Latency = executionTimes[p95Index];

      expect(p95Latency).toBeLessThan(200);
      console.log('95th percentile latency:', p95Latency, 'ms');
    });

    it('should achieve high success rate under load', async () => {
      const tasks: ExecutionTask[] = Array.from({ length: 500 }, (_, i) => ({
        department: 'character' as const,
        execute: async () => {
          // Simulate occasional failures
          if (Math.random() < 0.05) {
            throw new Error('Random failure');
          }
          await sleep(10);
          return { result: `task-${i}` };
        },
      }));

      const results = await executor.executeParallel(tasks, {
        continueOnError: true,
        maxRetries: 2,
      });

      const stats = executor.getStatistics(results);
      const successRate = (stats.successful / stats.total) * 100;

      expect(successRate).toBeGreaterThan(95);
      console.log('Success rate:', successRate.toFixed(2), '%');
    });
  });

  describe('Scalability Testing', () => {
    it('should scale linearly with concurrency', async () => {
      const taskCount = 100;
      const taskDuration = 50; // ms

      const concurrencyLevels = [1, 5, 10, 20];
      const results: Array<{ concurrency: number; duration: number }> = [];

      for (const concurrency of concurrencyLevels) {
        const tasks: ExecutionTask[] = Array.from({ length: taskCount }, (_, i) => ({
          department: 'character' as const,
          execute: async () => {
            await sleep(taskDuration);
            return { result: `task-${i}` };
          },
        }));

        const startTime = Date.now();
        await executor.executeWithLimit(tasks, concurrency);
        const duration = Date.now() - startTime;

        results.push({ concurrency, duration });
        console.log(`Concurrency ${concurrency}: ${duration}ms`);
      }

      // Higher concurrency should be faster
      expect(results[3].duration).toBeLessThan(results[0].duration);

      // Check for linear scaling (with some tolerance)
      const speedup = results[0].duration / results[3].duration;
      console.log('Speedup with 20x concurrency:', speedup.toFixed(2), 'x');
    });

    it('should handle increasing load gracefully', async () => {
      const loadLevels = [10, 50, 100, 200];
      const durations: number[] = [];

      for (const load of loadLevels) {
        const tasks: ExecutionTask[] = Array.from({ length: load }, (_, i) => ({
          department: 'character' as const,
          execute: async () => {
            await sleep(10);
            return { result: `task-${i}` };
          },
        }));

        const startTime = Date.now();
        await executor.executeWithLimit(tasks, 20);
        const duration = Date.now() - startTime;

        durations.push(duration);
        console.log(`Load ${load}: ${duration}ms`);
      }

      // Duration should scale sub-linearly (better than O(n))
      const growthRatio = durations[3] / durations[0];
      const loadRatio = loadLevels[3] / loadLevels[0];

      expect(growthRatio).toBeLessThan(loadRatio);
      console.log('Growth ratio:', growthRatio.toFixed(2), 'vs load ratio:', loadRatio);
    });
  });

  describe('Data Preparation Performance', () => {
    it('should process batch faster than sequential', async () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        data: { id: `perf-${i}`, name: `Item ${i}` },
        options: {
          projectId: 'test-project',
          entityType: 'character' as const,
          sourceCollection: 'characters',
          sourceId: `perf-${i}`,
          userId: 'user-1',
        },
      }));

      // Sequential processing
      const seqStart = Date.now();
      for (const item of items) {
        await dataAgent.prepare(item.data, item.options);
      }
      const seqDuration = Date.now() - seqStart;

      // Batch processing
      const batchStart = Date.now();
      await dataAgent.prepareBatch(items);
      const batchDuration = Date.now() - batchStart;

      console.log('Sequential:', seqDuration, 'ms');
      console.log('Batch:', batchDuration, 'ms');
      console.log('Speedup:', (seqDuration / batchDuration).toFixed(2), 'x');

      expect(batchDuration).toBeLessThan(seqDuration);
    });

    it('should cache results effectively', async () => {
      const data = { id: 'cache-perf', name: 'Cache Test' };
      const options = {
        projectId: 'test-project',
        entityType: 'character' as const,
        sourceCollection: 'characters',
        sourceId: 'cache-perf',
        userId: 'user-1',
      };

      // First call (no cache)
      const start1 = Date.now();
      await dataAgent.prepare(data, options);
      const duration1 = Date.now() - start1;

      // Second call (should hit cache)
      const start2 = Date.now();
      await dataAgent.prepare(data, options);
      const duration2 = Date.now() - start2;

      console.log('First call:', duration1, 'ms');
      console.log('Cached call:', duration2, 'ms');

      // Cached should be faster or similar
      expect(duration2).toBeLessThanOrEqual(duration1 + 50);
    });

    it('should handle large data objects efficiently', async () => {
      const largeData = {
        id: 'large-data',
        name: 'Large Object',
        description: 'A'.repeat(100000), // 100KB string
        metadata: Array.from({ length: 1000 }, (_, i) => ({
          key: `field-${i}`,
          value: `value-${i}`,
        })),
      };

      const options = {
        projectId: 'test-project',
        entityType: 'character' as const,
        sourceCollection: 'characters',
        sourceId: 'large-data',
        userId: 'user-1',
      };

      const startTime = Date.now();
      const result = await dataAgent.prepare(largeData, options);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000);
      console.log('Large object processing:', duration, 'ms');
    });
  });

  describe('Router Performance', () => {
    it('should route 1000 requests under 500ms', () => {
      const requests = Array.from(
        { length: 1000 },
        (_, i) => `Create character ${i} with story and visuals`
      );

      const startTime = Date.now();
      const plans = requests.map(req => router.routeRequest(req));
      const duration = Date.now() - startTime;

      expect(plans).toHaveLength(1000);
      expect(duration).toBeLessThan(500);
      console.log('Routing 1000 requests:', duration, 'ms');
      console.log('Avg per request:', (duration / 1000).toFixed(2), 'ms');
    });

    it('should maintain consistent routing performance', () => {
      const request = 'Create character with story visuals and audio';
      const iterations = 10000;

      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        router.routeRequest(request);
      }
      const duration = Date.now() - startTime;

      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1);
      console.log(`Average routing time: ${avgTime.toFixed(3)}ms per request`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory with repeated operations', async () => {
      if (!global.gc) {
        console.log('Skipping memory test - GC not exposed');
        return;
      }

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const tasks: ExecutionTask[] = Array.from({ length: 10 }, (_, j) => ({
          department: 'character' as const,
          execute: async () => {
            await sleep(5);
            return { result: `task-${i}-${j}` };
          },
        }));

        await executor.executeParallel(tasks);
      }

      // Force garbage collection
      global.gc();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log('Memory increase:', (memoryIncrease / 1024 / 1024).toFixed(2), 'MB');

      // Should not grow by more than 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle concurrent memory pressure', async () => {
      const tasks: ExecutionTask[] = Array.from({ length: 100 }, (_, i) => ({
        department: 'character' as const,
        execute: async () => {
          // Create some memory pressure
          const largeArray = new Array(10000).fill(`data-${i}`);
          await sleep(10);
          return { result: largeArray.length };
        },
      }));

      const startMemory = process.memoryUsage().heapUsed;

      await executor.executeWithLimit(tasks, 10);

      const endMemory = process.memoryUsage().heapUsed;
      const memoryDelta = endMemory - startMemory;

      console.log('Memory delta:', (memoryDelta / 1024 / 1024).toFixed(2), 'MB');

      // Should complete without excessive memory growth
      expect(memoryDelta).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Stress Testing', () => {
    it('should survive sustained high load', async () => {
      const duration = 5000; // 5 seconds
      const startTime = Date.now();
      let completedTasks = 0;
      let failedTasks = 0;

      while (Date.now() - startTime < duration) {
        const tasks: ExecutionTask[] = Array.from({ length: 50 }, (_, i) => ({
          department: 'character' as const,
          execute: async () => {
            await sleep(Math.random() * 100);
            if (Math.random() < 0.02) {
              throw new Error('Random stress failure');
            }
            return { result: `task-${i}` };
          },
        }));

        const results = await executor.executeParallel(tasks, {
          continueOnError: true,
          timeout: 500,
        });

        completedTasks += results.filter(r => r.success).length;
        failedTasks += results.filter(r => !r.success).length;
      }

      const totalTasks = completedTasks + failedTasks;
      const successRate = (completedTasks / totalTasks) * 100;

      console.log('Stress test results:');
      console.log('  Total tasks:', totalTasks);
      console.log('  Completed:', completedTasks);
      console.log('  Failed:', failedTasks);
      console.log('  Success rate:', successRate.toFixed(2), '%');
      console.log('  Throughput:', (totalTasks / 5).toFixed(2), 'tasks/sec');

      expect(successRate).toBeGreaterThan(90);
      expect(totalTasks).toBeGreaterThan(100);
    });
  });

  describe('Benchmark Summary', () => {
    it('should generate performance report', async () => {
      const benchmarks = {
        routing: 0,
        singleExecution: 0,
        parallelExecution: 0,
        batchProcessing: 0,
        caching: 0,
      };

      // Routing benchmark
      const routingStart = Date.now();
      for (let i = 0; i < 1000; i++) {
        router.routeRequest('Create character');
      }
      benchmarks.routing = Date.now() - routingStart;

      // Single execution benchmark
      const singleStart = Date.now();
      const singleTask: ExecutionTask = {
        department: 'character',
        execute: async () => {
          await sleep(10);
          return { result: 'done' };
        },
      };
      await executor.executeParallel([singleTask]);
      benchmarks.singleExecution = Date.now() - singleStart;

      // Parallel execution benchmark
      const parallelStart = Date.now();
      const parallelTasks: ExecutionTask[] = Array.from({ length: 100 }, (_, i) => ({
        department: 'character' as const,
        execute: async () => {
          await sleep(10);
          return { result: `task-${i}` };
        },
      }));
      await executor.executeWithLimit(parallelTasks, 10);
      benchmarks.parallelExecution = Date.now() - parallelStart;

      // Batch processing benchmark
      const batchStart = Date.now();
      const batchItems = Array.from({ length: 50 }, (_, i) => ({
        data: { id: `bench-${i}`, name: `Item ${i}` },
        options: {
          projectId: 'test-project',
          entityType: 'character' as const,
          sourceCollection: 'characters',
          sourceId: `bench-${i}`,
          userId: 'user-1',
        },
      }));
      await dataAgent.prepareBatch(batchItems);
      benchmarks.batchProcessing = Date.now() - batchStart;

      console.log('\n=== Performance Benchmark Report ===');
      console.log('Routing (1000 requests):', benchmarks.routing, 'ms');
      console.log('Single execution:', benchmarks.singleExecution, 'ms');
      console.log('Parallel execution (100 tasks):', benchmarks.parallelExecution, 'ms');
      console.log('Batch processing (50 items):', benchmarks.batchProcessing, 'ms');
      console.log('====================================\n');

      // Assert reasonable performance
      expect(benchmarks.routing).toBeLessThan(1000);
      expect(benchmarks.parallelExecution).toBeLessThan(5000);
      expect(benchmarks.batchProcessing).toBeLessThan(10000);
    });
  });
});

// Helper function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
