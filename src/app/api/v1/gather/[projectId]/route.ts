/**
 * Gather API - CRUD Operations
 * GET /api/v1/gather/[projectId] - List gather items with pagination
 * POST /api/v1/gather/[projectId] - Create new gather item
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { gatherDB } from '@/lib/db/gatherDatabase'
import { getGatherAIProcessor } from '@/lib/gather/aiProcessor'

/**
 * GET /api/v1/gather/[projectId]
 * List gather items with pagination and filters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(request.url)

    // Validate project exists
    const payload = await getPayload({ config: await config })
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 20) // Max 20 per page
    const search = searchParams.get('search') || undefined
    const sort = (searchParams.get('sort') || 'latest') as 'latest' | 'oldest' | 'a-z' | 'z-a'
    const hasImage = searchParams.get('hasImage') === 'true' ? true : searchParams.get('hasImage') === 'false' ? false : undefined
    const hasDocument = searchParams.get('hasDocument') === 'true' ? true : searchParams.get('hasDocument') === 'false' ? false : undefined

    // Fetch gather items
    const result = await gatherDB.getGatherItems(projectId, {
      page,
      limit,
      search,
      sort,
      hasImage,
      hasDocument,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Gather API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gather items' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/gather/[projectId]
 * Create new gather item with AI processing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { content, imageUrl, documentUrl } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Validate project exists
    const payload = await getPayload({ config: await config })
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get authenticated user
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process content with AI
    const aiProcessor = getGatherAIProcessor()
    const processingResult = await aiProcessor.processContent({
      content,
      imageUrl,
      documentUrl,
      projectId,
    })

    // Create gather item
    const gatherItem = await gatherDB.createGatherItem(projectId, {
      content: JSON.stringify(processingResult.enrichedContent),
      imageUrl,
      documentUrl,
      summary: processingResult.summary,
      context: processingResult.context,
      extractedText: processingResult.extractedText,
      iterationCount: processingResult.iterationCount,
      duplicateCheckScore: processingResult.duplicates[0]?.similarity,
      createdBy: user.id,
    })

    return NextResponse.json({
      success: true,
      item: gatherItem,
      duplicates: processingResult.duplicates,
    })
  } catch (error) {
    console.error('[Gather API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create gather item' },
      { status: 500 }
    )
  }
}

