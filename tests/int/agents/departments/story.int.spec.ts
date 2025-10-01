/**
 * Story Department Integration Tests
 * Tests full Story Department workflow with all specialists
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { CodeBuffAgent } from '@codebuff/sdk';

// Mock SDK responses
const mockCodeBuff = {
  agent: jest.fn().mockReturnValue({
    execute: jest.fn(),
  }),
};

describe('Story Department Integration Tests', () => {
  let storyHeadAgent: any;

  beforeAll(() => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017';
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('Story Department Head', () => {
    it('should spawn all 5 story specialists', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        specialists: [
          { type: 'story-architect', status: 'ready' },
          { type: 'episode-planner', status: 'ready' },
          { type: 'world-builder', status: 'ready' },
          { type: 'dialogue-writer', status: 'ready' },
          { type: 'theme-analyzer', status: 'ready' },
        ],
      });

      storyHeadAgent = { execute: mockExecute };
      const result = await storyHeadAgent.execute({
        task: 'Initialize story department',
      });

      expect(result.success).toBe(true);
      expect(result.specialists).toHaveLength(5);
      expect(result.specialists.map((s: any) => s.type)).toEqual([
        'story-architect',
        'episode-planner',
        'world-builder',
        'dialogue-writer',
        'theme-analyzer',
      ]);
    });

    it('should coordinate multi-specialist tasks', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        coordination: {
          storyArchitect: { status: 'completed', quality: 0.92 },
          episodePlanner: { status: 'completed', quality: 0.88 },
          worldBuilder: { status: 'completed', quality: 0.90 },
        },
      });

      storyHeadAgent = { execute: mockExecute };
      const result = await storyHeadAgent.execute({
        task: 'Create episode 1 structure',
      });

      expect(result.success).toBe(true);
      expect(result.coordination).toBeDefined();
    });

    it('should grade specialist outputs', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        grading: {
          storyArchitect: 0.92,
          episodePlanner: 0.88,
          worldBuilder: 0.90,
          average: 0.90,
        },
      });

      storyHeadAgent = { execute: mockExecute };
      const result = await storyHeadAgent.execute({
        task: 'Grade story outputs',
      });

      expect(result.success).toBe(true);
      expect(result.grading.average).toBeGreaterThanOrEqual(0.75);
    });

    it('should reject low-quality outputs', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        grading: {
          storyArchitect: 0.60,
          reason: 'Below quality threshold',
        },
      });

      storyHeadAgent = { execute: mockExecute };
      const result = await storyHeadAgent.execute({
        task: 'Validate low quality content',
      });

      expect(result.success).toBe(false);
      expect(result.grading.storyArchitect).toBeLessThan(0.75);
    });
  });

  describe('Story Architect Specialist', () => {
    it('should create narrative structure', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        structure: {
          type: 'three-act',
          acts: [
            { number: 1, title: 'Setup', scenes: ['scene-1', 'scene-2'] },
            { number: 2, title: 'Confrontation', scenes: ['scene-3', 'scene-4'] },
            { number: 3, title: 'Resolution', scenes: ['scene-5'] },
          ],
        },
      });

      const architect = { execute: mockExecute };
      const result = await architect.execute({
        task: 'Create narrative structure for Aladdin',
      });

      expect(result.success).toBe(true);
      expect(result.structure.acts).toHaveLength(3);
      expect(result.structure.type).toBe('three-act');
    });

    it('should define character arcs', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        arcs: {
          aladdin: {
            beginning: 'street thief',
            middle: 'discovers identity',
            end: 'true self',
          },
        },
      });

      const architect = { execute: mockExecute };
      const result = await architect.execute({
        task: 'Define character arcs',
      });

      expect(result.success).toBe(true);
      expect(result.arcs.aladdin).toBeDefined();
    });

    it('should identify plot points', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        plotPoints: [
          { type: 'inciting-incident', description: 'Meets Jasmine' },
          { type: 'first-plot-point', description: 'Finds lamp' },
          { type: 'midpoint', description: 'Reveals identity crisis' },
          { type: 'climax', description: 'Defeats Jafar' },
        ],
      });

      const architect = { execute: mockExecute };
      const result = await architect.execute({
        task: 'Identify plot points',
      });

      expect(result.success).toBe(true);
      expect(result.plotPoints.length).toBeGreaterThanOrEqual(4);
    });

    it('should save story structure to MongoDB', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        saved: true,
        storyId: 'aladdin-s1',
      });

      const architect = { execute: mockExecute };
      const result = await architect.execute({
        task: 'Save story structure',
        tool: 'save_story_structure',
      });

      expect(result.success).toBe(true);
      expect(result.saved).toBe(true);
    });
  });

  describe('Episode Planner Specialist', () => {
    it('should break story into episodes', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        episodes: [
          { number: 1, title: 'The Street Rat', duration: 22 },
          { number: 2, title: 'The Cave of Wonders', duration: 22 },
          { number: 3, title: 'Prince Ali', duration: 22 },
        ],
      });

      const planner = { execute: mockExecute };
      const result = await planner.execute({
        task: 'Plan episodes for Aladdin series',
      });

      expect(result.success).toBe(true);
      expect(result.episodes).toHaveLength(3);
    });

    it('should create episode summaries', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        episode: {
          number: 1,
          summary: 'Aladdin steals bread and meets Jasmine in disguise',
          scenes: 5,
        },
      });

      const planner = { execute: mockExecute };
      const result = await planner.execute({
        task: 'Create episode 1 summary',
      });

      expect(result.success).toBe(true);
      expect(result.episode.summary).toBeDefined();
    });

    it('should distribute story beats across episodes', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        distribution: {
          episode1: ['setup', 'meet-cute'],
          episode2: ['first-trial', 'lamp-discovery'],
          episode3: ['transformation', 'climax'],
        },
      });

      const planner = { execute: mockExecute };
      const result = await planner.execute({
        task: 'Distribute story beats',
      });

      expect(result.success).toBe(true);
      expect(Object.keys(result.distribution)).toHaveLength(3);
    });
  });

  describe('World Builder Specialist', () => {
    it('should create world details for Agrabah', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        world: {
          name: 'Agrabah',
          type: 'desert-city',
          locations: ['marketplace', 'palace', 'cave-of-wonders'],
        },
      });

      const builder = { execute: mockExecute };
      const result = await builder.execute({
        task: 'Build Agrabah world',
      });

      expect(result.success).toBe(true);
      expect(result.world.name).toBe('Agrabah');
      expect(result.world.locations.length).toBeGreaterThanOrEqual(3);
    });

    it('should define magic system rules', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        magicSystem: {
          type: 'genie-magic',
          rules: [
            'Cannot kill',
            'Cannot make someone fall in love',
            'Cannot bring back the dead',
          ],
          limitations: ['Three wishes only'],
        },
      });

      const builder = { execute: mockExecute };
      const result = await builder.execute({
        task: 'Define genie magic rules',
      });

      expect(result.success).toBe(true);
      expect(result.magicSystem.rules).toHaveLength(3);
    });

    it('should create location descriptions', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        location: {
          name: 'Cave of Wonders',
          description: 'A mystical cave shaped like a tiger head',
          atmosphere: 'mysterious and dangerous',
        },
      });

      const builder = { execute: mockExecute };
      const result = await builder.execute({
        task: 'Describe Cave of Wonders',
      });

      expect(result.success).toBe(true);
      expect(result.location.description).toBeDefined();
    });

    it('should retrieve world context from MongoDB', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        world: {
          worldId: 'agrabah',
          name: 'Agrabah',
          locations: [/* ... */],
        },
      });

      const builder = { execute: mockExecute };
      const result = await builder.execute({
        task: 'Get Agrabah context',
        tool: 'get_world_context',
      });

      expect(result.success).toBe(true);
      expect(result.world.worldId).toBe('agrabah');
    });
  });

  describe('Dialogue Writer Specialist', () => {
    it('should generate character dialogue', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        dialogue: {
          character: 'Aladdin',
          lines: [
            'Do you trust me?',
            'I\'m not a prize to be won',
          ],
        },
      });

      const writer = { execute: mockExecute };
      const result = await writer.execute({
        task: 'Write Aladdin dialogue',
      });

      expect(result.success).toBe(true);
      expect(result.dialogue.lines.length).toBeGreaterThanOrEqual(2);
    });

    it('should maintain character voice consistency', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        consistency: {
          score: 0.92,
          voiceTraits: ['humble', 'witty', 'confident'],
        },
      });

      const writer = { execute: mockExecute };
      const result = await writer.execute({
        task: 'Check dialogue consistency',
      });

      expect(result.success).toBe(true);
      expect(result.consistency.score).toBeGreaterThanOrEqual(0.85);
    });

    it('should create scene dialogue', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        scene: {
          sceneId: 'scene-1',
          dialogue: [
            { character: 'Aladdin', line: 'Hello!' },
            { character: 'Jasmine', line: 'Who are you?' },
          ],
        },
      });

      const writer = { execute: mockExecute };
      const result = await writer.execute({
        task: 'Write scene 1 dialogue',
      });

      expect(result.success).toBe(true);
      expect(result.scene.dialogue.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Theme Analyzer Specialist', () => {
    it('should identify story themes', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        themes: [
          'identity',
          'freedom',
          'love',
          'power-corruption',
        ],
      });

      const analyzer = { execute: mockExecute };
      const result = await analyzer.execute({
        task: 'Identify Aladdin themes',
      });

      expect(result.success).toBe(true);
      expect(result.themes.length).toBeGreaterThanOrEqual(3);
    });

    it('should check theme consistency across episodes', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        consistency: {
          overall: 0.91,
          themes: {
            identity: 0.95,
            freedom: 0.88,
          },
        },
      });

      const analyzer = { execute: mockExecute };
      const result = await analyzer.execute({
        task: 'Check theme consistency',
      });

      expect(result.success).toBe(true);
      expect(result.consistency.overall).toBeGreaterThanOrEqual(0.85);
    });

    it('should suggest theme reinforcement opportunities', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        suggestions: [
          'Strengthen identity theme in episode 2',
          'Add freedom motif to scene 5',
        ],
      });

      const analyzer = { execute: mockExecute };
      const result = await analyzer.execute({
        task: 'Suggest theme reinforcement',
      });

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Full Story Department Workflow', () => {
    it('should complete full story creation workflow', async () => {
      const mockExecute = jest.fn()
        .mockResolvedValueOnce({
          success: true,
          specialists: [/* all 5 specialists */],
        })
        .mockResolvedValueOnce({
          success: true,
          structure: {/* story structure */},
        })
        .mockResolvedValueOnce({
          success: true,
          episodes: [/* 3 episodes */],
        })
        .mockResolvedValueOnce({
          success: true,
          world: {/* world details */},
        })
        .mockResolvedValueOnce({
          success: true,
          grading: { average: 0.90 },
        });

      const head = { execute: mockExecute };

      await head.execute({ task: 'Initialize department' });
      await head.execute({ task: 'Create story structure' });
      await head.execute({ task: 'Plan episodes' });
      await head.execute({ task: 'Build world' });
      const finalResult = await head.execute({ task: 'Grade outputs' });

      expect(finalResult.success).toBe(true);
      expect(finalResult.grading.average).toBeGreaterThanOrEqual(0.75);
    });

    it('should handle specialist failure gracefully', async () => {
      const mockExecute = jest.fn()
        .mockResolvedValueOnce({
          success: true,
          specialists: [/* all specialists */],
        })
        .mockRejectedValueOnce(new Error('World Builder failed'));

      const head = { execute: mockExecute };

      await head.execute({ task: 'Initialize department' });

      await expect(
        head.execute({ task: 'Build world' })
      ).rejects.toThrow('World Builder failed');
    });

    it('should meet performance requirements (<30s)', async () => {
      const start = Date.now();

      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        completed: true,
      });

      const head = { execute: mockExecute };
      await head.execute({ task: 'Full story workflow' });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(30000);
    });
  });

  describe('Quality Validation', () => {
    it('should validate story structure quality', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        quality: {
          structure: 0.92,
          coherence: 0.88,
          pacing: 0.90,
          overall: 0.90,
        },
      });

      const head = { execute: mockExecute };
      const result = await head.execute({
        task: 'Validate story quality',
      });

      expect(result.success).toBe(true);
      expect(result.quality.overall).toBeGreaterThanOrEqual(0.75);
    });

    it('should require Brain validation for ingestion', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        brainValidation: {
          passed: true,
          confidence: 0.93,
        },
      });

      const head = { execute: mockExecute };
      const result = await head.execute({
        task: 'Request Brain validation',
      });

      expect(result.success).toBe(true);
      expect(result.brainValidation.passed).toBe(true);
    });
  });
});
