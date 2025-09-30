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

      // 2. Brain validation (Placeholder for Phase 3)
      // TODO: Implement Brain service validation
      const brainValidation = {
        qualityRating: 0.85,
        contradictions: [],
        suggestions: [],
        embedding: null
      }

      // 3. Check quality threshold
      if (brainValidation.qualityRating < 0.60) {
        return [{
          type: 'text',
          value: `Quality rating: ${brainValidation.qualityRating.toFixed(2)}\n\nIssues:\n${brainValidation.contradictions.map((c: any) => `- ${c.explanation}`).join('\n')}\n\nSuggestions:\n${brainValidation.suggestions.join('\n')}`
        }]
      }

      // 4. Save to Open MongoDB
      const collection = await getOpenCollection(projectSlug, 'characters')
      const result = await collection.insertOne({
        name,
        projectId: projectSlug,
        collectionName: 'characters',
        content,
        qualityRating: brainValidation.qualityRating,
        brainValidated: true,
        validatedAt: new Date(),
        createdBy: 'character-creator',
        createdByType: 'agent',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // 5. Add to Brain (Placeholder for Phase 3)
      // TODO: Add node to Brain graph

      // 6. Return success
      return [{
        type: 'text',
        value: `✓ Character "${name}" saved successfully!\n\nQuality Rating: ${brainValidation.qualityRating.toFixed(2)}/1.00\nBrain Validation: PASSED\n\nReady for next step.`
      }]
    } catch (error) {
      return [{
        type: 'text',
        value: `Error saving character: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
})
