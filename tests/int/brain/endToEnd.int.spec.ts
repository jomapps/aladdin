import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { BrainClient } from '@/lib/brain/client';
import { MongoClient } from 'mongodb';

describe('Brain End-to-End Integration Tests', () => {
  let brainClient: BrainClient;
  let mongoClient: MongoClient;
  const testProjectId = 'test-project-e2e-int';
  const testDbName = `open_${testProjectId}`;

  beforeAll(async () => {
    // Initialize Brain client
    brainClient = new BrainClient({
      baseUrl: process.env.BRAIN_SERVICE_URL || 'http://localhost:8000',
      timeout: 30000,
      retries: 2,
    });

    // Initialize MongoDB client
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
  });

  afterAll(async () => {
    // Cleanup
    try {
      await mongoClient.db(testDbName).dropDatabase();
    } catch (error) {
      // Ignore
    }
    await mongoClient.close();
  });

  describe('Complete Character Creation Flow', () => {
    it('should create character with Brain validation', async () => {
      // Step 1: Validate character data
      const validation = await brainClient.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'E2E Test Character',
          age: 35,
          occupation: 'Space Explorer',
          personality: 'Brave, curious, scientifically minded',
          backstory: 'Grew up fascinated by the stars, became youngest astronaut',
          goals: 'Discover new worlds and expand human knowledge',
          conflicts: 'Ambition vs family ties on Earth',
        },
      });

      expect(validation.qualityRating).toBeGreaterThanOrEqual(0.60);
      expect(validation.brainValidated).toBe(true);

      // Step 2: Save to MongoDB
      const db = mongoClient.db(testDbName);
      const collection = db.collection('characters');

      const { insertedId } = await collection.insertOne({
        name: 'E2E Test Character',
        age: 35,
        occupation: 'Space Explorer',
        personality: 'Brave, curious, scientifically minded',
        backstory: 'Grew up fascinated by the stars, became youngest astronaut',
        goals: 'Discover new worlds and expand human knowledge',
        conflicts: 'Ambition vs family ties on Earth',
        project: testProjectId,
        qualityRating: validation.qualityRating,
        brainValidated: validation.brainValidated,
        createdAt: new Date(),
      });

      expect(insertedId).toBeDefined();

      // Step 3: Add to Neo4j graph
      const node = await brainClient.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: {
          id: insertedId.toString(),
          name: 'E2E Test Character',
          occupation: 'Space Explorer',
        },
      });

      expect(node).toBeDefined();
      expect(node.id).toBeDefined();
    });

    it('should handle the complete workflow with relationships', async () => {
      // Create main character
      const heroValidation = await brainClient.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Captain Reynolds',
          age: 42,
          occupation: 'Starship Captain',
          personality: 'Principled leader with a rebellious streak',
          backstory: 'War veteran turned independent trader',
        },
      });

      expect(heroValidation.brainValidated).toBe(true);

      // Create location
      const locationValidation = await brainClient.validateContent({
        projectId: testProjectId,
        type: 'location',
        data: {
          name: 'Serenity',
          description: 'Firefly-class transport ship',
          atmosphere: 'Worn but homey, represents freedom',
        },
      });

      // Save to MongoDB
      const db = mongoClient.db(testDbName);
      const charactersCol = db.collection('characters');
      const locationsCol = db.collection('locations');

      const { insertedId: heroId } = await charactersCol.insertOne({
        name: 'Captain Reynolds',
        project: testProjectId,
        qualityRating: heroValidation.qualityRating,
      });

      const { insertedId: shipId } = await locationsCol.insertOne({
        name: 'Serenity',
        project: testProjectId,
        qualityRating: locationValidation.qualityRating,
      });

      // Add to Neo4j with relationship
      const heroNode = await brainClient.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: { id: heroId.toString(), name: 'Captain Reynolds' },
      });

      const shipNode = await brainClient.addNode({
        projectId: testProjectId,
        type: 'location',
        properties: { id: shipId.toString(), name: 'Serenity' },
      });

      // Create relationship
      await brainClient.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: { id: heroNode.id, name: 'Captain Reynolds' },
        relationships: [
          {
            type: 'COMMANDS',
            targetId: shipNode.id,
            properties: { since: '2517' },
          },
        ],
      });

      expect(heroNode).toBeDefined();
      expect(shipNode).toBeDefined();
    });
  });

  describe('Agent → Brain → MongoDB → Neo4j Flow', () => {
    it('should process agent-generated content through full pipeline', async () => {
      // Simulate agent-generated character
      const agentOutput = {
        name: 'AI Generated Character',
        age: 28,
        occupation: 'Cyber Security Expert',
        personality: 'Methodical, paranoid about privacy, brilliant hacker',
        backstory: 'Discovered major corporate conspiracy, now on the run',
        goals: 'Expose corruption while staying alive',
        conflicts: 'Trust no one vs need allies to succeed',
      };

      // Brain validation
      const validation = await brainClient.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: agentOutput,
      });

      expect(validation.qualityRating).toBeGreaterThanOrEqual(0.60);

      // MongoDB save
      const db = mongoClient.db(testDbName);
      const { insertedId } = await db.collection('characters').insertOne({
        ...agentOutput,
        project: testProjectId,
        qualityRating: validation.qualityRating,
        source: 'ai-agent',
      });

      // Neo4j sync
      const node = await brainClient.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: {
          id: insertedId.toString(),
          ...agentOutput,
        },
      });

      expect(node.id).toBeDefined();

      // Verify semantic search works
      const searchResults = await brainClient.semanticSearch({
        projectId: testProjectId,
        query: 'hacker character',
        limit: 5,
      });

      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe('Quality Rejection and Retry', () => {
    it('should reject low-quality content and allow retry', async () => {
      // Attempt 1: Low quality
      const lowQuality = await brainClient.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Weak Character',
          age: 25,
        },
      });

      expect(lowQuality.brainValidated).toBe(false);
      expect(lowQuality.suggestions.length).toBeGreaterThan(0);

      // Use suggestions to improve
      const improved = await brainClient.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Weak Character',
          age: 25,
          occupation: 'Software Engineer',
          personality: 'Introverted but passionate about technology',
          backstory: 'Self-taught programmer who built successful startup',
          goals: 'Create technology that helps people',
          conflicts: 'Idealism vs commercial pressure',
        },
      });

      expect(improved.qualityRating).toBeGreaterThan(lowQuality.qualityRating);
      expect(improved.brainValidated).toBe(true);
    });

    it('should handle retry loop until quality threshold met', async () => {
      let attempts = 0;
      let validated = false;
      const maxAttempts = 3;

      const baseData = {
        name: 'Iterative Character',
        age: 30,
      };

      while (!validated && attempts < maxAttempts) {
        attempts++;

        // Add more detail with each attempt
        const attemptData = {
          ...baseData,
          ...(attempts >= 1 && { occupation: 'Teacher' }),
          ...(attempts >= 2 && {
            personality: 'Patient and encouraging, dedicated to students',
          }),
          ...(attempts >= 3 && {
            backstory: 'Former corporate trainer who found fulfillment in education',
            goals: 'Inspire next generation of leaders',
          }),
        };

        const validation = await brainClient.validateContent({
          projectId: testProjectId,
          type: 'character',
          data: attemptData,
        });

        validated = validation.brainValidated;

        if (validated) {
          expect(attempts).toBeLessThanOrEqual(maxAttempts);
          expect(validation.qualityRating).toBeGreaterThanOrEqual(0.60);
        }
      }

      expect(validated).toBe(true);
    });
  });

  describe('Semantic Search After Save', () => {
    it('should find recently saved content via semantic search', async () => {
      // Create unique character
      const uniqueData = {
        name: 'Quantum Physicist Sarah',
        occupation: 'Quantum Physicist',
        personality: 'Brilliant but socially awkward, obsessed with time paradoxes',
        backstory: 'Discovered theoretical proof of time travel',
      };

      // Validate and save
      const validation = await brainClient.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: uniqueData,
      });

      const db = mongoClient.db(testDbName);
      await db.collection('characters').insertOne({
        ...uniqueData,
        project: testProjectId,
        qualityRating: validation.qualityRating,
      });

      await brainClient.addNode({
        projectId: testProjectId,
        type: 'character',
        properties: uniqueData,
      });

      // Search for it
      const results = await brainClient.semanticSearch({
        projectId: testProjectId,
        query: 'scientist studying time travel',
        type: 'character',
        limit: 5,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(r => r.properties.name?.includes('Quantum'))
      ).toBe(true);
    });
  });

  describe('Contradiction Detection Workflow', () => {
    it('should detect and report contradictions in workflow', async () => {
      const contradictoryData = {
        name: 'Young Professor',
        age: 22,
        occupation: 'University Professor',
        backstory: 'Has 20 years of teaching experience',
      };

      const validation = await brainClient.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: contradictoryData,
      });

      expect(validation.contradictions.length).toBeGreaterThan(0);
      expect(validation.brainValidated).toBe(false);

      // Workflow should prevent save
      if (!validation.brainValidated) {
        // Don't save to MongoDB or Neo4j
        expect(validation.contradictions).toBeDefined();
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should validate content within acceptable time', async () => {
      const start = Date.now();

      await brainClient.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Performance Test',
          age: 30,
          occupation: 'Benchmark Runner',
        },
      });

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle batch validation efficiently', async () => {
      const start = Date.now();

      const validations = await Promise.all([
        brainClient.validateContent({
          projectId: testProjectId,
          type: 'character',
          data: { name: 'Batch 1', age: 25 },
        }),
        brainClient.validateContent({
          projectId: testProjectId,
          type: 'character',
          data: { name: 'Batch 2', age: 30 },
        }),
        brainClient.validateContent({
          projectId: testProjectId,
          type: 'character',
          data: { name: 'Batch 3', age: 35 },
        }),
      ]);

      const duration = Date.now() - start;

      expect(validations.length).toBe(3);
      expect(duration).toBeLessThan(10000); // Parallel processing should be efficient
    });

    it('should measure semantic search performance', async () => {
      const start = Date.now();

      const results = await brainClient.semanticSearch({
        projectId: testProjectId,
        query: 'character with complex backstory',
        limit: 10,
      });

      const duration = Date.now() - start;

      expect(results).toBeDefined();
      expect(duration).toBeLessThan(3000); // Search should be fast
    });
  });
});
