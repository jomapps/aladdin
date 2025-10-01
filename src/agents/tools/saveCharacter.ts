/**
 * Save Character Custom Tool
 * Saves character to open MongoDB with Brain validation (placeholder for Phase 3)
 */

import { getCustomToolDefinition } from '@codebuff/sdk'
import { z } from 'zod'
import { getOpenCollection } from '@/lib/db/openDatabase'

export const saveCharacterTool = getCustomToolDefinition({
  toolName: 'save_character',
  description: 'Save a character to the project database and validate with Brain',

  inputSchema: z.object({
    projectSlug: z.string(),
    name: z.string(),
    content: z.object({
      fullName: z.string().optional(),
      role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']).optional(),
      personality: z.object({
        traits: z.array(z.string()).optional(),
        motivations: z.array(z.string()).optional()
      }).optional(),
      backstory: z.string().optional(),
      appearance: z.object({
        description: z.string().optional(),
        hairstyle: z.object({
          style: z.string().optional(),
          length: z.string().optional(),
          color: z.string().optional(),
          texture: z.string().optional()
        }).optional()
      }).optional()
    })
  }),

  execute: async ({ projectSlug, name, content }) => {
    try {
      // 1. Initial quality check
      if (!name || name.trim().length === 0) {
        return [{
          type: 'text',
          value: 'Quality check failed: Character name is required\n\nPlease provide a name.'
        }]
      }

      // 2. Phase 3: Real Brain validation
      const { getContentValidator } = await import('@/lib/brain/validator')
      const validator = getContentValidator()

      const validationResult = await validator.validate({
        content,
        type: 'character',
        projectId: projectSlug,
      })

      // 3. Check quality threshold
      if (!validationResult.valid || validationResult.qualityScore < 0.60) {
        return [{
          type: 'text',
          value: `⚠️  Quality rating: ${validationResult.qualityScore.toFixed(2)}/1.00\n\nValid: ${validationResult.valid}\nCoherence: ${validationResult.coherenceScore.toFixed(2)}\nCreativity: ${validationResult.creativityScore.toFixed(2)}\nCompleteness: ${validationResult.completenessScore.toFixed(2)}\n\nContradictions: ${validationResult.contradictions.length}\n${validationResult.contradictions.map(c => `  - [${c.severity}] ${c.description}`).join('\n')}\n\nSuggestions:\n${validationResult.suggestions.map(s => `  - ${s}`).join('\n')}`
        }]
      }

      // 4. Save to Open MongoDB
      const collection = await getOpenCollection(projectSlug, 'characters')
      const result = await collection.insertOne({
        name,
        projectId: projectSlug,
        collectionName: 'characters',
        content,
        qualityRating: validationResult.qualityScore,
        brainValidated: validationResult.valid,
        validatedAt: new Date(),
        validationResult: {
          coherence: validationResult.coherenceScore,
          creativity: validationResult.creativityScore,
          completeness: validationResult.completenessScore,
          contradictions: validationResult.contradictions.length,
        },
        createdBy: 'character-creator',
        createdByType: 'agent',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      console.log(`✅ Character saved with Brain validation: ${result.insertedId}`)

      // 5. Note: MongoDB change streams will auto-trigger Brain indexing and embedding

      // 6. Return success
      return [{
        type: 'text',
        value: `✅ Character "${name}" saved successfully!\n\nQuality Rating: ${validationResult.qualityScore.toFixed(2)}/1.00\nBrain Validation: ${validationResult.valid ? 'PASSED' : 'WARNING'}\nCoherence: ${validationResult.coherenceScore.toFixed(2)}\nCreativity: ${validationResult.creativityScore.toFixed(2)}\nCompleteness: ${validationResult.completenessScore.toFixed(2)}\n\n${validationResult.suggestions.length > 0 ? `Suggestions:\n${validationResult.suggestions.slice(0, 3).map(s => `  - ${s}`).join('\n')}` : ''}\n\nReady for review.`
      }]
    } catch (error) {
      console.error('Save character error:', error)
      return [{
        type: 'text',
        value: `❌ Error saving character: ${error instanceof Error ? error.message : 'Unknown error'}\n\nNote: Ensure Brain service is configured (BRAIN_API_URL, BRAIN_API_KEY, JINA_API_KEY).`
      }]
    }
  }
})
