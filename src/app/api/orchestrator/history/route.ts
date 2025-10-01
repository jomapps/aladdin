/**
 * Conversation History API
 * Manages conversation storage and retrieval
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET - Retrieve conversation history
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayloadHMR({ config: configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Get parameters
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[History API] GET:', { conversationId, projectId })

    // 3. If conversationId provided, get specific conversation
    if (conversationId) {
      const conversation = await payload.findByID({
        collection: 'conversations',
        id: conversationId,
      })

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      // Check ownership
      if (conversation.user !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden', code: 'FORBIDDEN' },
          { status: 403 }
        )
      }

      return NextResponse.json({
        conversation: {
          id: conversation.id,
          name: conversation.name,
          projectId: conversation.project,
          messages: conversation.messages || [],
          status: conversation.status,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      })
    }

    // 4. Otherwise, list conversations
    const where: any = {
      user: {
        equals: user.id,
      },
    }

    if (projectId) {
      where.project = {
        equals: projectId,
      }
    }

    const conversations = await payload.find({
      collection: 'conversations',
      where,
      limit,
      page: Math.floor(offset / limit) + 1,
      sort: '-updatedAt',
    })

    return NextResponse.json({
      conversations: conversations.docs.map((conv: any) => ({
        id: conv.id,
        name: conv.name,
        projectId: conv.project,
        messageCount: conv.messages?.length || 0,
        lastMessage: conv.messages?.[conv.messages.length - 1],
        status: conv.status,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
      pagination: {
        total: conversations.totalDocs,
        limit,
        offset,
        hasMore: conversations.hasNextPage,
      },
    })
  } catch (error: any) {
    console.error('[History API] GET Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'HISTORY_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Create or update conversation
 */
const SaveMessageSchema = z.object({
  conversationId: z.string().optional(),
  projectId: z.string().optional(),
  name: z.string().optional(),
  message: z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    mode: z.enum(['query', 'data', 'task', 'chat']),
    metadata: z.any().optional(),
  }),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayloadHMR({ config: configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Validate request
    const body = await req.json()
    const validationResult = SaveMessageSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { conversationId, projectId, name, message } = validationResult.data

    console.log('[History API] POST:', { conversationId, projectId })

    // 3. Create or update conversation
    if (conversationId) {
      // Update existing conversation
      const conversation = await payload.findByID({
        collection: 'conversations',
        id: conversationId,
      })

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      if (conversation.user !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden', code: 'FORBIDDEN' },
          { status: 403 }
        )
      }

      await payload.update({
        collection: 'conversations',
        id: conversationId,
        data: {
          messages: {
            // @ts-ignore
            append: [
              {
                ...message,
                createdAt: new Date(),
              },
            ],
          },
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        conversationId,
        success: true,
      })
    } else {
      // Create new conversation
      const newConversation = await payload.create({
        collection: 'conversations',
        data: {
          name: name || `Chat - ${new Date().toISOString()}`,
          project: projectId,
          user: user.id,
          status: 'active',
          messages: [
            {
              ...message,
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        conversationId: newConversation.id,
        success: true,
      })
    }
  } catch (error: any) {
    console.error('[History API] POST Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'SAVE_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete conversation
 */
export async function DELETE(req: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayloadHMR({ config: configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Get conversationId
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID required', code: 'MISSING_ID' },
        { status: 400 }
      )
    }

    console.log('[History API] DELETE:', conversationId)

    // 3. Get conversation
    const conversation = await payload.findByID({
      collection: 'conversations',
      id: conversationId,
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (conversation.user !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 4. Soft delete (set status to archived)
    await payload.update({
      collection: 'conversations',
      id: conversationId,
      data: {
        status: 'archived',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      conversationId,
    })
  } catch (error: any) {
    console.error('[History API] DELETE Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'DELETE_ERROR',
      },
      { status: 500 }
    )
  }
}
