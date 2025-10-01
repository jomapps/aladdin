/**
 * Data Confirmation API
 * Confirms data ingestion after user review
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { getBrainClient } from '@/lib/brain/client'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ConfirmSchema = z.object({
  brainDocument: z.object({
    id: z.string(),
    type: z.string(),
    project_id: z.string(),
    text: z.string(),
    metadata: z.any(),
    relationships: z.array(z.any()),
  }),
  action: z.enum(['confirm', 'reject', 'modify']),
  modifications: z.any().optional(),
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
    const validationResult = ConfirmSchema.safeParse(body)

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

    const { brainDocument, action, modifications } = validationResult.data

    console.log('[Data Confirm] Action:', action, 'Type:', brainDocument.type)

    // 3. Handle based on action
    const brainClient = getBrainClient()

    if (action === 'reject') {
      // Simply return success - no ingestion
      return NextResponse.json({
        success: true,
        action: 'rejected',
        message: 'Data ingestion cancelled',
      })
    }

    // 4. Apply modifications if provided
    let finalDocument = brainDocument
    if (action === 'modify' && modifications) {
      finalDocument = {
        ...brainDocument,
        ...modifications,
        metadata: {
          ...brainDocument.metadata,
          ...modifications.metadata,
          modifiedBy: user.id,
          modifiedAt: new Date().toISOString(),
        },
      }
    }

    // 5. Ingest to Brain service
    const addedNode = await brainClient.addNode({
      type: finalDocument.type,
      properties: {
        ...finalDocument.metadata,
        text: finalDocument.text,
        project_id: finalDocument.project_id,
      },
    })

    console.log('[Data Confirm] Node added:', addedNode.id)

    // 6. Add relationships
    const addedRelationships: string[] = []
    for (const rel of finalDocument.relationships) {
      try {
        await brainClient.addRelationship({
          sourceId: addedNode.id,
          targetId: rel.target,
          type: rel.type,
          properties: rel.properties || {},
        })
        addedRelationships.push(rel.type)
      } catch (relError: any) {
        console.error('[Data Confirm] Failed to add relationship:', relError.message)
        // Continue with other relationships
      }
    }

    console.log('[Data Confirm] Relationships added:', addedRelationships.length)

    // 7. Update source collection if sourceId provided
    if (finalDocument.metadata.sourceCollection && finalDocument.metadata.sourceId) {
      try {
        await payload.update({
          collection: finalDocument.metadata.sourceCollection,
          id: finalDocument.metadata.sourceId,
          data: {
            brainNodeId: addedNode.id,
            ingestedAt: new Date(),
          },
        })
        console.log('[Data Confirm] Source collection updated')
      } catch (updateError) {
        console.error('[Data Confirm] Failed to update source:', updateError)
        // Continue anyway
      }
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      action,
      brainNodeId: addedNode.id,
      relationshipsAdded: addedRelationships.length,
      message: 'Data ingested successfully',
    })
  } catch (error: any) {
    console.error('[Data Confirm API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'CONFIRM_ERROR',
        details: error.stack,
      },
      { status: 500 }
    )
  }
}
