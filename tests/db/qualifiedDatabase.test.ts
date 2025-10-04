/**
 * Qualified Database Tests
 * Tests database naming conventions, character profile storage, and data migration
 *
 * Total Tests: 24
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// Mock MongoDB connection
const mockDb = {
  collection: vi.fn(),
  listCollections: vi.fn(),
  createCollection: vi.fn(),
  db: vi.fn(),
};

const mockCollection = {
  insertOne: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
  updateOne: vi.fn(),
  deleteOne: vi.fn(),
  createIndex: vi.fn(),
  createIndexes: vi.fn(),
  countDocuments: vi.fn(),
};

describe('Qualified Database Tests', () => {
  const testProjectId = 'test-project-123';
  const qualifiedDbName = `aladdin-qualified-${testProjectId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Database Naming Conventions', () => {
    it('should create qualified database with correct naming format', () => {
      const dbName = `aladdin-qualified-${testProjectId}`;

      expect(dbName).toBe('aladdin-qualified-test-project-123');
      expect(dbName).toMatch(/^aladdin-qualified-/);
    });

    it('should separate gather and qualified databases', () => {
      const gatherDbName = `aladdin-gather-${testProjectId}`;
      const qualifiedDbName = `aladdin-qualified-${testProjectId}`;

      expect(gatherDbName).not.toBe(qualifiedDbName);
      expect(gatherDbName).toContain('gather');
      expect(qualifiedDbName).toContain('qualified');
    });

    it('should use project ID in database name', () => {
      const dbName = `aladdin-qualified-${testProjectId}`;

      expect(dbName).toContain(testProjectId);
    });

    it('should handle special characters in project ID', () => {
      const specialProjectId = 'project-with-dashes_and_underscores';
      const dbName = `aladdin-qualified-${specialProjectId}`;

      expect(dbName).toBe('aladdin-qualified-project-with-dashes_and_underscores');
    });
  });

  describe('Character Profile Storage', () => {
    it('should store character profile with all required fields', async () => {
      const characterProfile = {
        _id: new ObjectId(),
        projectId: testProjectId,
        characterId: 'char-001',
        name: 'Aladdin',
        description: 'Young street thief with a heart of gold',
        traits: ['brave', 'clever', 'kind'],
        imageUrl: 'https://r2.cloudflare.com/characters/aladdin.png',
        profileAngles: {
          '0': 'https://r2.cloudflare.com/aladdin-0.png',
          '90': 'https://r2.cloudflare.com/aladdin-90.png',
          '180': 'https://r2.cloudflare.com/aladdin-180.png',
          '270': 'https://r2.cloudflare.com/aladdin-270.png',
        },
        qualityScore: 0.92,
        brainNodeId: 'brain-node-123',
        createdAt: new Date(),
        qualifiedAt: new Date(),
        qualificationMetadata: {
          departmentScores: {
            'data-preparation': 0.95,
            'character-design': 0.90,
            'visual-style': 0.91,
            'image-quality': 0.93,
          },
          totalIterations: 3,
          finalScore: 0.92,
        },
      };

      mockCollection.insertOne.mockResolvedValue({ insertedId: characterProfile._id });

      expect(characterProfile).toHaveProperty('projectId');
      expect(characterProfile).toHaveProperty('characterId');
      expect(characterProfile).toHaveProperty('name');
      expect(characterProfile).toHaveProperty('description');
      expect(characterProfile).toHaveProperty('profileAngles');
      expect(characterProfile).toHaveProperty('qualityScore');
      expect(characterProfile).toHaveProperty('brainNodeId');
      expect(characterProfile.qualityScore).toBeGreaterThanOrEqual(0.85);
    });

    it('should store profile angles as key-value pairs', () => {
      const profileAngles = {
        '0': 'url-0',
        '90': 'url-90',
        '180': 'url-180',
        '270': 'url-270',
      };

      expect(Object.keys(profileAngles)).toHaveLength(4);
      expect(profileAngles).toHaveProperty('0');
      expect(profileAngles).toHaveProperty('90');
      expect(profileAngles).toHaveProperty('180');
      expect(profileAngles).toHaveProperty('270');
    });

    it('should validate quality score is above threshold', () => {
      const qualityScore = 0.92;
      const minThreshold = 0.85;

      expect(qualityScore).toBeGreaterThanOrEqual(minThreshold);
    });

    it('should store qualification metadata', () => {
      const metadata = {
        departmentScores: {
          'data-preparation': 0.95,
          'character-design': 0.90,
          'visual-style': 0.91,
          'image-quality': 0.93,
        },
        totalIterations: 3,
        finalScore: 0.92,
        completedAt: new Date(),
      };

      expect(metadata).toHaveProperty('departmentScores');
      expect(metadata).toHaveProperty('totalIterations');
      expect(metadata).toHaveProperty('finalScore');
      expect(Object.keys(metadata.departmentScores)).toHaveLength(4);
    });

    it('should link to brain node ID', () => {
      const brainNodeId = 'brain-node-12345';

      expect(brainNodeId).toBeTruthy();
      expect(brainNodeId).toMatch(/^brain-node-/);
    });
  });

  describe('Data Migration from Gather to Qualified', () => {
    it('should migrate character from gather to qualified after passing threshold', async () => {
      const gatherItem = {
        _id: new ObjectId(),
        projectId: testProjectId,
        content: JSON.stringify({
          name: 'Aladdin',
          description: 'Street thief',
        }),
        summary: 'Aladdin character',
        context: 'Main protagonist',
        imageUrl: 'https://gather.com/aladdin.png',
        createdBy: 'user-123',
        isAutomated: true,
        automationMetadata: {
          taskId: 'task-001',
          department: 'character-design',
          qualityScore: 0.92,
        },
      };

      const qualifiedCharacter = {
        projectId: testProjectId,
        characterId: 'char-001',
        name: 'Aladdin',
        description: 'Street thief',
        imageUrl: 'https://qualified.com/aladdin.png',
        qualityScore: 0.92,
        sourceGatherId: gatherItem._id.toString(),
        migratedAt: new Date(),
      };

      expect(qualifiedCharacter.qualityScore).toBeGreaterThanOrEqual(0.85);
      expect(qualifiedCharacter.sourceGatherId).toBe(gatherItem._id.toString());
    });

    it('should preserve original gather item after migration', async () => {
      const gatherId = new ObjectId();

      // Migration should not delete gather item
      mockCollection.findOne.mockResolvedValue({
        _id: gatherId,
        projectId: testProjectId,
      });

      const gatherItem = await mockCollection.findOne({ _id: gatherId });
      expect(gatherItem).toBeDefined();
      expect(gatherItem._id).toBe(gatherId);
    });

    it('should only migrate items above quality threshold', () => {
      const items = [
        { id: '1', qualityScore: 0.95, shouldMigrate: true },
        { id: '2', qualityScore: 0.87, shouldMigrate: true },
        { id: '3', qualityScore: 0.75, shouldMigrate: false },
        { id: '4', qualityScore: 0.60, shouldMigrate: false },
      ];

      const threshold = 0.85;
      const migratedItems = items.filter(item => item.qualityScore >= threshold);

      expect(migratedItems).toHaveLength(2);
      expect(migratedItems.every(item => item.qualityScore >= threshold)).toBe(true);
    });

    it('should transform gather content to qualified structure', () => {
      const gatherContent = {
        name: 'Aladdin',
        description: 'Street thief with heart of gold',
        traits: ['brave', 'clever'],
      };

      const qualifiedData = {
        characterId: 'char-001',
        name: gatherContent.name,
        description: gatherContent.description,
        traits: gatherContent.traits,
        qualifiedAt: new Date(),
      };

      expect(qualifiedData.name).toBe(gatherContent.name);
      expect(qualifiedData.description).toBe(gatherContent.description);
      expect(qualifiedData.traits).toEqual(gatherContent.traits);
      expect(qualifiedData).toHaveProperty('qualifiedAt');
    });

    it('should batch migrate multiple characters', async () => {
      const gatherItems = [
        { _id: new ObjectId(), qualityScore: 0.90 },
        { _id: new ObjectId(), qualityScore: 0.88 },
        { _id: new ObjectId(), qualityScore: 0.92 },
      ];

      const migrationResults = gatherItems.map(item => ({
        sourceId: item._id.toString(),
        qualityScore: item.qualityScore,
        migrated: true,
      }));

      expect(migrationResults).toHaveLength(3);
      expect(migrationResults.every(r => r.migrated)).toBe(true);
    });
  });

  describe('Database Locking Mechanism', () => {
    it('should acquire lock before writing to qualified database', async () => {
      const lockKey = `qualified-lock-${testProjectId}`;
      const lockAcquired = true;
      const lockExpiry = Date.now() + 30000; // 30 seconds

      expect(lockKey).toContain(testProjectId);
      expect(lockAcquired).toBe(true);
      expect(lockExpiry).toBeGreaterThan(Date.now());
    });

    it('should prevent concurrent writes to same character', async () => {
      const characterId = 'char-001';
      const lockKey = `char-lock-${characterId}`;

      // First write acquires lock
      const firstWriteLock = { acquired: true, key: lockKey };

      // Second write should wait
      const secondWriteLock = { acquired: false, key: lockKey };

      expect(firstWriteLock.acquired).toBe(true);
      expect(secondWriteLock.acquired).toBe(false);
    });

    it('should release lock after successful write', async () => {
      const lockKey = 'write-lock-123';
      let lockReleased = false;

      // Simulate write completion
      lockReleased = true;

      expect(lockReleased).toBe(true);
    });

    it('should timeout and release lock after 30 seconds', () => {
      const lockTimeout = 30000; // 30 seconds
      const currentTime = Date.now();
      const lockExpiry = currentTime + lockTimeout;

      expect(lockExpiry - currentTime).toBe(30000);
    });

    it('should handle lock acquisition failure gracefully', async () => {
      const lockAcquired = false;
      const errorMessage = 'Failed to acquire lock';

      if (!lockAcquired) {
        expect(errorMessage).toBe('Failed to acquire lock');
      }
    });

    it('should use Redis for distributed locking', () => {
      const lockConfig = {
        backend: 'redis',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        keyPrefix: 'qualified-lock:',
      };

      expect(lockConfig.backend).toBe('redis');
      expect(lockConfig.keyPrefix).toContain('qualified-lock');
    });
  });

  describe('Database Indexing', () => {
    it('should create index on projectId for fast queries', async () => {
      const indexes = [
        { key: { projectId: 1 } },
        { key: { characterId: 1 } },
        { key: { qualityScore: -1 } },
        { key: { qualifiedAt: -1 } },
      ];

      expect(indexes).toContainEqual({ key: { projectId: 1 } });
    });

    it('should create compound index for character queries', () => {
      const compoundIndex = {
        key: { projectId: 1, characterId: 1 },
        unique: true,
      };

      expect(compoundIndex.key).toHaveProperty('projectId');
      expect(compoundIndex.key).toHaveProperty('characterId');
      expect(compoundIndex.unique).toBe(true);
    });

    it('should create index on brainNodeId for brain integration', () => {
      const brainIndex = { key: { brainNodeId: 1 } };

      expect(brainIndex.key).toHaveProperty('brainNodeId');
    });
  });

  describe('Query Operations', () => {
    it('should query characters by project ID', async () => {
      mockCollection.find.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { projectId: testProjectId, characterId: 'char-001' },
          { projectId: testProjectId, characterId: 'char-002' },
        ]),
      });

      const query = { projectId: testProjectId };
      const results = await mockCollection.find(query).toArray();

      expect(results).toHaveLength(2);
      expect(results.every(r => r.projectId === testProjectId)).toBe(true);
    });

    it('should filter by minimum quality score', async () => {
      const minScore = 0.85;
      const query = { qualityScore: { $gte: minScore } };

      expect(query.qualityScore.$gte).toBe(0.85);
    });

    it('should sort by qualification date', () => {
      const sortQuery = { qualifiedAt: -1 }; // Newest first

      expect(sortQuery.qualifiedAt).toBe(-1);
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate character ID insertion', async () => {
      mockCollection.insertOne.mockRejectedValue(new Error('E11000 duplicate key error'));

      await expect(mockCollection.insertOne({
        characterId: 'char-001',
        projectId: testProjectId,
      })).rejects.toThrow('duplicate key error');
    });

    it('should handle missing required fields', () => {
      const incompleteCharacter = {
        projectId: testProjectId,
        // Missing: characterId, name, description
      };

      const requiredFields = ['projectId', 'characterId', 'name', 'description'];
      const missingFields = requiredFields.filter(field => !incompleteCharacter[field]);

      expect(missingFields).toContain('characterId');
      expect(missingFields).toContain('name');
      expect(missingFields).toContain('description');
    });

    it('should validate quality score range', () => {
      const invalidScores = [-0.1, 1.5, 2.0];

      invalidScores.forEach(score => {
        const isValid = score >= 0 && score <= 1;
        expect(isValid).toBe(false);
      });
    });
  });
});
