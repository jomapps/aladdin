import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActivityTracker } from '@/lib/collaboration/ActivityTracker';
import { prisma } from '@/lib/prisma';
import { ActivityType } from '@prisma/client';

describe('Activity Tracker Integration Tests', () => {
  let testUserId: string;
  let testProjectId: string;
  let activityTracker: ActivityTracker;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'activity@test.com',
        name: 'Activity User',
        password: 'hashedpassword',
      },
    });
    testUserId = user.id;

    const project = await prisma.project.create({
      data: {
        title: 'Activity Test Project',
        ownerId: testUserId,
      },
    });
    testProjectId = project.id;

    activityTracker = new ActivityTracker();
  });

  afterEach(async () => {
    await prisma.activity.deleteMany({ where: { projectId: testProjectId } });
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('Activity Logging', () => {
    it('should log character creation activity', async () => {
      const character = await prisma.character.create({
        data: { name: 'Test Character', projectId: testProjectId },
      });

      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.CHARACTER_CREATED,
        entityId: character.id,
        entityType: 'CHARACTER',
        description: 'Created character "Test Character"',
      });

      const activities = await prisma.activity.findMany({
        where: { projectId: testProjectId },
      });

      expect(activities.length).toBe(1);
      expect(activities[0].type).toBe(ActivityType.CHARACTER_CREATED);
    });

    it('should log scene edit activity', async () => {
      const scene = await prisma.scene.create({
        data: { title: 'Test Scene', projectId: testProjectId },
      });

      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.SCENE_EDITED,
        entityId: scene.id,
        entityType: 'SCENE',
        description: 'Edited scene "Test Scene"',
      });

      const activities = await prisma.activity.findMany({
        where: { type: ActivityType.SCENE_EDITED },
      });

      expect(activities.length).toBe(1);
    });

    it('should log team member added activity', async () => {
      const member = await prisma.user.create({
        data: { email: 'member@test.com', name: 'Member', password: 'hash' },
      });

      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.TEAM_MEMBER_ADDED,
        entityId: member.id,
        entityType: 'USER',
        description: 'Added team member "Member"',
      });

      const activities = await prisma.activity.findMany({
        where: { type: ActivityType.TEAM_MEMBER_ADDED },
      });

      expect(activities.length).toBe(1);

      await prisma.user.delete({ where: { id: member.id } });
    });

    it('should log export activity', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode 1', projectId: testProjectId },
      });

      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.EXPORT_COMPLETED,
        entityId: episode.id,
        entityType: 'EPISODE',
        description: 'Exported episode "Episode 1"',
      });

      const activities = await prisma.activity.findMany({
        where: { type: ActivityType.EXPORT_COMPLETED },
      });

      expect(activities.length).toBe(1);
    });

    it('should log clone activity', async () => {
      const character = await prisma.character.create({
        data: { name: 'Original', projectId: testProjectId },
      });

      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.CONTENT_CLONED,
        entityId: character.id,
        entityType: 'CHARACTER',
        description: 'Cloned character "Original"',
      });

      const activities = await prisma.activity.findMany({
        where: { type: ActivityType.CONTENT_CLONED },
      });

      expect(activities.length).toBe(1);
    });

    it('should include timestamp in activity log', async () => {
      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.PROJECT_CREATED,
        entityId: testProjectId,
        entityType: 'PROJECT',
        description: 'Created project',
      });

      const activity = await prisma.activity.findFirst({
        where: { projectId: testProjectId },
      });

      expect(activity?.createdAt).toBeDefined();
      expect(activity?.createdAt).toBeInstanceOf(Date);
    });

    it('should store activity metadata', async () => {
      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.SCENE_EDITED,
        entityId: 'scene-id',
        entityType: 'SCENE',
        description: 'Edited scene',
        metadata: {
          field: 'dialogue',
          oldValue: 'Hello',
          newValue: 'Hi there',
        },
      });

      const activity = await prisma.activity.findFirst({
        where: { projectId: testProjectId },
      });

      expect(activity?.metadata).toBeDefined();
      expect(activity?.metadata.field).toBe('dialogue');
    });
  });

  describe('Activity Feed Generation', () => {
    beforeEach(async () => {
      // Create sample activities
      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.CHARACTER_CREATED,
        entityId: 'char-1',
        entityType: 'CHARACTER',
        description: 'Created character 1',
      });

      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.SCENE_CREATED,
        entityId: 'scene-1',
        entityType: 'SCENE',
        description: 'Created scene 1',
      });

      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.EXPORT_COMPLETED,
        entityId: 'export-1',
        entityType: 'EXPORT',
        description: 'Exported content',
      });
    });

    it('should generate activity feed for project', async () => {
      const feed = await activityTracker.getActivityFeed({
        projectId: testProjectId,
      });

      expect(feed.length).toBe(3);
    });

    it('should order activities by timestamp descending', async () => {
      const feed = await activityTracker.getActivityFeed({
        projectId: testProjectId,
      });

      expect(feed[0].type).toBe(ActivityType.EXPORT_COMPLETED); // Latest
      expect(feed[2].type).toBe(ActivityType.CHARACTER_CREATED); // Earliest
    });

    it('should include user information in feed', async () => {
      const feed = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        includeUser: true,
      });

      expect(feed[0].user).toBeDefined();
      expect(feed[0].user?.name).toBe('Activity User');
    });

    it('should limit feed results', async () => {
      const feed = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        limit: 2,
      });

      expect(feed.length).toBe(2);
    });

    it('should paginate activity feed', async () => {
      const page1 = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        limit: 2,
        offset: 0,
      });

      const page2 = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        limit: 2,
        offset: 2,
      });

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(1);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('Activity Filtering', () => {
    beforeEach(async () => {
      const user2 = await prisma.user.create({
        data: { email: 'user2@test.com', name: 'User 2', password: 'hash' },
      });

      await activityTracker.logActivity({
        userId: testUserId,
        projectId: testProjectId,
        type: ActivityType.CHARACTER_CREATED,
        entityId: 'char-1',
        entityType: 'CHARACTER',
        description: 'User 1 created character',
      });

      await activityTracker.logActivity({
        userId: user2.id,
        projectId: testProjectId,
        type: ActivityType.SCENE_CREATED,
        entityId: 'scene-1',
        entityType: 'SCENE',
        description: 'User 2 created scene',
      });

      await prisma.user.delete({ where: { id: user2.id } }).catch(() => {});
    });

    it('should filter activities by user', async () => {
      const feed = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        userId: testUserId,
      });

      expect(feed.length).toBe(1);
      expect(feed[0].type).toBe(ActivityType.CHARACTER_CREATED);
    });

    it('should filter activities by type', async () => {
      const feed = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        type: ActivityType.SCENE_CREATED,
      });

      expect(feed.length).toBe(1);
      expect(feed[0].type).toBe(ActivityType.SCENE_CREATED);
    });

    it('should filter activities by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const feed = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        startDate: yesterday,
        endDate: now,
      });

      expect(feed.length).toBeGreaterThan(0);
    });

    it('should filter activities by entity type', async () => {
      const feed = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        entityType: 'CHARACTER',
      });

      expect(feed.length).toBeGreaterThan(0);
      expect(feed[0].entityType).toBe('CHARACTER');
    });

    it('should combine multiple filters', async () => {
      const feed = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        userId: testUserId,
        type: ActivityType.CHARACTER_CREATED,
      });

      expect(feed.length).toBe(1);
      expect(feed[0].type).toBe(ActivityType.CHARACTER_CREATED);
      expect(feed[0].userId).toBe(testUserId);
    });
  });

  describe('Audit Trail Creation', () => {
    it('should create audit trail for sensitive operations', async () => {
      await activityTracker.logAuditTrail({
        userId: testUserId,
        projectId: testProjectId,
        action: 'DELETE_PROJECT',
        entityId: testProjectId,
        entityType: 'PROJECT',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      const audit = await prisma.auditLog.findFirst({
        where: { projectId: testProjectId },
      });

      expect(audit).toBeDefined();
      expect(audit?.action).toBe('DELETE_PROJECT');
    });

    it('should store IP address in audit trail', async () => {
      await activityTracker.logAuditTrail({
        userId: testUserId,
        projectId: testProjectId,
        action: 'CHANGE_PERMISSIONS',
        entityId: testUserId,
        entityType: 'USER',
        ipAddress: '10.0.0.1',
      });

      const audit = await prisma.auditLog.findFirst({
        where: { userId: testUserId },
      });

      expect(audit?.ipAddress).toBe('10.0.0.1');
    });

    it('should store user agent in audit trail', async () => {
      await activityTracker.logAuditTrail({
        userId: testUserId,
        projectId: testProjectId,
        action: 'EXPORT_DATA',
        entityId: 'export-1',
        entityType: 'EXPORT',
        userAgent: 'Chrome/91.0',
      });

      const audit = await prisma.auditLog.findFirst({
        where: { action: 'EXPORT_DATA' },
      });

      expect(audit?.userAgent).toBe('Chrome/91.0');
    });

    it('should create immutable audit records', async () => {
      const auditId = await activityTracker.logAuditTrail({
        userId: testUserId,
        projectId: testProjectId,
        action: 'MODIFY_TEAM',
        entityId: testUserId,
        entityType: 'USER',
      });

      // Attempt to modify audit record (should fail)
      await expect(
        prisma.auditLog.update({
          where: { id: auditId },
          data: { action: 'MODIFIED_ACTION' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Activity Pagination', () => {
    beforeEach(async () => {
      // Create 25 activities
      for (let i = 0; i < 25; i++) {
        await activityTracker.logActivity({
          userId: testUserId,
          projectId: testProjectId,
          type: ActivityType.CHARACTER_CREATED,
          entityId: `char-${i}`,
          entityType: 'CHARACTER',
          description: `Created character ${i}`,
        });
      }
    });

    it('should paginate activities', async () => {
      const page1 = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        limit: 10,
        offset: 0,
      });

      const page2 = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        limit: 10,
        offset: 10,
      });

      expect(page1.length).toBe(10);
      expect(page2.length).toBe(10);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should return total activity count', async () => {
      const result = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        includeTotalCount: true,
      });

      expect(result.totalCount).toBe(25);
      expect(result.activities.length).toBeLessThanOrEqual(25);
    });

    it('should handle last page correctly', async () => {
      const lastPage = await activityTracker.getActivityFeed({
        projectId: testProjectId,
        limit: 10,
        offset: 20,
      });

      expect(lastPage.length).toBe(5); // Only 5 items left
    });
  });
});
