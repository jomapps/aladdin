/**
 * Gather API - Single Item Operations
 * GET /api/v1/gather/[projectId]/[id] - Get single gather item
 * PUT /api/v1/gather/[projectId]/[id] - Update gather item
 * DELETE /api/v1/gather/[projectId]/[id] - Delete gather item
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { gatherDB } from '@/lib/db/gatherDatabase'
import { getGatherAIProcessor } from '@/lib/gather/aiProcessor'
import { getBrainClient } from '@/lib/brain/client'
import { authenticateRequest } from '@/lib/auth/devAuth'

/**
 * GET /api/v1/gather/[projectId]/[id]
 * Get single gather item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; id: string }> },
) {
  try {
    const { projectId, id } = await params

    // Validate project exists
    const payload = await getPayload({ config: await config })
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch gather item
    const item = await gatherDB.getGatherItem(projectId, id)

    if (!item) {
      return NextResponse.json({ error: 'Gather item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('[Gather API] GET single error:', error)
    return NextResponse.json({ error: 'Failed to fetch gather item' }, { status: 500 })
  }
}

/**
 * PUT /api/v1/gather/[projectId]/[id]
 * Update gather item (triggers full re-validation)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; id: string }> },
) {
  try {
    const { projectId, id } = await params
    const body = await request.json()
    const { content, imageUrl, documentUrl } = body

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

    // Check if item exists
    const existingItem = await gatherDB.getGatherItem(projectId, id)
    if (!existingItem) {
      return NextResponse.json({ error: 'Gather item not found' }, { status: 404 })
    }

    // Re-process content with AI (full pipeline)
    const aiProcessor = getGatherAIProcessor()
    const processingResult = await aiProcessor.processContent({
      content: content || JSON.parse(existingItem.content),
      imageUrl: imageUrl !== undefined ? imageUrl : existingItem.imageUrl,
      documentUrl: documentUrl !== undefined ? documentUrl : existingItem.documentUrl,
      projectId,
      existingItemId: id,
    })

    // Update gather item
    const updatedItem = await gatherDB.updateGatherItem(projectId, id, {
      content: JSON.stringify(processingResult.enrichedContent),
      imageUrl: imageUrl !== undefined ? imageUrl : existingItem.imageUrl,
      documentUrl: documentUrl !== undefined ? documentUrl : existingItem.documentUrl,
      summary: processingResult.summary,
      context: processingResult.context,
      extractedText: processingResult.extractedText,
      iterationCount: processingResult.iterationCount,
      duplicateCheckScore: processingResult.duplicates[0]?.similarity,
    })

    return NextResponse.json({
      success: true,
      item: updatedItem,
      duplicates: processingResult.duplicates,
    })
  } catch (error) {
    console.error('[Gather API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update gather item' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/gather/[projectId]/[id]
 * Delete gather item (hard delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; id: string }> },
) {
  try {
    const { projectId, id } = await params

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

    // Delete gather item
    const deleted = await gatherDB.deleteGatherItem(projectId, id)

    if (!deleted) {
      return NextResponse.json({ error: 'Gather item not found' }, { status: 404 })
    }

    // Delete from Brain service
    try {
      const brainClient = getBrainClient()
      await brainClient.deleteNode({
        nodeId: id,
        cascade: false, // Don't delete relationships
      })
      console.log('[Gather API] Deleted from Brain service:', id)
    } catch (brainError) {
      // Log error but don't fail the request
      console.error('[Gather API] Failed to delete from Brain service:', brainError)
    }

    return NextResponse.json({
      success: true,
      deleted: true,
    })
  } catch (error) {
    console.error('[Gather API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete gather item' }, { status: 500 })
  }
}
