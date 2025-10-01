import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AccessControl } from '@/lib/collaboration/AccessControl';
import { prisma } from '@/lib/prisma';
import { TeamRole, Permission } from '@prisma/client';

describe('Access Control Integration Tests', () => {
  let testOwnerId: string;
  let testEditorId: string;
  let testViewerId: string;
  let testCollaboratorId: string;
  let testProjectId: string;
  let accessControl: AccessControl;

  beforeEach(async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@test.com', name: 'Owner', password: 'hash' },
    });
    testOwnerId = owner.id;

    const editor = await prisma.user.create({
      data: { email: 'editor@test.com', name: 'Editor', password: 'hash' },
    });
    testEditorId = editor.id;

    const viewer = await prisma.user.create({
      data: { email: 'viewer@test.com', name: 'Viewer', password: 'hash' },
    });
    testViewerId = viewer.id;

    const collaborator = await prisma.user.create({
      data: { email: 'collab@test.com', name: 'Collaborator', password: 'hash' },
    });
    testCollaboratorId = collaborator.id;

    const project = await prisma.project.create({
      data: { title: 'Test Project', ownerId: testOwnerId },
    });
    testProjectId = project.id;

    // Add team members
    await prisma.teamMember.createMany({
      data: [
        { projectId: testProjectId, userId: testEditorId, role: TeamRole.EDITOR },
        { projectId: testProjectId, userId: testViewerId, role: TeamRole.VIEWER },
        { projectId: testProjectId, userId: testCollaboratorId, role: TeamRole.COLLABORATOR },
      ],
    });

    accessControl = new AccessControl();
  });

  afterEach(async () => {
    await prisma.teamMember.deleteMany({ where: { projectId: testProjectId } });
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.deleteMany({
      where: { id: { in: [testOwnerId, testEditorId, testViewerId, testCollaboratorId] } },
    });
  });

  describe('Owner Permissions (Full Access)', () => {
    it('should allow owner to read project', async () => {
      const canRead = await accessControl.checkPermission({
        userId: testOwnerId,
        projectId: testProjectId,
        permission: Permission.READ,
      });

      expect(canRead).toBe(true);
    });

    it('should allow owner to edit project', async () => {
      const canEdit = await accessControl.checkPermission({
        userId: testOwnerId,
        projectId: testProjectId,
        permission: Permission.EDIT,
      });

      expect(canEdit).toBe(true);
    });

    it('should allow owner to delete project', async () => {
      const canDelete = await accessControl.checkPermission({
        userId: testOwnerId,
        projectId: testProjectId,
        permission: Permission.DELETE,
      });

      expect(canDelete).toBe(true);
    });

    it('should allow owner to manage team', async () => {
      const canManageTeam = await accessControl.checkPermission({
        userId: testOwnerId,
        projectId: testProjectId,
        permission: Permission.MANAGE_TEAM,
      });

      expect(canManageTeam).toBe(true);
    });

    it('should allow owner to export content', async () => {
      const canExport = await accessControl.checkPermission({
        userId: testOwnerId,
        projectId: testProjectId,
        permission: Permission.EXPORT,
      });

      expect(canExport).toBe(true);
    });

    it('should allow owner to clone content', async () => {
      const canClone = await accessControl.checkPermission({
        userId: testOwnerId,
        projectId: testProjectId,
        permission: Permission.CLONE,
      });

      expect(canClone).toBe(true);
    });
  });

  describe('Editor Permissions (Edit, No Delete Project)', () => {
    it('should allow editor to read project', async () => {
      const canRead = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: testProjectId,
        permission: Permission.READ,
      });

      expect(canRead).toBe(true);
    });

    it('should allow editor to edit content', async () => {
      const canEdit = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: testProjectId,
        permission: Permission.EDIT,
      });

      expect(canEdit).toBe(true);
    });

    it('should deny editor from deleting project', async () => {
      const canDelete = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: testProjectId,
        permission: Permission.DELETE_PROJECT,
      });

      expect(canDelete).toBe(false);
    });

    it('should allow editor to delete content', async () => {
      const canDelete = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: testProjectId,
        permission: Permission.DELETE,
      });

      expect(canDelete).toBe(true);
    });

    it('should deny editor from managing team', async () => {
      const canManageTeam = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: testProjectId,
        permission: Permission.MANAGE_TEAM,
      });

      expect(canManageTeam).toBe(false);
    });

    it('should allow editor to export content', async () => {
      const canExport = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: testProjectId,
        permission: Permission.EXPORT,
      });

      expect(canExport).toBe(true);
    });

    it('should allow editor to clone content', async () => {
      const canClone = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: testProjectId,
        permission: Permission.CLONE,
      });

      expect(canClone).toBe(true);
    });
  });

  describe('Viewer Permissions (Read-Only)', () => {
    it('should allow viewer to read project', async () => {
      const canRead = await accessControl.checkPermission({
        userId: testViewerId,
        projectId: testProjectId,
        permission: Permission.READ,
      });

      expect(canRead).toBe(true);
    });

    it('should deny viewer from editing content', async () => {
      const canEdit = await accessControl.checkPermission({
        userId: testViewerId,
        projectId: testProjectId,
        permission: Permission.EDIT,
      });

      expect(canEdit).toBe(false);
    });

    it('should deny viewer from deleting content', async () => {
      const canDelete = await accessControl.checkPermission({
        userId: testViewerId,
        projectId: testProjectId,
        permission: Permission.DELETE,
      });

      expect(canDelete).toBe(false);
    });

    it('should deny viewer from managing team', async () => {
      const canManageTeam = await accessControl.checkPermission({
        userId: testViewerId,
        projectId: testProjectId,
        permission: Permission.MANAGE_TEAM,
      });

      expect(canManageTeam).toBe(false);
    });

    it('should deny viewer from exporting content', async () => {
      const canExport = await accessControl.checkPermission({
        userId: testViewerId,
        projectId: testProjectId,
        permission: Permission.EXPORT,
      });

      expect(canExport).toBe(false);
    });

    it('should deny viewer from cloning content', async () => {
      const canClone = await accessControl.checkPermission({
        userId: testViewerId,
        projectId: testProjectId,
        permission: Permission.CLONE,
      });

      expect(canClone).toBe(false);
    });
  });

  describe('Collaborator Permissions (Edit Assets)', () => {
    it('should allow collaborator to read project', async () => {
      const canRead = await accessControl.checkPermission({
        userId: testCollaboratorId,
        projectId: testProjectId,
        permission: Permission.READ,
      });

      expect(canRead).toBe(true);
    });

    it('should allow collaborator to edit characters', async () => {
      const canEdit = await accessControl.checkPermission({
        userId: testCollaboratorId,
        projectId: testProjectId,
        permission: Permission.EDIT_CHARACTER,
      });

      expect(canEdit).toBe(true);
    });

    it('should allow collaborator to edit locations', async () => {
      const canEdit = await accessControl.checkPermission({
        userId: testCollaboratorId,
        projectId: testProjectId,
        permission: Permission.EDIT_LOCATION,
      });

      expect(canEdit).toBe(true);
    });

    it('should deny collaborator from editing scenes', async () => {
      const canEdit = await accessControl.checkPermission({
        userId: testCollaboratorId,
        projectId: testProjectId,
        permission: Permission.EDIT_SCENE,
      });

      expect(canEdit).toBe(false);
    });

    it('should deny collaborator from deleting content', async () => {
      const canDelete = await accessControl.checkPermission({
        userId: testCollaboratorId,
        projectId: testProjectId,
        permission: Permission.DELETE,
      });

      expect(canDelete).toBe(false);
    });

    it('should deny collaborator from managing team', async () => {
      const canManageTeam = await accessControl.checkPermission({
        userId: testCollaboratorId,
        projectId: testProjectId,
        permission: Permission.MANAGE_TEAM,
      });

      expect(canManageTeam).toBe(false);
    });

    it('should allow collaborator to export assets', async () => {
      const canExport = await accessControl.checkPermission({
        userId: testCollaboratorId,
        projectId: testProjectId,
        permission: Permission.EXPORT_ASSETS,
      });

      expect(canExport).toBe(true);
    });
  });

  describe('Permission Denial Scenarios', () => {
    it('should deny access to non-team member', async () => {
      const outsider = await prisma.user.create({
        data: { email: 'outsider@test.com', name: 'Outsider', password: 'hash' },
      });

      const canRead = await accessControl.checkPermission({
        userId: outsider.id,
        projectId: testProjectId,
        permission: Permission.READ,
      });

      expect(canRead).toBe(false);

      await prisma.user.delete({ where: { id: outsider.id } });
    });

    it('should deny access to deleted project', async () => {
      const deletedProject = await prisma.project.create({
        data: {
          title: 'Deleted Project',
          ownerId: testOwnerId,
          deletedAt: new Date(),
        },
      });

      const canRead = await accessControl.checkPermission({
        userId: testOwnerId,
        projectId: deletedProject.id,
        permission: Permission.READ,
      });

      expect(canRead).toBe(false);

      await prisma.project.delete({ where: { id: deletedProject.id } });
    });

    it('should deny access to archived project', async () => {
      const archivedProject = await prisma.project.create({
        data: {
          title: 'Archived Project',
          ownerId: testOwnerId,
          archived: true,
        },
      });

      const canEdit = await accessControl.checkPermission({
        userId: testOwnerId,
        projectId: archivedProject.id,
        permission: Permission.EDIT,
      });

      expect(canEdit).toBe(false);

      await prisma.project.delete({ where: { id: archivedProject.id } });
    });

    it('should deny access with invalid project ID', async () => {
      await expect(
        accessControl.checkPermission({
          userId: testOwnerId,
          projectId: 'non-existent-project',
          permission: Permission.READ,
        })
      ).rejects.toThrow('Project not found');
    });

    it('should deny access with invalid user ID', async () => {
      await expect(
        accessControl.checkPermission({
          userId: 'non-existent-user',
          projectId: testProjectId,
          permission: Permission.READ,
        })
      ).rejects.toThrow('User not found');
    });
  });

  describe('Cross-Project Access Prevention', () => {
    it('should prevent access to different project', async () => {
      const otherProject = await prisma.project.create({
        data: {
          title: 'Other Project',
          ownerId: testEditorId, // Different owner
        },
      });

      const canRead = await accessControl.checkPermission({
        userId: testOwnerId,
        projectId: otherProject.id,
        permission: Permission.READ,
      });

      expect(canRead).toBe(false);

      await prisma.project.delete({ where: { id: otherProject.id } });
    });

    it('should isolate permissions between projects', async () => {
      const project2 = await prisma.project.create({
        data: { title: 'Project 2', ownerId: testOwnerId },
      });

      // Editor has access to project 1 but not project 2
      const canReadProject1 = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: testProjectId,
        permission: Permission.READ,
      });

      const canReadProject2 = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: project2.id,
        permission: Permission.READ,
      });

      expect(canReadProject1).toBe(true);
      expect(canReadProject2).toBe(false);

      await prisma.project.delete({ where: { id: project2.id } });
    });

    it('should not leak permissions between projects', async () => {
      const project2 = await prisma.project.create({
        data: { title: 'Project 2', ownerId: testOwnerId },
      });

      await prisma.teamMember.create({
        data: {
          projectId: project2.id,
          userId: testEditorId,
          role: TeamRole.VIEWER, // Different role in different project
        },
      });

      // Editor has edit permission in project 1
      const canEditProject1 = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: testProjectId,
        permission: Permission.EDIT,
      });

      // But only view permission in project 2
      const canEditProject2 = await accessControl.checkPermission({
        userId: testEditorId,
        projectId: project2.id,
        permission: Permission.EDIT,
      });

      expect(canEditProject1).toBe(true);
      expect(canEditProject2).toBe(false);

      await prisma.teamMember.deleteMany({ where: { projectId: project2.id } });
      await prisma.project.delete({ where: { id: project2.id } });
    });
  });

  describe('Role-Based Route Protection', () => {
    it('should protect character creation route', async () => {
      const canCreate = await accessControl.canAccessRoute({
        userId: testViewerId,
        projectId: testProjectId,
        route: '/api/characters/create',
        method: 'POST',
      });

      expect(canCreate).toBe(false);
    });

    it('should protect team management route', async () => {
      const canManage = await accessControl.canAccessRoute({
        userId: testEditorId,
        projectId: testProjectId,
        route: '/api/team/add',
        method: 'POST',
      });

      expect(canManage).toBe(false);
    });

    it('should allow viewer to access read routes', async () => {
      const canRead = await accessControl.canAccessRoute({
        userId: testViewerId,
        projectId: testProjectId,
        route: '/api/characters',
        method: 'GET',
      });

      expect(canRead).toBe(true);
    });

    it('should allow editor to access edit routes', async () => {
      const canEdit = await accessControl.canAccessRoute({
        userId: testEditorId,
        projectId: testProjectId,
        route: '/api/scenes/[id]/edit',
        method: 'PUT',
      });

      expect(canEdit).toBe(true);
    });

    it('should protect delete routes', async () => {
      const canDelete = await accessControl.canAccessRoute({
        userId: testViewerId,
        projectId: testProjectId,
        route: '/api/characters/[id]',
        method: 'DELETE',
      });

      expect(canDelete).toBe(false);
    });

    it('should protect export routes', async () => {
      const canExport = await accessControl.canAccessRoute({
        userId: testViewerId,
        projectId: testProjectId,
        route: '/api/export',
        method: 'POST',
      });

      expect(canExport).toBe(false);
    });

    it('should allow owner to access all routes', async () => {
      const routes = [
        { route: '/api/characters', method: 'POST' },
        { route: '/api/team/add', method: 'POST' },
        { route: '/api/project/delete', method: 'DELETE' },
        { route: '/api/export', method: 'POST' },
      ];

      for (const { route, method } of routes) {
        const canAccess = await accessControl.canAccessRoute({
          userId: testOwnerId,
          projectId: testProjectId,
          route,
          method,
        });
        expect(canAccess).toBe(true);
      }
    });
  });
});
