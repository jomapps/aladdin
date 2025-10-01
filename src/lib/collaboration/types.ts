/**
 * Collaboration System Types
 */

export enum TeamRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  COLLABORATOR = 'collaborator',
  VIEWER = 'viewer',
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

export interface TeamMember {
  userId: string;
  role: TeamRole;
  addedBy: string;
  addedAt: Date;
  permissions?: Permission[];
}

export interface TeamInvitation {
  id: string;
  projectId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  token: string;
}

export type ActivityType =
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'content.created'
  | 'content.updated'
  | 'content.deleted'
  | 'export.started'
  | 'export.completed'
  | 'team.member.added'
  | 'team.member.removed'
  | 'team.role.changed'
  | 'clone.created'
  | 'media.uploaded';

export interface ActivityLog {
  id: string;
  projectId: string;
  userId: string;
  action: ActivityType;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface CollaborationSettings {
  allowInvitations: boolean;
  defaultRole: TeamRole;
  requireApproval: boolean;
  maxTeamSize?: number;
}
