/**
 * Data Ingestion API - Intelligent Data Parsing and Validation
 * Handles user-submitted data with LLM-powered categorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { getBrainClient } from '@/lib/brain/client'
import { getLLMClient } from '@/lib/llm/client'
import { getDataPreparationAgent } from '@/lib/agents/data-preparation/agent'
import { DataIngestionRequestSchema, type DataIngestionResponse } from '../types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    const validationResult = DataIngestionRequestSchema.safeParse(body)

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

    const { data, projectId, entityType, sourceCollection, sourceId, autoConfirm, skipValidation } =
      validationResult.data

    console.log('[Data Ingestion] Processing:', { entityType, projectId })

    // 3. Initialize services
    const llmClient = getLLMClient()
    const brainClient = getBrainClient()
    const dataAgent = getDataPreparationAgent()

    // 4. Parse and categorize data using LLM
    const parsePrompt = `Analyze the following data and extract structured information for entity type: ${entityType}

DATA:
${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}

TASK:
1. Parse the data into a structured format
2. Extract key fields relevant to entity type: ${entityType}
3. Identify any relationships to other entities
4. Generate metadata for better searchability
5. Return valid JSON only

Return format:
{
  "parsed": { /* structured data */ },
  "category": "${entityType}",
  "confidence": 0.95,
  "metadata": { /* additional metadata */ },
  "relationships": [
    {
      "type": "relationship_name",
      "target": "target_id",
      "targetType": "entity_type",
      "confidence": 0.9,
      "reasoning": "why this relationship exists"
    }
  ]
}`

    const llmResult = await llmClient.completeJSON<{
      parsed: any
      category: string
      confidence: number
      metadata: Record<string, any>
      relationships: any[]
    }>(parsePrompt)

    console.log('[Data Ingestion] LLM parsed:', {
      category: llmResult.category,
      confidence: llmResult.confidence,
    })

    // 5. Check for duplicates in Brain service
    const duplicates = await checkDuplicates(
      brainClient,
      llmResult.parsed,
      entityType,
      projectId
    )

    console.log('[Data Ingestion] Found duplicates:', duplicates.length)

    // 6. Prepare data with Data Preparation Agent
    const brainDocument = await dataAgent.prepare(llmResult.parsed, {
      projectId,
      entityType: llmResult.category,
      sourceCollection,
      sourceId,
      userId: user.id,
      createdByType: 'user',
    })

    console.log('[Data Ingestion] Brain document prepared:', brainDocument.id)

    // 7. Validate against entity schema
    let validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[],
    }

    if (!skipValidation) {
      validation = await validateEntityData(
        payload,
        llmResult.parsed,
        llmResult.category,
        brainDocument.metadata
      )
    }

    // 8. Build required fields preview
    const requiredFields = buildRequiredFields(
      llmResult.category,
      llmResult.parsed,
      brainDocument.metadata
    )

    // 9. Determine if confirmation is needed
    const confirmationRequired =
      !autoConfirm ||
      duplicates.length > 0 ||
      !validation.valid ||
      llmResult.confidence < 0.8

    // 10. If auto-confirm and no issues, ingest to brain
    let brainDocumentId: string | undefined
    if (!confirmationRequired) {
      const addedNode = await brainClient.addNode({
        type: brainDocument.type,
        properties: {
          ...brainDocument.metadata,
          text: brainDocument.text,
          project_id: projectId,
        },
      })

      // Add relationships
      for (const rel of brainDocument.relationships) {
        try {
          await brainClient.addRelationship({
            sourceId: addedNode.id,
            targetId: rel.target,
            type: rel.type,
            properties: rel.properties,
          })
        } catch (relError) {
          console.error('[Data Ingestion] Failed to add relationship:', relError)
        }
      }

      brainDocumentId = addedNode.id
      console.log('[Data Ingestion] Auto-confirmed and ingested:', brainDocumentId)
    }

    // 11. Build response
    const response: DataIngestionResponse = {
      status: confirmationRequired
        ? 'pending_confirmation'
        : autoConfirm
          ? 'confirmed'
          : 'pending_confirmation',
      suggestedData: {
        entityType: llmResult.category,
        parsed: llmResult.parsed,
        metadata: brainDocument.metadata,
        relationships: brainDocument.relationships.map((rel) => ({
          type: rel.type,
          target: rel.target,
          targetType: rel.targetType || 'unknown',
          confidence: rel.confidence || 0.8,
          reasoning: rel.reasoning || 'Auto-detected relationship',
          properties: rel.properties,
        })),
      },
      validation,
      duplicates,
      preview: {
        category: llmResult.category,
        confidence: llmResult.confidence,
        requiredFields,
      },
      confirmationRequired,
      brainDocumentId,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Data Ingestion API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'INGESTION_ERROR',
        details: error.stack,
      },
      { status: 500 }
    )
  }
}

/**
 * Check for duplicate entities in Brain service
 */
async function checkDuplicates(
  brainClient: any,
  parsedData: any,
  entityType: string,
  projectId: string
): Promise<any[]> {
  try {
    // Search for similar content
    const searchText = [parsedData.name, parsedData.description, parsedData.content]
      .filter(Boolean)
      .join(' ')

    if (!searchText) return []

    const results = await brainClient.semanticSearch({
      query: searchText,
      types: [entityType],
      projectId,
      limit: 5,
      threshold: 0.85, // High threshold for duplicates
    })

    return results.map((result: any) => ({
      existingId: result.id,
      similarity: result.score,
      existingData: result.metadata,
      suggestion: result.score > 0.95 ? 'skip' : result.score > 0.9 ? 'merge' : 'create_new',
    }))
  } catch (error) {
    console.error('[Data Ingestion] Duplicate check failed:', error)
    return []
  }
}

/**
 * Validate entity data against schema
 */
async function validateEntityData(
  payload: any,
  parsedData: any,
  category: string,
  metadata: any
): Promise<any> {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Basic validation
  if (!parsedData.name && !parsedData.title) {
    errors.push('Name or title is required')
  }

  if (!parsedData.description && !parsedData.content) {
    warnings.push('Description or content is recommended for better searchability')
  }

  // Category-specific validation
  if (category === 'character') {
    if (!metadata.characterType) {
      warnings.push('Character type (protagonist, antagonist, etc.) is recommended')
    }
    if (!metadata.personalityTraits || metadata.personalityTraits.length === 0) {
      suggestions.push('Consider adding personality traits for richer character profiles')
    }
  }

  if (category === 'scene') {
    if (!metadata.sceneType) {
      warnings.push('Scene type is recommended')
    }
    if (!metadata.emotionalTone) {
      suggestions.push('Adding emotional tone helps with scene analysis')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  }
}

/**
 * Build required fields preview
 */
function buildRequiredFields(category: string, parsedData: any, metadata: any): any[] {
  const fields: any[] = []

  // Common fields
  fields.push({
    name: 'name',
    type: 'string',
    description: 'Entity name',
    value: parsedData.name || parsedData.title,
    status: parsedData.name || parsedData.title ? 'complete' : 'incomplete',
  })

  fields.push({
    name: 'description',
    type: 'text',
    description: 'Entity description',
    value: parsedData.description || parsedData.content,
    status: parsedData.description || parsedData.content ? 'complete' : 'incomplete',
  })

  // Category-specific fields
  if (category === 'character') {
    fields.push({
      name: 'characterType',
      type: 'select',
      description: 'Character role type',
      value: metadata.characterType,
      status: metadata.characterType ? 'complete' : 'needs_review',
    })
  }

  return fields
}
