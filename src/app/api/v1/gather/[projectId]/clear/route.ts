/**
 * Clear Gather API
 * DELETE /api/v1/gather/[projectId]/clear
 * Deletes all gather items from MongoDB and Brain service for a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { gatherDB } from '@/lib/db/gatherDatabase'
import { getBrainClient } from '@/lib/brain/client'
import { MongoClient } from 'mongodb'
import { authenticateRequest } from '@/lib/auth/devAuth'

/**
 * DELETE /api/v1/gather/[projectId]/clear
 * Clear all gather data for a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params

    console.log('[Gather Clear] Starting clear operation for project:', projectId)

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

    let gatherDeletedCount = 0
    let brainDeletedCount = 0
    const errors: string[] = []

    // 1. Get all gather items to get their IDs for brain deletion
    console.log('[Gather Clear] Fetching all gather items...')
    const gatherItems = await gatherDB.getGatherItems(projectId, {
      limit: 1000, // Get all items (adjust if you have more than 1000)
      sort: 'latest',
    })

    console.log(`[Gather Clear] Found ${gatherItems.items.length} gather items`)

    // 2. Delete from Brain service first (so we have the IDs)
    console.log('[Gather Clear] Deleting from Brain service...')
    const brainClient = getBrainClient()

    for (const item of gatherItems.items) {
      try {
        const nodeId = item._id?.toString()
        if (nodeId) {
          // Try to delete from brain - it might not exist, which is okay
          try {
            await brainClient.deleteNode({
              nodeId,
              projectId,
              cascade: false,
            })
            brainDeletedCount++
            console.log(`[Gather Clear] Deleted from brain: ${nodeId}`)
          } catch (brainError: any) {
            // 404 is okay - node might not exist in brain
            if (brainError.message?.includes('404')) {
              console.log(`[Gather Clear] Node not found in brain (okay): ${nodeId}`)
            } else {
              console.error(`[Gather Clear] Failed to delete from brain: ${nodeId}`, brainError)
              errors.push(`Brain delete failed for ${nodeId}: ${brainError.message}`)
            }
          }
        }
      } catch (error) {
        console.error('[Gather Clear] Error processing item:', error)
        errors.push(
          `Failed to process item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }

    // 3. Delete all gather items from MongoDB
    console.log('[Gather Clear] Deleting from MongoDB gather database...')
    try {
      // Connect to MongoDB and drop the entire gather collection for this project
      const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URI_OPEN || ''
      const client = new MongoClient(mongoUri)

      try {
        await client.connect()
        const gatherDb = client.db(`aladdin-gather-${projectId}`)

        // Drop the gather collection
        const collections = await gatherDb.listCollections({ name: 'gather' }).toArray()
        if (collections.length > 0) {
          await gatherDb.collection('gather').drop()
          gatherDeletedCount = gatherItems.items.length
          console.log(`[Gather Clear] Dropped gather collection for project: ${projectId}`)
        } else {
          console.log(`[Gather Clear] No gather collection found for project: ${projectId}`)
        }
      } finally {
        await client.close()
      }
    } catch (mongoError) {
      console.error('[Gather Clear] MongoDB deletion failed:', mongoError)
      errors.push(
        `MongoDB deletion failed: ${mongoError instanceof Error ? mongoError.message : 'Unknown error'}`,
      )
    }

    // 4. Return results
    const response = {
      success: errors.length === 0,
      message:
        errors.length === 0
          ? 'Successfully cleared all gather data'
          : 'Cleared gather data with some errors',
      deleted: {
        gather: gatherDeletedCount,
        brain: brainDeletedCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log('[Gather Clear] Operation complete:', response)

    return NextResponse.json(response, {
      status: errors.length === 0 ? 200 : 207, // 207 = Multi-Status (partial success)
    })
  } catch (error) {
    console.error('[Gather Clear] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Failed to clear gather data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
