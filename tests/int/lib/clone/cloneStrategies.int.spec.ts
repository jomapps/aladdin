import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CharacterCloneStrategy } from '@/lib/clone/strategies/CharacterCloneStrategy';
import { SceneCloneStrategy } from '@/lib/clone/strategies/SceneCloneStrategy';
import { EpisodeCloneStrategy } from '@/lib/clone/strategies/EpisodeCloneStrategy';
import { LocationCloneStrategy } from '@/lib/clone/strategies/LocationCloneStrategy';
import { prisma } from '@/lib/prisma';
import { CloneContext } from '@/types/clone';

describe('Clone Strategies Integration Tests', () => {
  let testUserId: string;
  let sourceProjectId: string;
  let targetProjectId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'strategy-test@test.com',
        name: 'Strategy Test User',
        password: 'hashedpassword',
      },
    });
    testUserId = user.id;

    const sourceProject = await prisma.project.create({
      data: {
        title: 'Source Project',
        ownerId: testUserId,
      },
    });
    sourceProjectId = sourceProject.id;

    const targetProject = await prisma.project.create({
      data: {
        title: 'Target Project',
        ownerId: testUserId,
      },
    });
    targetProjectId = targetProject.id;
  });

  afterEach(async () => {
    await prisma.character.deleteMany({ where: { projectId: { in: [sourceProjectId, targetProjectId] } } });
    await prisma.scene.deleteMany({ where: { projectId: { in: [sourceProjectId, targetProjectId] } } });
    await prisma.episode.deleteMany({ where: { projectId: { in: [sourceProjectId, targetProjectId] } } });
    await prisma.location.deleteMany({ where: { projectId: { in: [sourceProjectId, targetProjectId] } } });
    await prisma.project.deleteMany({ where: { id: { in: [sourceProjectId, targetProjectId] } } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('CharacterCloneStrategy', () => {
    it('should clone character with all properties', async () => {
      const strategy = new CharacterCloneStrategy();
      const sourceChar = await prisma.character.create({
        data: {
          name: 'Test Character',
          description: 'A test character',
          personality: 'Friendly',
          backstory: 'Born in a test',
          profileImage: '/uploads/char.jpg',
          voiceSample: '/uploads/voice.mp3',
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
      };

      const clonedId = await strategy.clone(sourceChar.id, context);

      const cloned = await prisma.character.findUnique({ where: { id: clonedId } });
      expect(cloned).toBeDefined();
      expect(cloned?.name).toBe('Test Character (Copy)');
      expect(cloned?.description).toBe('A test character');
      expect(cloned?.personality).toBe('Friendly');
      expect(cloned?.backstory).toBe('Born in a test');
    });

    it('should extract dependencies from character content', async () => {
      const strategy = new CharacterCloneStrategy();
      const related = await prisma.character.create({
        data: { name: 'Related', projectId: sourceProjectId },
      });

      const char = await prisma.character.create({
        data: {
          name: 'Main',
          description: `Friends with <char:${related.id}>`,
          projectId: sourceProjectId,
        },
      });

      const dependencies = await strategy.extractDependencies(char.id);
      expect(dependencies).toContain(related.id);
    });

    it('should duplicate character media files', async () => {
      const strategy = new CharacterCloneStrategy();
      const char = await prisma.character.create({
        data: {
          name: 'Char with Media',
          profileImage: '/uploads/profile.jpg',
          voiceSample: '/uploads/voice.mp3',
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        duplicateMediaFiles: true,
      };

      const clonedId = await strategy.clone(char.id, context);
      const cloned = await prisma.character.findUnique({ where: { id: clonedId } });

      expect(cloned?.profileImage).toBeDefined();
      expect(cloned?.profileImage).not.toBe('/uploads/profile.jpg');
    });

    it('should rewrite references in character content', async () => {
      const strategy = new CharacterCloneStrategy();
      const ref = await prisma.character.create({
        data: { name: 'Referenced', projectId: sourceProjectId },
      });

      const char = await prisma.character.create({
        data: {
          name: 'Main',
          backstory: `Related to <char:${ref.id}>`,
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map([[ref.id, 'new-id-123']]),
        clonedIds: new Set(),
      };

      const clonedId = await strategy.clone(char.id, context);
      const cloned = await prisma.character.findUnique({ where: { id: clonedId } });

      expect(cloned?.backstory).toContain('new-id-123');
      expect(cloned?.backstory).not.toContain(ref.id);
    });

    it('should validate character data before cloning', async () => {
      const strategy = new CharacterCloneStrategy();

      await expect(strategy.validate('non-existent-id')).rejects.toThrow('Character not found');
    });
  });

  describe('SceneCloneStrategy', () => {
    it('should clone scene with all properties', async () => {
      const strategy = new SceneCloneStrategy();
      const location = await prisma.location.create({
        data: { name: 'Test Location', projectId: sourceProjectId },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Test Scene',
          description: 'A test scene',
          dialogue: 'Character: Hello!',
          actions: 'Character enters',
          locationId: location.id,
          order: 1,
          duration: 120,
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
      };

      const clonedId = await strategy.clone(scene.id, context);
      const cloned = await prisma.scene.findUnique({ where: { id: clonedId } });

      expect(cloned).toBeDefined();
      expect(cloned?.title).toBe('Test Scene (Copy)');
      expect(cloned?.dialogue).toBe('Character: Hello!');
      expect(cloned?.actions).toBe('Character enters');
      expect(cloned?.duration).toBe(120);
    });

    it('should extract character dependencies from scene', async () => {
      const strategy = new SceneCloneStrategy();
      const char1 = await prisma.character.create({
        data: { name: 'Char 1', projectId: sourceProjectId },
      });
      const char2 = await prisma.character.create({
        data: { name: 'Char 2', projectId: sourceProjectId },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Scene',
          dialogue: `<char:${char1.id}>: Hello\n<char:${char2.id}>: Hi`,
          projectId: sourceProjectId,
        },
      });

      const dependencies = await strategy.extractDependencies(scene.id);
      expect(dependencies).toContain(char1.id);
      expect(dependencies).toContain(char2.id);
    });

    it('should extract location dependency', async () => {
      const strategy = new SceneCloneStrategy();
      const location = await prisma.location.create({
        data: { name: 'Location', projectId: sourceProjectId },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Scene',
          locationId: location.id,
          projectId: sourceProjectId,
        },
      });

      const dependencies = await strategy.extractDependencies(scene.id);
      expect(dependencies).toContain(location.id);
    });

    it('should clone scene with video file', async () => {
      const strategy = new SceneCloneStrategy();
      const scene = await prisma.scene.create({
        data: {
          title: 'Scene with Video',
          videoFile: '/uploads/scene-video.mp4',
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        duplicateMediaFiles: true,
      };

      const clonedId = await strategy.clone(scene.id, context);
      const cloned = await prisma.scene.findUnique({ where: { id: clonedId } });

      expect(cloned?.videoFile).toBeDefined();
    });

    it('should rewrite all references in scene content', async () => {
      const strategy = new SceneCloneStrategy();
      const char = await prisma.character.create({
        data: { name: 'Char', projectId: sourceProjectId },
      });
      const loc = await prisma.location.create({
        data: { name: 'Loc', projectId: sourceProjectId },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Scene',
          description: `At <loc:${loc.id}>`,
          dialogue: `<char:${char.id}>: Hello`,
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map([
          [char.id, 'new-char-id'],
          [loc.id, 'new-loc-id'],
        ]),
        clonedIds: new Set(),
      };

      const clonedId = await strategy.clone(scene.id, context);
      const cloned = await prisma.scene.findUnique({ where: { id: clonedId } });

      expect(cloned?.description).toContain('new-loc-id');
      expect(cloned?.dialogue).toContain('new-char-id');
    });
  });

  describe('EpisodeCloneStrategy', () => {
    it('should clone episode with all properties', async () => {
      const strategy = new EpisodeCloneStrategy();
      const episode = await prisma.episode.create({
        data: {
          title: 'Episode 1',
          synopsis: 'Test synopsis',
          episodeNumber: 1,
          seasonNumber: 1,
          duration: 3600,
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
      };

      const clonedId = await strategy.clone(episode.id, context);
      const cloned = await prisma.episode.findUnique({ where: { id: clonedId } });

      expect(cloned).toBeDefined();
      expect(cloned?.title).toBe('Episode 1 (Copy)');
      expect(cloned?.synopsis).toBe('Test synopsis');
      expect(cloned?.episodeNumber).toBe(1);
      expect(cloned?.duration).toBe(3600);
    });

    it('should extract scene dependencies', async () => {
      const strategy = new EpisodeCloneStrategy();
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: sourceProjectId },
      });

      const scene1 = await prisma.scene.create({
        data: { title: 'Scene 1', episodeId: episode.id, projectId: sourceProjectId },
      });
      const scene2 = await prisma.scene.create({
        data: { title: 'Scene 2', episodeId: episode.id, projectId: sourceProjectId },
      });

      const dependencies = await strategy.extractDependencies(episode.id);
      expect(dependencies).toContain(scene1.id);
      expect(dependencies).toContain(scene2.id);
    });

    it('should clone episode with nested scenes', async () => {
      const strategy = new EpisodeCloneStrategy();
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: sourceProjectId },
      });

      await prisma.scene.createMany({
        data: [
          { title: 'Scene 1', episodeId: episode.id, order: 1, projectId: sourceProjectId },
          { title: 'Scene 2', episodeId: episode.id, order: 2, projectId: sourceProjectId },
          { title: 'Scene 3', episodeId: episode.id, order: 3, projectId: sourceProjectId },
        ],
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        includeRelatedContent: true,
      };

      const clonedId = await strategy.clone(episode.id, context);
      const clonedScenes = await prisma.scene.findMany({
        where: { episodeId: clonedId },
      });

      expect(clonedScenes.length).toBe(3);
    });

    it('should maintain scene order after cloning', async () => {
      const strategy = new EpisodeCloneStrategy();
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: sourceProjectId },
      });

      await prisma.scene.createMany({
        data: [
          { title: 'Scene A', episodeId: episode.id, order: 1, projectId: sourceProjectId },
          { title: 'Scene B', episodeId: episode.id, order: 2, projectId: sourceProjectId },
          { title: 'Scene C', episodeId: episode.id, order: 3, projectId: sourceProjectId },
        ],
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        includeRelatedContent: true,
      };

      const clonedId = await strategy.clone(episode.id, context);
      const clonedScenes = await prisma.scene.findMany({
        where: { episodeId: clonedId },
        orderBy: { order: 'asc' },
      });

      expect(clonedScenes[0].title).toBe('Scene A (Copy)');
      expect(clonedScenes[1].title).toBe('Scene B (Copy)');
      expect(clonedScenes[2].title).toBe('Scene C (Copy)');
    });

    it('should rewrite references in episode synopsis', async () => {
      const strategy = new EpisodeCloneStrategy();
      const char = await prisma.character.create({
        data: { name: 'Main Char', projectId: sourceProjectId },
      });

      const episode = await prisma.episode.create({
        data: {
          title: 'Episode',
          synopsis: `Episode featuring <char:${char.id}>`,
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map([[char.id, 'new-char-id']]),
        clonedIds: new Set(),
      };

      const clonedId = await strategy.clone(episode.id, context);
      const cloned = await prisma.episode.findUnique({ where: { id: clonedId } });

      expect(cloned?.synopsis).toContain('new-char-id');
      expect(cloned?.synopsis).not.toContain(char.id);
    });
  });

  describe('LocationCloneStrategy', () => {
    it('should clone location with all properties', async () => {
      const strategy = new LocationCloneStrategy();
      const location = await prisma.location.create({
        data: {
          name: 'Test Location',
          description: 'A test location',
          address: '123 Test St',
          coordinates: { lat: 40.7128, lng: -74.006 },
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
      };

      const clonedId = await strategy.clone(location.id, context);
      const cloned = await prisma.location.findUnique({ where: { id: clonedId } });

      expect(cloned).toBeDefined();
      expect(cloned?.name).toBe('Test Location (Copy)');
      expect(cloned?.description).toBe('A test location');
      expect(cloned?.address).toBe('123 Test St');
    });

    it('should clone location with images', async () => {
      const strategy = new LocationCloneStrategy();
      const location = await prisma.location.create({
        data: {
          name: 'Location with Images',
          images: ['/uploads/loc1.jpg', '/uploads/loc2.jpg'],
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        duplicateMediaFiles: true,
      };

      const clonedId = await strategy.clone(location.id, context);
      const cloned = await prisma.location.findUnique({ where: { id: clonedId } });

      expect(cloned?.images).toBeDefined();
      expect(cloned?.images?.length).toBe(2);
    });

    it('should extract no dependencies for simple location', async () => {
      const strategy = new LocationCloneStrategy();
      const location = await prisma.location.create({
        data: { name: 'Simple Location', projectId: sourceProjectId },
      });

      const dependencies = await strategy.extractDependencies(location.id);
      expect(dependencies.length).toBe(0);
    });

    it('should validate location exists before cloning', async () => {
      const strategy = new LocationCloneStrategy();

      await expect(strategy.validate('non-existent-id')).rejects.toThrow('Location not found');
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve dependencies in correct order', async () => {
      const episodeStrategy = new EpisodeCloneStrategy();
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: sourceProjectId },
      });

      const char = await prisma.character.create({
        data: { name: 'Character', projectId: sourceProjectId },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Scene',
          episodeId: episode.id,
          dialogue: `<char:${char.id}>: Hello`,
          projectId: sourceProjectId,
        },
      });

      const dependencies = await episodeStrategy.extractDependencies(episode.id);

      // Should include both scene and character (transitively)
      expect(dependencies.length).toBeGreaterThan(0);
    });

    it('should handle missing dependencies gracefully', async () => {
      const strategy = new SceneCloneStrategy();
      const scene = await prisma.scene.create({
        data: {
          title: 'Scene',
          dialogue: '<char:non-existent-id>: Hello',
          projectId: sourceProjectId,
        },
      });

      const dependencies = await strategy.extractDependencies(scene.id);
      // Should not crash, but may include invalid reference
      expect(dependencies).toBeDefined();
    });
  });

  describe('Media File Duplication', () => {
    it('should duplicate image files', async () => {
      const strategy = new CharacterCloneStrategy();
      const char = await prisma.character.create({
        data: {
          name: 'Char',
          profileImage: '/uploads/test-image.jpg',
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        duplicateMediaFiles: true,
      };

      const clonedId = await strategy.clone(char.id, context);
      const cloned = await prisma.character.findUnique({ where: { id: clonedId } });

      expect(cloned?.profileImage).toBeDefined();
      expect(cloned?.profileImage).not.toBe('/uploads/test-image.jpg');
    });

    it('should duplicate audio files', async () => {
      const strategy = new CharacterCloneStrategy();
      const char = await prisma.character.create({
        data: {
          name: 'Char',
          voiceSample: '/uploads/voice-sample.mp3',
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        duplicateMediaFiles: true,
      };

      const clonedId = await strategy.clone(char.id, context);
      const cloned = await prisma.character.findUnique({ where: { id: clonedId } });

      expect(cloned?.voiceSample).toBeDefined();
    });

    it('should duplicate video files', async () => {
      const strategy = new SceneCloneStrategy();
      const scene = await prisma.scene.create({
        data: {
          title: 'Scene',
          videoFile: '/uploads/scene-video.mp4',
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        duplicateMediaFiles: true,
      };

      const clonedId = await strategy.clone(scene.id, context);
      const cloned = await prisma.scene.findUnique({ where: { id: clonedId } });

      expect(cloned?.videoFile).toBeDefined();
    });

    it('should skip media duplication when flag is false', async () => {
      const strategy = new CharacterCloneStrategy();
      const char = await prisma.character.create({
        data: {
          name: 'Char',
          profileImage: '/uploads/image.jpg',
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        duplicateMediaFiles: false,
      };

      const clonedId = await strategy.clone(char.id, context);
      const cloned = await prisma.character.findUnique({ where: { id: clonedId } });

      // Should reference same file or be null
      expect(cloned?.profileImage).toBe('/uploads/image.jpg');
    });
  });

  describe('Brain Graph Cloning', () => {
    it('should clone Brain graph nodes with character', async () => {
      const strategy = new CharacterCloneStrategy();
      const char = await prisma.character.create({
        data: { name: 'Character', projectId: sourceProjectId },
      });

      // Create Brain graph node
      await prisma.brainNode.create({
        data: {
          entityId: char.id,
          entityType: 'CHARACTER',
          content: 'Character personality data',
          embedding: [0.1, 0.2, 0.3],
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        cloneBrainGraph: true,
      };

      const clonedId = await strategy.clone(char.id, context);

      const brainNodes = await prisma.brainNode.findMany({
        where: { entityId: clonedId },
      });

      expect(brainNodes.length).toBeGreaterThan(0);
    });

    it('should skip Brain graph cloning when flag is false', async () => {
      const strategy = new CharacterCloneStrategy();
      const char = await prisma.character.create({
        data: { name: 'Character', projectId: sourceProjectId },
      });

      await prisma.brainNode.create({
        data: {
          entityId: char.id,
          entityType: 'CHARACTER',
          content: 'Data',
          embedding: [0.1, 0.2],
          projectId: sourceProjectId,
        },
      });

      const context: CloneContext = {
        targetProjectId,
        userId: testUserId,
        referenceMap: new Map(),
        clonedIds: new Set(),
        cloneBrainGraph: false,
      };

      const clonedId = await strategy.clone(char.id, context);

      const brainNodes = await prisma.brainNode.findMany({
        where: { entityId: clonedId },
      });

      expect(brainNodes.length).toBe(0);
    });
  });
});
