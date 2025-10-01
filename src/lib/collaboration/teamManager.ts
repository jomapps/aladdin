/**
 * Team Manager
 * Handles team member operations (add, remove, update role)
 */

import { z } from 'zod';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { TeamRole, hasPermission, Permission } from './accessControl';
import { ActivityTracker } from './activityTracker';

export interface TeamMember {
  id: string;
  user: string | any;
  role: TeamRole;
  joinedAt: Date;
  addedBy: string;
}

const addMemberSchema = z.object({
  projectId: z.string().min(1),
  userEmail: z.string().email(),
  role: z.nativeEnum(TeamRole),
  addedBy: z.string().min(1),
});

const updateRoleSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  newRole: z.nativeEnum(TeamRole),
  updatedBy: z.string().min(1),
});

const activityTracker = new ActivityTracker();

/**
 * Add team member to project
 */
export async function addTeamMember(options: {
  projectId: string;
  userEmail: string;
  role: TeamRole;
  addedBy: string;
}): Promise<TeamMember> {
  try {
    // Validate input
    const validated = addMemberSchema.parse(options);
    const { projectId, userEmail, role, addedBy } = validated;

    const payload = await getPayload({ config: configPromise });

    // Check if adder has permission
    const canInvite = await hasPermission({
      userId: addedBy,
      projectId,
      permission: Permission.TEAM_INVITE,
    });

    if (!canInvite) {
      throw new Error('Insufficient permissions to invite team members');
    }

    // Find user by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: userEmail,
        },
      },
    });

    if (!users.docs || users.docs.length === 0) {
      throw new Error(`User not found: ${userEmail}`);
    }

    const user = users.docs[0];

    // Get project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Check if user is already a team member
    const existingMember = project.team?.find(
      (member: any) => (member.user?.id || member.user) === user.id
    );

    if (existingMember) {
      throw new Error('User is already a team member');
    }

    // Add team member
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      user: user.id,
      role,
      joinedAt: new Date(),
      addedBy,
    };

    const updatedTeam = [...(project.team || []), newMember];

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: {
        team: updatedTeam,
      },
    });

    // Log activity
    await activityTracker.logActivity({
      userId: addedBy,
      projectId,
      action: 'team_member_added',
      metadata: {
        addedUserId: user.id,
        addedUserEmail: userEmail,
        role,
      },
    });

    // Send notification email to new member
    await sendTeamInviteEmail(userEmail, project.name, role);

    return newMember;
  } catch (error) {
    console.error('Add team member error:', error);
    throw error;
  }
}

/**
 * Remove team member from project
 */
export async function removeTeamMember(options: {
  projectId: string;
  userId: string;
  removedBy: string;
}): Promise<void> {
  try {
    const { projectId, userId, removedBy } = options;

    const payload = await getPayload({ config: configPromise });

    // Check if remover has permission
    const canManage = await hasPermission({
      userId: removedBy,
      projectId,
      permission: Permission.TEAM_MANAGE,
    });

    if (!canManage) {
      throw new Error('Insufficient permissions to remove team members');
    }

    // Get project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Check if user is project owner (cannot be removed)
    const ownerId = project.createdBy?.id || project.createdBy;
    if (ownerId === userId) {
      throw new Error('Cannot remove project owner');
    }

    // Remove team member
    const updatedTeam = (project.team || []).filter(
      (member: any) => (member.user?.id || member.user) !== userId
    );

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: {
        team: updatedTeam,
      },
    });

    // Log activity
    await activityTracker.logActivity({
      userId: removedBy,
      projectId,
      action: 'team_member_removed',
      metadata: {
        removedUserId: userId,
      },
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    throw error;
  }
}

/**
 * Update team member role
 */
export async function updateMemberRole(options: {
  projectId: string;
  userId: string;
  newRole: TeamRole;
  updatedBy: string;
}): Promise<void> {
  try {
    // Validate input
    const validated = updateRoleSchema.parse(options);
    const { projectId, userId, newRole, updatedBy } = validated;

    const payload = await getPayload({ config: configPromise });

    // Check if updater has permission
    const canManage = await hasPermission({
      userId: updatedBy,
      projectId,
      permission: Permission.TEAM_MANAGE,
    });

    if (!canManage) {
      throw new Error('Insufficient permissions to update team member roles');
    }

    // Get project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Check if user is project owner (cannot change owner role)
    const ownerId = project.createdBy?.id || project.createdBy;
    if (ownerId === userId) {
      throw new Error('Cannot change project owner role');
    }

    // Update team member role
    const updatedTeam = (project.team || []).map((member: any) => {
      const memberId = member.user?.id || member.user;
      if (memberId === userId) {
        return { ...member, role: newRole };
      }
      return member;
    });

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: {
        team: updatedTeam,
      },
    });

    // Log activity
    await activityTracker.logActivity({
      userId: updatedBy,
      projectId,
      action: 'team_member_role_updated',
      metadata: {
        targetUserId: userId,
        newRole,
      },
    });
  } catch (error) {
    console.error('Update member role error:', error);
    throw error;
  }
}

/**
 * List team members for a project
 */
export async function listTeamMembers(
  projectId: string,
  requesterId: string
): Promise<TeamMember[]> {
  try {
    const payload = await getPayload({ config: configPromise });

    // Check if requester has permission
    const canView = await hasPermission({
      userId: requesterId,
      projectId,
      permission: Permission.TEAM_READ,
    });

    if (!canView) {
      throw new Error('Insufficient permissions to view team members');
    }

    // Get project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 2,
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Build team members list
    const teamMembers: TeamMember[] = [];

    // Add project owner
    const owner = project.createdBy;
    if (owner) {
      teamMembers.push({
        id: 'owner',
        user: owner,
        role: TeamRole.OWNER,
        joinedAt: new Date(project.createdAt),
        addedBy: 'system',
      });
    }

    // Add team members
    if (project.team) {
      teamMembers.push(...project.team);
    }

    return teamMembers;
  } catch (error) {
    console.error('List team members error:', error);
    throw error;
  }
}

/**
 * Check if user is team member
 */
export async function isTeamMember(userId: string, projectId: string): Promise<boolean> {
  try {
    const payload = await getPayload({ config: configPromise });

    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    });

    if (!project) {
      return false;
    }

    // Check if owner
    const ownerId = project.createdBy?.id || project.createdBy;
    if (ownerId === userId) {
      return true;
    }

    // Check team membership
    const isMember = project.team?.some(
      (member: any) => (member.user?.id || member.user) === userId
    );

    return isMember || false;
  } catch (error) {
    console.error('Is team member check error:', error);
    return false;
  }
}

/**
 * Send team invite email (placeholder)
 */
async function sendTeamInviteEmail(
  email: string,
  projectName: string,
  role: TeamRole
): Promise<void> {
  // In production, integrate with email service (SendGrid, Postmark, etc.)
  console.log(`Sending team invite email to ${email} for project ${projectName} as ${role}`);
}

/**
 * Get team statistics
 */
export async function getTeamStats(projectId: string): Promise<{
  totalMembers: number;
  roleBreakdown: Record<TeamRole, number>;
}> {
  try {
    const payload = await getPayload({ config: configPromise });

    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const roleBreakdown: Record<TeamRole, number> = {
      [TeamRole.OWNER]: 1, // Always 1 owner
      [TeamRole.EDITOR]: 0,
      [TeamRole.VIEWER]: 0,
      [TeamRole.COLLABORATOR]: 0,
    };

    let totalMembers = 1; // Owner

    if (project.team) {
      totalMembers += project.team.length;

      for (const member of project.team) {
        const role = member.role as TeamRole;
        if (roleBreakdown[role] !== undefined) {
          roleBreakdown[role]++;
        }
      }
    }

    return {
      totalMembers,
      roleBreakdown,
    };
  } catch (error) {
    console.error('Get team stats error:', error);
    throw error;
  }
}
