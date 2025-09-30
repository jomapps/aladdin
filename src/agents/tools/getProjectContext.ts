/**
 * Get Project Context Custom Tool
 * Retrieve project context from PayloadCMS
 */

import { getCustomToolDefinition } from '@codebuff/sdk'
import { z } from 'zod'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

export const getProjectContextTool = getCustomToolDefinition({
  toolName: 'get_project_context',
  description: 'Get project metadata and context from PayloadCMS',

  inputSchema: z.object({
    projectSlug: z.string()
  }),

  execute: async ({ projectSlug }) => {
    try {
      const payload = await getPayloadHMR({ config: configPromise })

      // Find project by slug
      const projects = await payload.find({
        collection: 'projects',
        where: {
          slug: {
            equals: projectSlug
          }
        },
        limit: 1
      })

      if (!projects.docs || projects.docs.length === 0) {
        return [{
          type: 'text',
          value: `Project not found: ${projectSlug}`
        }]
      }

      const project = projects.docs[0]

      const context = {
        name: project.name,
        slug: project.slug,
        type: project.type || 'movie',
        genre: project.genre || [],
        logline: project.logline || '',
        synopsis: project.synopsis || '',
        targetAudience: project.targetAudience || '',
        themes: project.themes || [],
        tone: project.tone || '',
        phase: project.phase || 'expansion',
        settings: project.settings || {}
      }

      return [{
        type: 'text',
        value: `Project Context:\n\n${JSON.stringify(context, null, 2)}`
      }]
    } catch (error) {
      return [{
        type: 'text',
        value: `Error fetching project context: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
})
