/**
 * Allocate Resources Tool
 * Manages resource allocation for production tasks
 */

import { z } from 'zod';
import { tool } from '@codebuff/sdk';
import { MongoClient } from 'mongodb';

const AllocateResourcesInput = z.object({
  taskId: z.string().describe('Production task identifier'),
  taskType: z.enum(['character', 'story', 'visual', 'image', 'audio', 'composite']).describe('Task type'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium').describe('Task priority'),
  resources: z.object({
    computeUnits: z.number().optional().describe('Compute units required'),
    storage: z.number().optional().describe('Storage space required (MB)'),
    estimatedTime: z.number().optional().describe('Estimated time (minutes)'),
    agents: z.array(z.string()).optional().describe('Required agent types'),
  }).describe('Resource requirements'),
  constraints: z.object({
    maxBudget: z.number().optional().describe('Maximum budget allocation'),
    deadline: z.string().optional().describe('Task deadline (ISO 8601)'),
    dependencies: z.array(z.string()).optional().describe('Task dependencies'),
  }).optional(),
  metadata: z.object({
    projectId: z.string().optional(),
    episode: z.string().optional(),
    scene: z.string().optional(),
  }).optional(),
});

export const allocateResourcesTool = tool({
  name: 'allocate_resources',
  description: 'Allocate and manage resources for production tasks',
  input: AllocateResourcesInput,
  execute: async ({ taskId, taskType, priority, resources, constraints, metadata }) => {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const client = new MongoClient(mongoUri);

      await client.connect();
      const db = client.db('aladdin');
      const allocationsCollection = db.collection('resource_allocations');
      const poolCollection = db.collection('resource_pool');

      // Check available resources
      const pool = await poolCollection.findOne({ poolId: 'production-pool' });

      if (!pool) {
        await client.close();
        return {
          success: false,
          error: 'Resource pool not found',
          message: 'Cannot allocate resources - pool not initialized',
        };
      }

      // Calculate allocation based on priority and requirements
      const allocation = calculateAllocation(
        taskType,
        priority,
        resources,
        constraints,
        pool
      );

      if (!allocation.canAllocate) {
        await client.close();
        return {
          success: false,
          error: 'Insufficient resources available',
          message: `Cannot allocate resources: ${allocation.reason}`,
          availableResources: allocation.available,
          requestedResources: resources,
        };
      }

      // Create allocation record
      const document = {
        taskId,
        taskType,
        priority,
        allocatedResources: allocation.allocated,
        requestedResources: resources,
        constraints: constraints || {},
        metadata: metadata || {},
        status: 'allocated',
        allocationTime: new Date(),
        estimatedCompletion: allocation.estimatedCompletion,
      };

      await allocationsCollection.insertOne(document);

      // Update resource pool
      await poolCollection.updateOne(
        { poolId: 'production-pool' },
        {
          $inc: {
            'available.computeUnits': -allocation.allocated.computeUnits,
            'available.storage': -allocation.allocated.storage,
          },
          $push: {
            allocations: {
              taskId,
              resources: allocation.allocated,
              timestamp: new Date(),
            }
          }
        }
      );

      await client.close();

      return {
        success: true,
        taskId,
        allocatedResources: allocation.allocated,
        estimatedCompletion: allocation.estimatedCompletion,
        costEstimate: allocation.costEstimate,
        recommendations: allocation.recommendations,
        message: `Resources allocated successfully for task '${taskId}'`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to allocate resources',
      };
    }
  },
});

/**
 * Calculate resource allocation based on requirements and availability
 */
function calculateAllocation(
  taskType: string,
  priority: string,
  resources: any,
  constraints: any,
  pool: any
): any {
  // Base compute units by task type
  const baseComputeUnits: Record<string, number> = {
    character: 10,
    story: 5,
    visual: 20,
    image: 30,
    audio: 15,
    composite: 50,
  };

  const requestedCompute = resources.computeUnits || baseComputeUnits[taskType] || 10;
  const requestedStorage = resources.storage || 100;
  const estimatedTime = resources.estimatedTime || 30;

  // Priority multipliers
  const priorityMultiplier: Record<string, number> = {
    low: 0.8,
    medium: 1.0,
    high: 1.3,
    critical: 1.5,
  };

  const allocatedCompute = Math.ceil(requestedCompute * priorityMultiplier[priority]);
  const allocatedStorage = requestedStorage;

  // Check availability
  const available = pool.available || { computeUnits: 1000, storage: 10000 };
  const canAllocate =
    available.computeUnits >= allocatedCompute &&
    available.storage >= allocatedStorage;

  let reason = '';
  if (!canAllocate) {
    if (available.computeUnits < allocatedCompute) {
      reason = `Insufficient compute units (need ${allocatedCompute}, have ${available.computeUnits})`;
    } else {
      reason = `Insufficient storage (need ${allocatedStorage}MB, have ${available.storage}MB)`;
    }
  }

  // Calculate cost estimate
  const costPerUnit = 0.10; // $0.10 per compute unit
  const costPerMB = 0.01; // $0.01 per MB
  const costEstimate =
    (allocatedCompute * costPerUnit) +
    (allocatedStorage * costPerMB);

  // Estimated completion time
  const estimatedCompletion = new Date(
    Date.now() + estimatedTime * 60 * 1000
  );

  const recommendations: string[] = [];

  if (priority === 'low' && available.computeUnits < allocatedCompute * 2) {
    recommendations.push('Consider scheduling during off-peak hours');
  }

  if (allocatedStorage > 500) {
    recommendations.push('Large storage requirement - consider data compression');
  }

  return {
    canAllocate,
    reason,
    allocated: {
      computeUnits: allocatedCompute,
      storage: allocatedStorage,
      agents: resources.agents || [],
    },
    available,
    estimatedCompletion,
    costEstimate: Math.round(costEstimate * 100) / 100,
    recommendations,
  };
}
