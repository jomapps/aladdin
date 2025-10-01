/**
 * Conversation API Route
 * Create or get existing conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Check if conversation already exists for this project
    const existing = await payload.find({
      collection: 'conversations',
      where: {
        and: [
          {
            project: {
              equals: projectId,
            },
          },
          {
            user: {
              equals: user.id,
            },
          },
          {
            status: {
              equals: 'active',
            },
          },
        ],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      const conversation = existing.docs[0]
      return NextResponse.json({
        conversationId: conversation.id,
        messages: conversation.messages || [],
      })
    }

    // Create new conversation
    const conversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Chat - ${new Date().toISOString()}`,
        project: projectId,
        user: user.id,
        status: 'active',
        messages: [],
      },
    })

    return NextResponse.json({
      conversationId: conversation.id,
      messages: [],
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
