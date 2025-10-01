/**
 * Access Control System
 * Role-based permissions for team collaboration
 */

import { getPayload } from 'payload';
import configPromise from '@payload-config';

export enum TeamRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  COLLABORATOR = 'collaborator',
}

export enum Permission {
  // Project permissions
  PROJECT_READ = 'project:read',
  PROJECT_WRITE = 'project:write',
  PROJECT_DELETE = 'project:delete',
  PROJECT_SETTINGS = 'project:settings',

  // Content permissions
  CONTENT_CREATE = 'content:create',
  CONTENT_READ = 'content:read',
  CONTENT_WRITE = 'content:write',
  CONTENT_DELETE = 'content:delete',

  // Team permissions
  TEAM_READ = 'team:read',
  TEAM_INVITE = 'team:invite',
  TEAM_MANAGE = 'team:manage',

  // Export permissions
  EXPORT_CREATE = 'export:create',
  EXPORT_DOWNLOAD = 'export:download',

  // Asset permissions
  ASSET_UPLOAD = 'asset:upload',
  ASSET_DELETE = 'asset:delete',
}

// Role → Permissions mapping
const rolePermissions: Record<TeamRole, Permission[]> = {
  [TeamRole.OWNER]: [
    // All permissions
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_SETTINGS,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_WRITE,
    Permission.CONTENT_DELETE,
    Permission.TEAM_READ,
    Permission.TEAM_INVITE,
    Permission.TEAM_MANAGE,
    Permission.EXPORT_CREATE,
    Permission.EXPORT_DOWNLOAD,
    Permission.ASSET_UPLOAD,
    Permission.ASSET_DELETE,
  ],
  [TeamRole.EDITOR]: [
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_WRITE,
    Permission.CONTENT_DELETE,
    Permission.TEAM_READ,
    Permission.EXPORT_CREATE,
    Permission.EXPORT_DOWNLOAD,
    Permission.ASSET_UPLOAD,
  ],
  [TeamRole.COLLABORATOR]: [
    Permission.PROJECT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_WRITE,
    Permission.TEAM_READ,
    Permission.EXPORT_CREATE,
    Permission.EXPORT_DOWNLOAD,
    Permission.ASSET_UPLOAD,
  ],
  [TeamRole.VIEWER]: [
    Permission.PROJECT_READ,
    Permission.CONTENT_READ,
    Permission.TEAM_READ,
    Permission.EXPORT_DOWNLOAD,
  ],
};

/**
 * Check if user has permission for a resource
 */
export async function hasPermission(options: {
  userId: string;
  projectId: string;
  permission: Permission;
}): Promise<boolean> {
  const { userId, projectId, permission } = options;

  try {
    const payload = await getPayload({ config: configPromise });

    // Get project with team members
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 2,
    });

    if (!project) {
      return false;
    }

    // Check if user is project owner
    const ownerId = project.createdBy?.id || project.createdBy;
    if (ownerId === userId) {
      return rolePermissions[TeamRole.OWNER].includes(permission);
    }

    // Check team membership
    const teamMember = project.team?.find(
      (member: any) => (member.user?.id || member.user) === userId
    );

    if (!teamMember) {
      return false;
    }

    // Check role permissions
    const role = teamMember.role as TeamRole;
    const permissions = rolePermissions[role];

    return permissions.includes(permission);
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Check multiple permissions at once
 */
export async function hasAnyPermission(options: {
  userId: string;
  projectId: string;
  permissions: Permission[];
}): Promise<boolean> {
  const { userId, projectId, permissions } = options;

  for (const permission of permissions) {
    const allowed = await hasPermission({ userId, projectId, permission });
    if (allowed) return true;
  }

  return false;
}

/**
 * Check if user has all specified permissions
 */
export async function hasAllPermissions(options: {
  userId: string;
  projectId: string;
  permissions: Permission[];
}): Promise<boolean> {
  const { userId, projectId, permissions } = options;

  for (const permission of permissions) {
    const allowed = await hasPermission({ userId, projectId, permission });
    if (!allowed) return false;
  }

  return true;
}

/**
 * Get user's role in a project
 */
export async function getUserRole(userId: string, projectId: string): Promise<TeamRole | null> {
  try {
    const payload = await getPayload({ config: configPromise });

    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 2,
    });

    if (!project) {
      return null;
    }

    // Check if owner
    const ownerId = project.createdBy?.id || project.createdBy;
    if (ownerId === userId) {
      return TeamRole.OWNER;
    }

    // Check team membership
    const teamMember = project.team?.find(
      (member: any) => (member.user?.id || member.user) === userId
    );

    return teamMember ? (teamMember.role as TeamRole) : null;
  } catch (error) {
    console.error('Get user role error:', error);
    return null;
  }
}

/**
 * Get all permissions for a user in a project
 */
export async function getUserPermissions(
  userId: string,
  projectId: string
): Promise<Permission[]> {
  const role = await getUserRole(userId, projectId);
  return role ? rolePermissions[role] : [];
}

/**
 * Require permission middleware helper
 */
export function requirePermission(permission: Permission) {
  return async (options: { userId: string; projectId: string }) => {
    const allowed = await hasPermission({ ...options, permission });

    if (!allowed) {
      throw new Error(`Insufficient permissions: ${permission} required`);
    }

    return true;
  };
}

/**
 * Check resource-level permissions (for specific documents)
 */
export async function hasResourcePermission(options: {
  userId: string;
  resourceType: 'characters' | 'scenes' | 'episodes' | 'locations';
  resourceId: string;
  permission: Permission;
}): Promise<boolean> {
  const { userId, resourceType, resourceId, permission } = options;

  try {
    const payload = await getPayload({ config: configPromise });

    // Get resource
    const resource = await payload.findByID({
      collection: resourceType,
      id: resourceId,
    });

    if (!resource) {
      return false;
    }

    // Get project ID from resource
    const projectId = resource.project?.id || resource.project;

    if (!projectId) {
      return false;
    }

    // Check project-level permission
    return hasPermission({ userId, projectId, permission });
  } catch (error) {
    console.error('Resource permission check error:', error);
    return false;
  }
}

/**
 * Bulk permission check for multiple resources
 */
export async function hasBulkResourcePermission(options: {
  userId: string;
  resources: Array<{
    type: 'characters' | 'scenes' | 'episodes' | 'locations';
    id: string;
  }>;
  permission: Permission;
}): Promise<boolean> {
  const { userId, resources, permission } = options;

  for (const resource of resources) {
    const allowed = await hasResourcePermission({
      userId,
      resourceType: resource.type,
      resourceId: resource.id,
      permission,
    });

    if (!allowed) return false;
  }

  return true;
}
