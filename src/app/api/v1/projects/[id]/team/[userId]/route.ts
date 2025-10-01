/**
 * Team Member Management API Route
 * PUT /api/v1/projects/[id]/team/[userId] - Update member role
 * DELETE /api/v1/projects/[id]/team/[userId] - Remove member
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { hasPermission, Permission } from '@/lib/collaboration/accessControl'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const { id: projectId, userId: targetUserId } = await params
    const body = await request.json()
    const { role } = body

    const userId = request.headers.get('x-user-id') || 'system'

    // Check manage permission
    const canManage = await hasPermission({
      userId,
      projectId,
      permission: Permission.TEAM_MANAGE,
    })

    if (!canManage) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const payload = await getPayload({ config: configPromise })

    // Get project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    // Update team member role
    const updatedTeam = (project.team || []).map((member: any) => {
      if ((member.user?.id || member.user) === targetUserId) {
        return { ...member, role }
      }
      return member
    })

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { team: updatedTeam },
    })

    return NextResponse.json({ message: 'Role updated', team: updatedTeam })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const { id: projectId, userId: targetUserId } = await params

    const userId = request.headers.get('x-user-id') || 'system'

    // Check manage permission
    const canManage = await hasPermission({
      userId,
      projectId,
      permission: Permission.TEAM_MANAGE,
    })

    if (!canManage) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const payload = await getPayload({ config: configPromise })

    // Get project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    // Remove team member
    const updatedTeam = (project.team || []).filter(
      (member: any) => (member.user?.id || member.user) !== targetUserId,
    )

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { team: updatedTeam },
    })

    return NextResponse.json({ message: 'Team member removed', team: updatedTeam })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
