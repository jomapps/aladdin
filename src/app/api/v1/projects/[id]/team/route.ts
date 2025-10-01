/**
 * Team Management API Route
 * GET /api/v1/projects/[id]/team - List team members
 * POST /api/v1/projects/[id]/team - Add team member
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { hasPermission, Permission, TeamRole } from '@/lib/collaboration/accessControl';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const userId = request.headers.get('x-user-id') || 'system';

    // Check read permission
    const canRead = await hasPermission({
      userId,
      projectId,
      permission: Permission.TEAM_READ,
    });

    if (!canRead) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const payload = await getPayload({ config: configPromise });

    // Get project with team
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 2,
    });

    return NextResponse.json({
      owner: project.createdBy,
      team: project.team || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const { userId: newUserId, role } = body;

    const userId = request.headers.get('x-user-id') || 'system';

    // Check invite permission
    const canInvite = await hasPermission({
      userId,
      projectId,
      permission: Permission.TEAM_INVITE,
    });

    if (!canInvite) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const payload = await getPayload({ config: configPromise });

    // Get project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    });

    // Add team member
    const updatedTeam = [
      ...(project.team || []),
      {
        user: newUserId,
        role: role || TeamRole.COLLABORATOR,
        addedBy: userId,
        addedAt: new Date(),
      },
    ];

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { team: updatedTeam },
    });

    return NextResponse.json({ message: 'Team member added', team: updatedTeam });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
