import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as cloneSingle } from '@/app/api/clone/content/route';
import { POST as cloneBatch } from '@/app/api/clone/batch/route';
import { prisma } from '@/lib/prisma';
import { ContentType } from '@prisma/client';

describe('Clone API Routes Integration Tests', () => {
  let testUserId: string;
  let sourceProjectId: string;
  let targetProjectId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'clone-api@test.com',
        name: 'Clone API User',
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
    await prisma.project.deleteMany({ where: { id: { in: [sourceProjectId, targetProjectId] } } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('POST /api/clone/content (single clone)', () => {
    it('should clone character via API', async () => {
      const character = await prisma.character.create({
        data: {
          name: 'Test Character',
          description: 'A test character',
          projectId: sourceProjectId,
        },
      });

      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: character.id,
          sourceType: ContentType.CHARACTER,
          targetProjectId,
          userId: testUserId,
        }),
      });

      const response = await cloneSingle(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.clonedId).toBeDefined();
    });

    it('should return 400 for missing parameters', async () => {
      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing sourceId
          sourceType: ContentType.CHARACTER,
          targetProjectId,
        }),
      });

      const response = await cloneSingle(request);
      expect(response.status).toBe(400);
    });

    it('should return 404 for invalid source', async () => {
      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: 'non-existent-id',
          sourceType: ContentType.CHARACTER,
          targetProjectId,
          userId: testUserId,
        }),
      });

      const response = await cloneSingle(request);
      expect(response.status).toBe(404);
    });

    it('should validate permissions before cloning', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
          password: 'hashedpassword',
        },
      });

      const character = await prisma.character.create({
        data: { name: 'Character', projectId: sourceProjectId },
      });

      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: character.id,
          sourceType: ContentType.CHARACTER,
          targetProjectId,
          userId: otherUser.id, // Different user, no permission
        }),
      });

      const response = await cloneSingle(request);
      expect(response.status).toBe(403);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should support optional parameters', async () => {
      const character = await prisma.character.create({
        data: { name: 'Character', projectId: sourceProjectId },
      });

      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: character.id,
          sourceType: ContentType.CHARACTER,
          targetProjectId,
          userId: testUserId,
          nameSuffix: ' - Custom Clone',
          duplicateMediaFiles: true,
          includeRelatedContent: true,
        }),
      });

      const response = await cloneSingle(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return clone progress tracking', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: sourceProjectId },
      });

      await prisma.scene.createMany({
        data: [
          { title: 'Scene 1', episodeId: episode.id, projectId: sourceProjectId },
          { title: 'Scene 2', episodeId: episode.id, projectId: sourceProjectId },
        ],
      });

      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: episode.id,
          sourceType: ContentType.EPISODE,
          targetProjectId,
          userId: testUserId,
          includeRelatedContent: true,
        }),
      });

      const response = await cloneSingle(request);
      const data = await response.json();

      expect(data.clonedCount).toBeGreaterThan(1); // Episode + scenes
    });
  });

  describe('POST /api/clone/batch (batch clone)', () => {
    it('should clone multiple items in batch', async () => {
      const char1 = await prisma.character.create({
        data: { name: 'Character 1', projectId: sourceProjectId },
      });
      const char2 = await prisma.character.create({
        data: { name: 'Character 2', projectId: sourceProjectId },
      });

      const request = new Request('http://localhost/api/clone/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { sourceId: char1.id, sourceType: ContentType.CHARACTER },
            { sourceId: char2.id, sourceType: ContentType.CHARACTER },
          ],
          targetProjectId,
          userId: testUserId,
        }),
      });

      const response = await cloneBatch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.length).toBe(2);
      expect(data.successCount).toBe(2);
    });

    it('should handle partial failures in batch', async () => {
      const char1 = await prisma.character.create({
        data: { name: 'Character 1', projectId: sourceProjectId },
      });

      const request = new Request('http://localhost/api/clone/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { sourceId: char1.id, sourceType: ContentType.CHARACTER },
            { sourceId: 'non-existent', sourceType: ContentType.CHARACTER },
          ],
          targetProjectId,
          userId: testUserId,
        }),
      });

      const response = await cloneBatch(request);
      const data = await response.json();

      expect(data.successCount).toBe(1);
      expect(data.failureCount).toBe(1);
    });

    it('should validate batch size limits', async () => {
      const items = Array.from({ length: 101 }, (_, i) => ({
        sourceId: `id-${i}`,
        sourceType: ContentType.CHARACTER,
      }));

      const request = new Request('http://localhost/api/clone/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          targetProjectId,
          userId: testUserId,
        }),
      });

      const response = await cloneBatch(request);
      expect(response.status).toBe(400); // Too many items
    });

    it('should return detailed results for each item', async () => {
      const char1 = await prisma.character.create({
        data: { name: 'Character 1', projectId: sourceProjectId },
      });
      const char2 = await prisma.character.create({
        data: { name: 'Character 2', projectId: sourceProjectId },
      });

      const request = new Request('http://localhost/api/clone/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { sourceId: char1.id, sourceType: ContentType.CHARACTER },
            { sourceId: char2.id, sourceType: ContentType.CHARACTER },
          ],
          targetProjectId,
          userId: testUserId,
        }),
      });

      const response = await cloneBatch(request);
      const data = await response.json();

      expect(data.results[0]).toHaveProperty('success');
      expect(data.results[0]).toHaveProperty('clonedId');
      expect(data.results[1]).toHaveProperty('success');
      expect(data.results[1]).toHaveProperty('clonedId');
    });
  });

  describe('Permission Checks', () => {
    it('should deny cloning without project access', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'unauthorized@test.com',
          name: 'Unauthorized',
          password: 'hashedpassword',
        },
      });

      const character = await prisma.character.create({
        data: { name: 'Character', projectId: sourceProjectId },
      });

      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: character.id,
          sourceType: ContentType.CHARACTER,
          targetProjectId,
          userId: otherUser.id,
        }),
      });

      const response = await cloneSingle(request);
      expect(response.status).toBe(403);

      await prisma.user.delete({ where: { id: otherUser.id } });
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

      const character = await prisma.character.create({
        data: { name: 'Character', projectId: sourceProjectId },
      });

      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: character.id,
          sourceType: ContentType.CHARACTER,
          targetProjectId,
          userId: editor.id,
        }),
      });

      const response = await cloneSingle(request);
      expect(response.status).toBe(200);

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

      const character = await prisma.character.create({
        data: { name: 'Character', projectId: sourceProjectId },
      });

      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: character.id,
          sourceType: ContentType.CHARACTER,
          targetProjectId,
          userId: viewer.id,
        }),
      });

      const response = await cloneSingle(request);
      expect(response.status).toBe(403);

      await prisma.teamMember.deleteMany({ where: { userId: viewer.id } });
      await prisma.user.delete({ where: { id: viewer.id } });
    });
  });

  describe('Clone Progress Tracking', () => {
    it('should return real-time progress updates', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Large Episode', projectId: sourceProjectId },
      });

      await prisma.scene.createMany({
        data: Array.from({ length: 10 }, (_, i) => ({
          title: `Scene ${i + 1}`,
          episodeId: episode.id,
          projectId: sourceProjectId,
        })),
      });

      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: episode.id,
          sourceType: ContentType.EPISODE,
          targetProjectId,
          userId: testUserId,
          includeRelatedContent: true,
        }),
      });

      const response = await cloneSingle(request);
      const data = await response.json();

      expect(data.progress).toBeDefined();
      expect(data.clonedCount).toBeGreaterThan(1);
    });

    it('should track estimated completion time', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: sourceProjectId },
      });

      const request = new Request('http://localhost/api/clone/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: episode.id,
          sourceType: ContentType.EPISODE,
          targetProjectId,
          userId: testUserId,
        }),
      });

      const response = await cloneSingle(request);
      const data = await response.json();

      expect(data.estimatedTime).toBeDefined();
    });
  });
});
