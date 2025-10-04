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
import { getBrainClient } from '@/lib/brain/client'
import { authenticateRequest } from '@/lib/auth/devAuth'

/**
 * GET /api/v1/gather/[projectId]
 * List gather items with pagination and filters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
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
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 20) // Max 20 per page
    const search = searchParams.get('search') || undefined
    const sort = (searchParams.get('sort') || 'latest') as 'latest' | 'oldest' | 'a-z' | 'z-a'
    const hasImage =
      searchParams.get('hasImage') === 'true'
        ? true
        : searchParams.get('hasImage') === 'false'
          ? false
          : undefined
    const hasDocument =
      searchParams.get('hasDocument') === 'true'
        ? true
        : searchParams.get('hasDocument') === 'false'
          ? false
          : undefined

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
    return NextResponse.json({ error: 'Failed to fetch gather items' }, { status: 500 })
  }
}

/**
 * POST /api/v1/gather/[projectId]
 * Create new gather item with AI processing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { content, imageUrl, documentUrl } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Validate project exists
    const payload = await getPayload({ config: await config })
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Authenticate user (auto-login in development mode)
    const { userId } = await authenticateRequest(request, payload)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Process content with AI
    const aiProcessor = getGatherAIProcessor()
    const processingResult = await aiProcessor.processContent({
      content,
      imageUrl,
      documentUrl,
      projectId,
    })

    // Ensure all required fields are valid strings
    // Convert enrichedContent to string if it's not already
    const contentString =
      typeof processingResult.enrichedContent === 'string'
        ? processingResult.enrichedContent
        : JSON.stringify(processingResult.enrichedContent)

    const gatherData = {
      projectId, // Explicitly add projectId
      content: contentString,
      imageUrl,
      documentUrl,
      summary: processingResult.summary || 'Content summary',
      context: processingResult.context || 'Context unavailable',
      extractedText: processingResult.extractedText,
      iterationCount: processingResult.iterationCount,
      duplicateCheckScore: processingResult.duplicates[0]?.similarity,
      createdBy: String(userId), // Ensure string
    }

    console.log('[Gather API] Creating item with data:', {
      hasSummary: !!gatherData.summary,
      hasContext: !!gatherData.context,
      summaryType: typeof gatherData.summary,
      contextType: typeof gatherData.context,
      hasContent: !!gatherData.content,
      contentType: typeof gatherData.content,
      hasCreatedBy: !!gatherData.createdBy,
      createdByType: typeof gatherData.createdBy,
      allFields: Object.keys(gatherData),
    })

    // Create gather item
    let gatherItem
    try {
      gatherItem = await gatherDB.createGatherItem(projectId, gatherData)
    } catch (dbError: any) {
      console.error('[Gather API] MongoDB validation error details:', {
        error: dbError.message,
        code: dbError.code,
        errInfo: dbError.errInfo,
        gatherData,
      })
      throw dbError
    }

    // Store in Brain service for semantic search
    let brainSaveSuccess = false
    let brainError: string | undefined

    try {
      const brainClient = getBrainClient()

      // Prepare content for Brain service - use summary + context for better semantic search
      const brainContent = `${processingResult.summary}\n\n${processingResult.context}\n\n${contentString}`

      await brainClient.addNode({
        type: 'gather',
        content: brainContent, // REQUIRED: Content to embed for semantic search
        projectId, // REQUIRED: Project isolation
        properties: {
          // Additional metadata (not used for embedding)
          id: gatherItem._id?.toString(),
          summary: processingResult.summary,
          context: processingResult.context,
          extractedText: processingResult.extractedText,
          imageUrl,
          documentUrl,
          createdAt: new Date().toISOString(),
          createdBy: userId,
        },
      })
      brainSaveSuccess = true
      console.log('[Gather API] ✅ Stored in Brain service:', gatherItem._id)
    } catch (error: any) {
      // Log detailed error but don't fail the request
      brainError = error.message || 'Unknown error'
      console.error('[Gather API] ❌ Failed to store in Brain service:', {
        error: brainError,
        itemId: gatherItem._id,
        projectId,
      })
    }

    return NextResponse.json({
      success: true,
      item: gatherItem,
      duplicates: processingResult.duplicates,
      brain: {
        saved: brainSaveSuccess,
        error: brainError,
      },
    })
  } catch (error) {
    console.error('[Gather API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create gather item' }, { status: 500 })
  }
}
