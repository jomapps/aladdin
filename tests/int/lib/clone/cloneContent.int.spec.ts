import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cloneContent } from '@/lib/clone/cloneContent';
import { prisma } from '@/lib/prisma';
import { CloneOptions, CloneResult } from '@/types/clone';
import { ContentType } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

describe('Content Cloning Integration Tests', () => {
  let testUserId: string;
  let sourceProjectId: string;
  let targetProjectId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'clone-test@test.com',
        name: 'Clone Test User',
        password: 'hashedpassword',
      },
    });
    testUserId = user.id;

    // Create source and target projects
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
    // Clean up test data
    await prisma.character.deleteMany({ where: { projectId: { in: [sourceProjectId, targetProjectId] } } });
    await prisma.scene.deleteMany({ where: { projectId: { in: [sourceProjectId, targetProjectId] } } });
    await prisma.episode.deleteMany({ where: { projectId: { in: [sourceProjectId, targetProjectId] } } });
    await prisma.project.deleteMany({ where: { id: { in: [sourceProjectId, targetProjectId] } } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('Character Cloning (Simple)', () => {
    it('should clone a simple character without media', async () => {
      // Create source character
      const sourceChar = await prisma.character.create({
        data: {
          name: 'John Doe',
          description: 'A test character',
          personality: 'Friendly and outgoing',
          projectId: sourceProjectId,
        },
      });

      const options: CloneOptions = {
        sourceId: sourceChar.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: false,
      };

      const result = await cloneContent(options);

      expect(result.success).toBe(true);
      expect(result.clonedId).toBeDefined();
      expect(result.clonedCount).toBe(1);

      // Verify cloned character
      const cloned = await prisma.character.findUnique({ where: { id: result.clonedId } });
      expect(cloned).toBeDefined();
      expect(cloned?.name).toBe('John Doe (Copy)');
      expect(cloned?.description).toBe('A test character');
      expect(cloned?.projectId).toBe(targetProjectId);
    });

    it('should clone character with custom name suffix', async () => {
      const sourceChar = await prisma.character.create({
        data: {
          name: 'Jane Smith',
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: sourceChar.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
        nameSuffix: ' - Clone',
      });

      const cloned = await prisma.character.findUnique({ where: { id: result.clonedId } });
      expect(cloned?.name).toBe('Jane Smith - Clone');
    });

    it('should preserve character metadata', async () => {
      const sourceChar = await prisma.character.create({
        data: {
          name: 'Character with Metadata',
          description: 'Test description',
          personality: 'Test personality',
          backstory: 'Test backstory',
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: sourceChar.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
      });

      const cloned = await prisma.character.findUnique({ where: { id: result.clonedId } });
      expect(cloned?.description).toBe('Test description');
      expect(cloned?.personality).toBe('Test personality');
      expect(cloned?.backstory).toBe('Test backstory');
    });

    it('should fail when cloning non-existent character', async () => {
      await expect(
        cloneContent({
          sourceId: 'non-existent-id',
          sourceType: ContentType.CHARACTER,
          targetProjectId,
          userId: testUserId,
        })
      ).rejects.toThrow('Source content not found');
    });

    it('should fail when target project does not exist', async () => {
      const sourceChar = await prisma.character.create({
        data: {
          name: 'Test Character',
          projectId: sourceProjectId,
        },
      });

      await expect(
        cloneContent({
          sourceId: sourceChar.id,
          sourceType: ContentType.CHARACTER,
          targetProjectId: 'non-existent-project',
          userId: testUserId,
        })
      ).rejects.toThrow('Target project not found');
    });
  });

  describe('Character Cloning with Media Files', () => {
    it('should clone character with profile image', async () => {
      const sourceChar = await prisma.character.create({
        data: {
          name: 'Character with Image',
          profileImage: '/uploads/characters/profile.jpg',
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: sourceChar.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
        duplicateMediaFiles: true,
      });

      const cloned = await prisma.character.findUnique({ where: { id: result.clonedId } });
      expect(cloned?.profileImage).toBeDefined();
      expect(cloned?.profileImage).not.toBe('/uploads/characters/profile.jpg');
      expect(result.duplicatedFiles?.length).toBeGreaterThan(0);
    });

    it('should clone character with voice sample', async () => {
      const sourceChar = await prisma.character.create({
        data: {
          name: 'Character with Voice',
          voiceSample: '/uploads/voices/sample.mp3',
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: sourceChar.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
        duplicateMediaFiles: true,
      });

      const cloned = await prisma.character.findUnique({ where: { id: result.clonedId } });
      expect(cloned?.voiceSample).toBeDefined();
      expect(result.duplicatedFiles?.length).toBeGreaterThan(0);
    });

    it('should skip media duplication when flag is false', async () => {
      const sourceChar = await prisma.character.create({
        data: {
          name: 'Character',
          profileImage: '/uploads/characters/profile.jpg',
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: sourceChar.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
        duplicateMediaFiles: false,
      });

      expect(result.duplicatedFiles).toBeUndefined();
    });

    it('should handle missing media files gracefully', async () => {
      const sourceChar = await prisma.character.create({
        data: {
          name: 'Character',
          profileImage: '/uploads/non-existent.jpg',
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: sourceChar.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
        duplicateMediaFiles: true,
      });

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Failed to duplicate media file');
    });
  });

  describe('Scene Cloning with Dependencies', () => {
    it('should clone scene with character references', async () => {
      const char1 = await prisma.character.create({
        data: { name: 'Char 1', projectId: sourceProjectId },
      });
      const char2 = await prisma.character.create({
        data: { name: 'Char 2', projectId: sourceProjectId },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Test Scene',
          description: `Scene with <char:${char1.id}> and <char:${char2.id}>`,
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: scene.id,
        sourceType: ContentType.SCENE,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: true,
      });

      expect(result.success).toBe(true);
      expect(result.clonedCount).toBeGreaterThan(1); // Scene + characters

      const clonedScene = await prisma.scene.findUnique({ where: { id: result.clonedId } });
      expect(clonedScene?.description).not.toContain(char1.id);
      expect(clonedScene?.description).not.toContain(char2.id);
    });

    it('should clone scene with location reference', async () => {
      const location = await prisma.location.create({
        data: { name: 'Test Location', projectId: sourceProjectId },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Scene at Location',
          locationId: location.id,
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: scene.id,
        sourceType: ContentType.SCENE,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: true,
      });

      const clonedScene = await prisma.scene.findUnique({ where: { id: result.clonedId } });
      expect(clonedScene?.locationId).toBeDefined();
      expect(clonedScene?.locationId).not.toBe(location.id);
    });

    it('should clone scene with dialogue and actions', async () => {
      const scene = await prisma.scene.create({
        data: {
          title: 'Action Scene',
          dialogue: 'INT. LOCATION - DAY\n\nCharacter speaks.',
          actions: 'Character enters room. Character sits down.',
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: scene.id,
        sourceType: ContentType.SCENE,
        targetProjectId,
        userId: testUserId,
      });

      const cloned = await prisma.scene.findUnique({ where: { id: result.clonedId } });
      expect(cloned?.dialogue).toBe('INT. LOCATION - DAY\n\nCharacter speaks.');
      expect(cloned?.actions).toBe('Character enters room. Character sits down.');
    });

    it('should rewrite references in scene content', async () => {
      const char = await prisma.character.create({
        data: { name: 'Referenced Char', projectId: sourceProjectId },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Scene',
          description: `Character <char:${char.id}> appears.`,
          dialogue: `<char:${char.id}>: Hello!`,
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: scene.id,
        sourceType: ContentType.SCENE,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: true,
      });

      const cloned = await prisma.scene.findUnique({ where: { id: result.clonedId } });
      expect(cloned?.description).not.toContain(char.id);
      expect(cloned?.dialogue).not.toContain(char.id);
      expect(result.referencesRewritten).toBeGreaterThan(0);
    });
  });

  describe('Episode Cloning (Complex)', () => {
    it('should clone episode with all scenes', async () => {
      const episode = await prisma.episode.create({
        data: {
          title: 'Episode 1',
          synopsis: 'Test episode',
          projectId: sourceProjectId,
        },
      });

      const scene1 = await prisma.scene.create({
        data: { title: 'Scene 1', episodeId: episode.id, projectId: sourceProjectId },
      });
      const scene2 = await prisma.scene.create({
        data: { title: 'Scene 2', episodeId: episode.id, projectId: sourceProjectId },
      });

      const result = await cloneContent({
        sourceId: episode.id,
        sourceType: ContentType.EPISODE,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: true,
      });

      expect(result.success).toBe(true);
      expect(result.clonedCount).toBe(3); // Episode + 2 scenes

      const clonedScenes = await prisma.scene.findMany({
        where: { episodeId: result.clonedId },
      });
      expect(clonedScenes.length).toBe(2);
    });

    it('should clone episode with characters and locations', async () => {
      const char = await prisma.character.create({
        data: { name: 'Main Character', projectId: sourceProjectId },
      });
      const location = await prisma.location.create({
        data: { name: 'Main Location', projectId: sourceProjectId },
      });

      const episode = await prisma.episode.create({
        data: {
          title: 'Complex Episode',
          synopsis: `Episode with <char:${char.id}> at <loc:${location.id}>`,
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: episode.id,
        sourceType: ContentType.EPISODE,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: true,
      });

      expect(result.clonedCount).toBeGreaterThanOrEqual(3); // Episode + char + location
    });

    it('should maintain scene order in cloned episode', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Ordered Episode', projectId: sourceProjectId },
      });

      await prisma.scene.createMany({
        data: [
          { title: 'Scene 1', episodeId: episode.id, order: 1, projectId: sourceProjectId },
          { title: 'Scene 2', episodeId: episode.id, order: 2, projectId: sourceProjectId },
          { title: 'Scene 3', episodeId: episode.id, order: 3, projectId: sourceProjectId },
        ],
      });

      const result = await cloneContent({
        sourceId: episode.id,
        sourceType: ContentType.EPISODE,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: true,
      });

      const clonedScenes = await prisma.scene.findMany({
        where: { episodeId: result.clonedId },
        orderBy: { order: 'asc' },
      });

      expect(clonedScenes[0].order).toBe(1);
      expect(clonedScenes[1].order).toBe(2);
      expect(clonedScenes[2].order).toBe(3);
    });
  });

  describe('Cross-Project Cloning', () => {
    it('should clone content between different projects', async () => {
      const char = await prisma.character.create({
        data: { name: 'Cross-Project Char', projectId: sourceProjectId },
      });

      const result = await cloneContent({
        sourceId: char.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
      });

      const cloned = await prisma.character.findUnique({ where: { id: result.clonedId } });
      expect(cloned?.projectId).toBe(targetProjectId);
      expect(cloned?.projectId).not.toBe(sourceProjectId);
    });

    it('should maintain project isolation after cloning', async () => {
      const sourceChar = await prisma.character.create({
        data: { name: 'Original', projectId: sourceProjectId },
      });

      await cloneContent({
        sourceId: sourceChar.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
      });

      // Modify original
      await prisma.character.update({
        where: { id: sourceChar.id },
        data: { name: 'Modified Original' },
      });

      // Check clone is unaffected
      const targetChars = await prisma.character.findMany({
        where: { projectId: targetProjectId },
      });
      expect(targetChars[0].name).toBe('Original (Copy)');
    });

    it('should enforce permission checks for cross-project cloning', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
          password: 'hashedpassword',
        },
      });

      const restrictedProject = await prisma.project.create({
        data: {
          title: 'Restricted Project',
          ownerId: otherUser.id,
        },
      });

      const char = await prisma.character.create({
        data: { name: 'Restricted Char', projectId: restrictedProject.id },
      });

      await expect(
        cloneContent({
          sourceId: char.id,
          sourceType: ContentType.CHARACTER,
          targetProjectId,
          userId: testUserId, // Different user
        })
      ).rejects.toThrow('Permission denied');

      await prisma.project.delete({ where: { id: restrictedProject.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Reference Rewriting', () => {
    it('should rewrite character references in content', async () => {
      const char = await prisma.character.create({
        data: { name: 'Referenced', projectId: sourceProjectId },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Scene',
          description: `Text with <char:${char.id}> reference`,
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: scene.id,
        sourceType: ContentType.SCENE,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: true,
      });

      const cloned = await prisma.scene.findUnique({ where: { id: result.clonedId } });
      expect(cloned?.description).toMatch(/<char:[a-z0-9-]+>/);
      expect(cloned?.description).not.toContain(char.id);
    });

    it('should rewrite location references', async () => {
      const loc = await prisma.location.create({
        data: { name: 'Location', projectId: sourceProjectId },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Scene',
          description: `At <loc:${loc.id}>`,
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: scene.id,
        sourceType: ContentType.SCENE,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: true,
      });

      const cloned = await prisma.scene.findUnique({ where: { id: result.clonedId } });
      expect(cloned?.description).not.toContain(loc.id);
    });

    it('should rewrite scene references in episodes', async () => {
      const scene = await prisma.scene.create({
        data: { title: 'Scene', projectId: sourceProjectId },
      });

      const episode = await prisma.episode.create({
        data: {
          title: 'Episode',
          synopsis: `Episode references <scene:${scene.id}>`,
          projectId: sourceProjectId,
        },
      });

      const result = await cloneContent({
        sourceId: episode.id,
        sourceType: ContentType.EPISODE,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: true,
      });

      const cloned = await prisma.episode.findUnique({ where: { id: result.clonedId } });
      expect(cloned?.synopsis).not.toContain(scene.id);
    });
  });

  describe('Circular Reference Detection', () => {
    it('should detect circular references between scenes', async () => {
      const scene1 = await prisma.scene.create({
        data: { title: 'Scene 1', projectId: sourceProjectId, description: '' },
      });

      const scene2 = await prisma.scene.create({
        data: {
          title: 'Scene 2',
          projectId: sourceProjectId,
          description: `References <scene:${scene1.id}>`,
        },
      });

      // Create circular reference
      await prisma.scene.update({
        where: { id: scene1.id },
        data: { description: `References <scene:${scene2.id}>` },
      });

      const result = await cloneContent({
        sourceId: scene1.id,
        sourceType: ContentType.SCENE,
        targetProjectId,
        userId: testUserId,
        includeRelatedContent: true,
      });

      expect(result.warnings).toContain('Circular reference detected');
    });

    it('should prevent infinite loops during cloning', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'Self-Referencing',
          projectId: sourceProjectId,
          description: '',
        },
      });

      // Create self-reference (edge case)
      await prisma.character.update({
        where: { id: char.id },
        data: { description: `Self reference <char:${char.id}>` },
      });

      const result = await cloneContent({
        sourceId: char.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.clonedCount).toBe(1); // Should not clone infinitely
    });
  });

  describe('Clone Tracking Metadata', () => {
    it('should store clone metadata', async () => {
      const char = await prisma.character.create({
        data: { name: 'Tracked', projectId: sourceProjectId },
      });

      const result = await cloneContent({
        sourceId: char.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
      });

      const cloneRecord = await prisma.cloneHistory.findFirst({
        where: { clonedId: result.clonedId },
      });

      expect(cloneRecord).toBeDefined();
      expect(cloneRecord?.sourceId).toBe(char.id);
      expect(cloneRecord?.userId).toBe(testUserId);
      expect(cloneRecord?.createdAt).toBeDefined();
    });

    it('should track clone lineage', async () => {
      const original = await prisma.character.create({
        data: { name: 'Original', projectId: sourceProjectId },
      });

      const firstClone = await cloneContent({
        sourceId: original.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId,
      });

      const secondClone = await cloneContent({
        sourceId: firstClone.clonedId!,
        sourceType: ContentType.CHARACTER,
        targetProjectId: sourceProjectId,
        userId: testUserId,
      });

      const history = await prisma.cloneHistory.findMany({
        where: { OR: [{ sourceId: original.id }, { sourceId: firstClone.clonedId }] },
      });

      expect(history.length).toBe(2);
    });
  });

  describe('Rollback on Failure', () => {
    it('should rollback all changes if cloning fails midway', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: sourceProjectId },
      });

      await prisma.scene.create({
        data: { title: 'Scene 1', episodeId: episode.id, projectId: sourceProjectId },
      });

      // Mock a failure during cloning
      const originalCreate = prisma.scene.create;
      let callCount = 0;
      (prisma.scene.create as any) = async (args: any) => {
        callCount++;
        if (callCount > 1) throw new Error('Simulated failure');
        return originalCreate.call(prisma.scene, args);
      };

      try {
        await cloneContent({
          sourceId: episode.id,
          sourceType: ContentType.EPISODE,
          targetProjectId,
          userId: testUserId,
          includeRelatedContent: true,
        });
      } catch (error) {
        // Expected to fail
      }

      // Restore original function
      prisma.scene.create = originalCreate;

      // Verify no partial clones exist
      const clonedEpisodes = await prisma.episode.findMany({
        where: { projectId: targetProjectId },
      });
      expect(clonedEpisodes.length).toBe(0);
    });
  });

  describe('Permissions for Cloning', () => {
    it('should allow owner to clone content', async () => {
      const char = await prisma.character.create({
        data: { name: 'Owner Char', projectId: sourceProjectId },
      });

      const result = await cloneContent({
        sourceId: char.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: testUserId, // Owner
      });

      expect(result.success).toBe(true);
    });

    it('should allow editor to clone content', async () => {
      const editor = await prisma.user.create({
        data: {
          email: 'editor@test.com',
          name: 'Editor',
          password: 'hashedpassword',
        },
      });

      await prisma.teamMember.create({
        data: {
          projectId: sourceProjectId,
          userId: editor.id,
          role: 'EDITOR',
        },
      });

      const char = await prisma.character.create({
        data: { name: 'Char', projectId: sourceProjectId },
      });

      const result = await cloneContent({
        sourceId: char.id,
        sourceType: ContentType.CHARACTER,
        targetProjectId,
        userId: editor.id,
      });

      expect(result.success).toBe(true);

      await prisma.teamMember.deleteMany({ where: { userId: editor.id } });
      await prisma.user.delete({ where: { id: editor.id } });
    });

    it('should deny viewer from cloning content', async () => {
      const viewer = await prisma.user.create({
        data: {
          email: 'viewer@test.com',
          name: 'Viewer',
          password: 'hashedpassword',
        },
      });

      await prisma.teamMember.create({
        data: {
          projectId: sourceProjectId,
          userId: viewer.id,
          role: 'VIEWER',
        },
      });

      const char = await prisma.character.create({
        data: { name: 'Char', projectId: sourceProjectId },
      });

      await expect(
        cloneContent({
          sourceId: char.id,
          sourceType: ContentType.CHARACTER,
          targetProjectId,
          userId: viewer.id,
        })
      ).rejects.toThrow('Permission denied');

      await prisma.teamMember.deleteMany({ where: { userId: viewer.id } });
      await prisma.user.delete({ where: { id: viewer.id } });
    });
  });
});
