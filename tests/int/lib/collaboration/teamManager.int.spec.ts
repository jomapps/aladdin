import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TeamManager } from '@/lib/collaboration/TeamManager';
import { prisma } from '@/lib/prisma';
import { TeamRole } from '@prisma/client';

describe('Team Manager Integration Tests', () => {
  let testOwnerId: string;
  let testProjectId: string;
  let testMemberId: string;
  let teamManager: TeamManager;

  beforeEach(async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        name: 'Project Owner',
        password: 'hashedpassword',
      },
    });
    testOwnerId = owner.id;

    const member = await prisma.user.create({
      data: {
        email: 'member@test.com',
        name: 'Team Member',
        password: 'hashedpassword',
      },
    });
    testMemberId = member.id;

    const project = await prisma.project.create({
      data: {
        title: 'Team Test Project',
        ownerId: testOwnerId,
      },
    });
    testProjectId = project.id;

    teamManager = new TeamManager();
  });

  afterEach(async () => {
    await prisma.teamMember.deleteMany({ where: { projectId: testProjectId } });
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.deleteMany({ where: { id: { in: [testOwnerId, testMemberId] } } });
  });

  describe('Add Team Member', () => {
    it('should add team member with editor role', async () => {
      const result = await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.EDITOR,
        addedBy: testOwnerId,
      });

      expect(result.success).toBe(true);
      expect(result.member.userId).toBe(testMemberId);
      expect(result.member.role).toBe(TeamRole.EDITOR);
    });

    it('should add team member with viewer role', async () => {
      const result = await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.VIEWER,
        addedBy: testOwnerId,
      });

      expect(result.member.role).toBe(TeamRole.VIEWER);
    });

    it('should add team member with collaborator role', async () => {
      const result = await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.COLLABORATOR,
        addedBy: testOwnerId,
      });

      expect(result.member.role).toBe(TeamRole.COLLABORATOR);
    });

    it('should store team member in database', async () => {
      await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.EDITOR,
        addedBy: testOwnerId,
      });

      const dbMember = await prisma.teamMember.findFirst({
        where: { projectId: testProjectId, userId: testMemberId },
      });

      expect(dbMember).toBeDefined();
      expect(dbMember?.role).toBe(TeamRole.EDITOR);
    });

    it('should reject non-owner adding members', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
          password: 'hashedpassword',
        },
      });

      await expect(
        teamManager.addMember({
          projectId: testProjectId,
          userId: testMemberId,
          role: TeamRole.EDITOR,
          addedBy: otherUser.id, // Not owner
        })
      ).rejects.toThrow('Only project owner can add team members');

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should validate user exists before adding', async () => {
      await expect(
        teamManager.addMember({
          projectId: testProjectId,
          userId: 'non-existent-user',
          role: TeamRole.EDITOR,
          addedBy: testOwnerId,
        })
      ).rejects.toThrow('User not found');
    });

    it('should validate project exists before adding', async () => {
      await expect(
        teamManager.addMember({
          projectId: 'non-existent-project',
          userId: testMemberId,
          role: TeamRole.EDITOR,
          addedBy: testOwnerId,
        })
      ).rejects.toThrow('Project not found');
    });
  });

  describe('Remove Team Member', () => {
    beforeEach(async () => {
      await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.EDITOR,
        addedBy: testOwnerId,
      });
    });

    it('should remove team member', async () => {
      const result = await teamManager.removeMember({
        projectId: testProjectId,
        userId: testMemberId,
        removedBy: testOwnerId,
      });

      expect(result.success).toBe(true);

      const dbMember = await prisma.teamMember.findFirst({
        where: { projectId: testProjectId, userId: testMemberId },
      });

      expect(dbMember).toBeNull();
    });

    it('should reject non-owner removing members', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
          password: 'hashedpassword',
        },
      });

      await expect(
        teamManager.removeMember({
          projectId: testProjectId,
          userId: testMemberId,
          removedBy: otherUser.id, // Not owner
        })
      ).rejects.toThrow('Only project owner can remove team members');

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should prevent owner from being removed', async () => {
      await expect(
        teamManager.removeMember({
          projectId: testProjectId,
          userId: testOwnerId,
          removedBy: testOwnerId,
        })
      ).rejects.toThrow('Cannot remove project owner');
    });

    it('should fail when removing non-member', async () => {
      const nonMember = await prisma.user.create({
        data: {
          email: 'nonmember@test.com',
          name: 'Non Member',
          password: 'hashedpassword',
        },
      });

      await expect(
        teamManager.removeMember({
          projectId: testProjectId,
          userId: nonMember.id,
          removedBy: testOwnerId,
        })
      ).rejects.toThrow('User is not a team member');

      await prisma.user.delete({ where: { id: nonMember.id } });
    });
  });

  describe('Update Member Role', () => {
    beforeEach(async () => {
      await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.VIEWER,
        addedBy: testOwnerId,
      });
    });

    it('should update member role from viewer to editor', async () => {
      const result = await teamManager.updateRole({
        projectId: testProjectId,
        userId: testMemberId,
        newRole: TeamRole.EDITOR,
        updatedBy: testOwnerId,
      });

      expect(result.success).toBe(true);
      expect(result.member.role).toBe(TeamRole.EDITOR);
    });

    it('should update member role from editor to collaborator', async () => {
      await teamManager.updateRole({
        projectId: testProjectId,
        userId: testMemberId,
        newRole: TeamRole.EDITOR,
        updatedBy: testOwnerId,
      });

      const result = await teamManager.updateRole({
        projectId: testProjectId,
        userId: testMemberId,
        newRole: TeamRole.COLLABORATOR,
        updatedBy: testOwnerId,
      });

      expect(result.member.role).toBe(TeamRole.COLLABORATOR);
    });

    it('should reject non-owner updating roles', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
          password: 'hashedpassword',
        },
      });

      await expect(
        teamManager.updateRole({
          projectId: testProjectId,
          userId: testMemberId,
          newRole: TeamRole.EDITOR,
          updatedBy: otherUser.id,
        })
      ).rejects.toThrow('Only project owner can update roles');

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should prevent changing owner role', async () => {
      await expect(
        teamManager.updateRole({
          projectId: testProjectId,
          userId: testOwnerId,
          newRole: TeamRole.EDITOR,
          updatedBy: testOwnerId,
        })
      ).rejects.toThrow('Cannot change owner role');
    });

    it('should persist role changes in database', async () => {
      await teamManager.updateRole({
        projectId: testProjectId,
        userId: testMemberId,
        newRole: TeamRole.EDITOR,
        updatedBy: testOwnerId,
      });

      const dbMember = await prisma.teamMember.findFirst({
        where: { projectId: testProjectId, userId: testMemberId },
      });

      expect(dbMember?.role).toBe(TeamRole.EDITOR);
    });
  });

  describe('List Team Members', () => {
    it('should list all team members', async () => {
      await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.EDITOR,
        addedBy: testOwnerId,
      });

      const member2 = await prisma.user.create({
        data: {
          email: 'member2@test.com',
          name: 'Member 2',
          password: 'hashedpassword',
        },
      });

      await teamManager.addMember({
        projectId: testProjectId,
        userId: member2.id,
        role: TeamRole.VIEWER,
        addedBy: testOwnerId,
      });

      const members = await teamManager.listMembers({ projectId: testProjectId });

      expect(members.length).toBe(3); // Owner + 2 members
      expect(members.some((m) => m.userId === testOwnerId)).toBe(true);
      expect(members.some((m) => m.userId === testMemberId)).toBe(true);
      expect(members.some((m) => m.userId === member2.id)).toBe(true);

      await prisma.user.delete({ where: { id: member2.id } });
    });

    it('should include user details in team list', async () => {
      await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.EDITOR,
        addedBy: testOwnerId,
      });

      const members = await teamManager.listMembers({
        projectId: testProjectId,
        includeUserDetails: true,
      });

      const member = members.find((m) => m.userId === testMemberId);
      expect(member?.user).toBeDefined();
      expect(member?.user?.name).toBe('Team Member');
      expect(member?.user?.email).toBe('member@test.com');
    });

    it('should filter members by role', async () => {
      await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.EDITOR,
        addedBy: testOwnerId,
      });

      const member2 = await prisma.user.create({
        data: {
          email: 'viewer@test.com',
          name: 'Viewer',
          password: 'hashedpassword',
        },
      });

      await teamManager.addMember({
        projectId: testProjectId,
        userId: member2.id,
        role: TeamRole.VIEWER,
        addedBy: testOwnerId,
      });

      const editors = await teamManager.listMembers({
        projectId: testProjectId,
        role: TeamRole.EDITOR,
      });

      expect(editors.length).toBe(1);
      expect(editors[0].role).toBe(TeamRole.EDITOR);

      await prisma.user.delete({ where: { id: member2.id } });
    });
  });

  describe('Duplicate Member Prevention', () => {
    it('should prevent adding duplicate team member', async () => {
      await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.EDITOR,
        addedBy: testOwnerId,
      });

      await expect(
        teamManager.addMember({
          projectId: testProjectId,
          userId: testMemberId,
          role: TeamRole.VIEWER,
          addedBy: testOwnerId,
        })
      ).rejects.toThrow('User is already a team member');
    });

    it('should allow same user in different projects', async () => {
      const project2 = await prisma.project.create({
        data: {
          title: 'Project 2',
          ownerId: testOwnerId,
        },
      });

      await teamManager.addMember({
        projectId: testProjectId,
        userId: testMemberId,
        role: TeamRole.EDITOR,
        addedBy: testOwnerId,
      });

      const result = await teamManager.addMember({
        projectId: project2.id,
        userId: testMemberId,
        role: TeamRole.VIEWER,
        addedBy: testOwnerId,
      });

      expect(result.success).toBe(true);

      await prisma.project.delete({ where: { id: project2.id } });
    });
  });

  describe('Team Member Validation', () => {
    it('should validate role values', async () => {
      await expect(
        teamManager.addMember({
          projectId: testProjectId,
          userId: testMemberId,
          role: 'INVALID_ROLE' as TeamRole,
          addedBy: testOwnerId,
        })
      ).rejects.toThrow('Invalid role');
    });

    it('should validate user ID format', async () => {
      await expect(
        teamManager.addMember({
          projectId: testProjectId,
          userId: '',
          role: TeamRole.EDITOR,
          addedBy: testOwnerId,
        })
      ).rejects.toThrow('Invalid user ID');
    });

    it('should validate project ID format', async () => {
      await expect(
        teamManager.addMember({
          projectId: '',
          userId: testMemberId,
          role: TeamRole.EDITOR,
          addedBy: testOwnerId,
        })
      ).rejects.toThrow('Invalid project ID');
    });
  });
});
