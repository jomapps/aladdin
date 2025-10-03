/**
 * Data Mode Handler
 * Handles data ingestion into Gather with AI enrichment
 */

import { getLLMClient } from '@/lib/llm/client'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { MongoClient, ObjectId } from 'mongodb'

export interface DataHandlerOptions {
  content: string | object
  projectId: string
  conversationId?: string
  userId: string
  imageUrl?: string
  documentUrl?: string
}

export interface DataHandlerResult {
  conversationId: string
  gatherItemId: string
  message: string
  summary: string
  context: string
  duplicates: Array<{
    id: string
    similarity: number
    suggestion: 'skip' | 'merge' | 'review'
  }>
}

/**
 * Get Gather MongoDB connection
 */
async function getGatherDatabase(projectId: string) {
  const mongoUrl = process.env.DATABASE_URI
  if (!mongoUrl) {
    throw new Error('DATABASE_URI not configured')
  }

  const client = await MongoClient.connect(mongoUrl)
  const dbName = `aladdin-gather-${projectId}`
  return client.db(dbName)
}

/**
 * Check for duplicates using Brain semantic search
 */
async function checkDuplicates(
  content: any,
  summary: string,
  projectId: string,
  userId: string,
): Promise<Array<{ id: string; similarity: number; suggestion: 'skip' | 'merge' | 'review' }>> {
  try {
    const { getBrainClient } = await import('@/lib/brain/client')
    const brainClient = getBrainClient()

    // Use userId-projectId for conversation context
    const brainProjectId = `${userId}-${projectId}`
    console.log('[DataHandler] Checking duplicates for:', summary, 'project_id:', brainProjectId)

    // Search for similar content using the summary
    const results = await brainClient.searchSimilar({
      query: summary,
      projectId: brainProjectId, // Use userId-projectId for conversation context
      limit: 5,
      threshold: 0.7, // 70% similarity threshold for duplicates
    })

    // Transform results to duplicate format with suggestions
    return results.map((result) => {
      const similarity = result.similarity

      // Determine suggestion based on similarity
      let suggestion: 'skip' | 'merge' | 'review'
      if (similarity > 0.95) {
        suggestion = 'skip' // Very high similarity - likely duplicate
      } else if (similarity > 0.85) {
        suggestion = 'merge' // High similarity - consider merging
      } else {
        suggestion = 'review' // Moderate similarity - manual review
      }

      return {
        id: result.id,
        similarity,
        suggestion,
      }
    })
  } catch (error: any) {
    console.error('[DataHandler] Duplicate check failed:', error.message)
    // Return empty array on error - don't fail the entire ingestion
    return []
  }
}

/**
 * Enrich content with AI (max 3 iterations)
 */
async function enrichContent(
  content: any,
  projectId: string,
  maxIterations: number = 3,
): Promise<{ enrichedContent: any; iterationCount: number }> {
  const llmClient = getLLMClient()
  let currentContent = content
  let iterationCount = 0

  for (let i = 0; i < maxIterations; i++) {
    iterationCount++

    const contentStr =
      typeof currentContent === 'string' ? currentContent : JSON.stringify(currentContent)

    const prompt = `Analyze this content and determine if it needs enrichment:

Content:
${contentStr}

If this content is complete and well-structured, respond with:
{ "isComplete": true, "content": <original content> }

If it needs enrichment, respond with:
{ "isComplete": false, "content": <enriched content with additional details> }

Your response must be valid JSON.`

    const response = await llmClient.completeJSON<{
      isComplete: boolean
      content: any
    }>(prompt, {
      temperature: 0.4,
      maxTokens: 1500,
    })

    currentContent = response.content

    if (response.isComplete) {
      break
    }
  }

  return {
    enrichedContent: currentContent,
    iterationCount,
  }
}

/**
 * Generate summary (100 chars, not editable)
 */
async function generateSummary(content: any): Promise<string> {
  const llmClient = getLLMClient()

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content)

  const prompt = `Generate a concise summary (~100 characters) of this content:

${contentStr}

Return ONLY the summary text, no explanations.`

  const summary = await llmClient.complete(prompt, {
    temperature: 0.3,
    maxTokens: 50,
  })

  return summary.trim().substring(0, 150) // Cap at 150 chars
}

/**
 * Generate context paragraph
 */
async function generateContext(content: any, projectId: string): Promise<string> {
  const llmClient = getLLMClient()

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content)

  // TODO: Get project context from Brain
  const projectContext = 'Movie production project'

  const prompt = `Generate a detailed context paragraph explaining this content in relation to the project:

Project: ${projectContext}
Content: ${contentStr}

Provide a comprehensive paragraph (2-3 sentences) explaining the relevance and relationships.`

  const context = await llmClient.complete(prompt, {
    temperature: 0.4,
    maxTokens: 300,
  })

  return context.trim()
}

/**
 * Handle data ingestion
 */
export async function handleData(options: DataHandlerOptions): Promise<DataHandlerResult> {
  const { content, projectId, conversationId, userId, imageUrl, documentUrl } = options

  const payload = await getPayload({ config: await configPromise })

  // 1. Create or load conversation
  let actualConversationId = conversationId

  if (!actualConversationId) {
    const newConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Data - ${new Date().toISOString()}`,
        project: projectId,
        user: userId,
        status: 'active',
        messages: [],
        createdAt: new Date(),
      },
    })
    actualConversationId = newConversation.id.toString()
  }

  // 2. Enrich content
  console.log('[DataHandler] Enriching content...')
  const { enrichedContent, iterationCount } = await enrichContent(content, projectId)

  // 3. Generate summary
  console.log('[DataHandler] Generating summary...')
  const summary = await generateSummary(enrichedContent)

  // 4. Generate context
  console.log('[DataHandler] Generating context...')
  const context = await generateContext(enrichedContent, projectId)

  // 5. Check duplicates
  console.log('[DataHandler] Checking duplicates...')
  const duplicates = await checkDuplicates(enrichedContent, summary, projectId, userId)

  // 6. Save to Gather MongoDB
  const gatherDb = await getGatherDatabase(projectId)
  const gatherCollection = gatherDb.collection('gather')

  const gatherItem = {
    projectId,
    lastUpdated: new Date(),
    content: JSON.stringify(enrichedContent),
    imageUrl,
    documentUrl,
    summary,
    context,
    extractedText: null, // TODO: Extract from images/PDFs
    duplicateCheckScore: duplicates.length > 0 ? duplicates[0].similarity : null,
    iterationCount,
    createdAt: new Date(),
    createdBy: userId,
  }

  const insertResult = await gatherCollection.insertOne(gatherItem)
  const gatherItemId = insertResult.insertedId.toString()

  console.log('[DataHandler] Saved to Gather:', gatherItemId)

  // 7. Format response message
  const message =
    duplicates.length > 0
      ? `Data ingested with ${duplicates.length} potential duplicates found. Review recommended.`
      : `Data successfully ingested and enriched (${iterationCount} iterations).`

  // 8. Save to conversation
  try {
    await payload.update({
      collection: 'conversations',
      id: actualConversationId,
      data: {
        messages: [
          {
            id: `msg-${Date.now()}-user`,
            role: 'user',
            content: typeof content === 'string' ? content : JSON.stringify(content),
            timestamp: new Date(),
          },
          {
            id: `msg-${Date.now()}-assistant`,
            role: 'assistant',
            content: message,
            timestamp: new Date(),
          },
        ],
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } catch (saveError) {
    console.error('[DataHandler] Failed to save conversation:', saveError)
  }

  // 9. Return result
  return {
    conversationId: actualConversationId,
    gatherItemId,
    message,
    summary,
    context,
    duplicates,
  }
}
