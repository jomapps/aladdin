/**
 * Get Project Context Tool
 * Retrieve project information including story bible, characters, and settings
 */

import { z } from 'zod'
import type { AladdinTool } from '../types'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const getProjectContextTool: AladdinTool = {
  name: 'get_project_context',
  description:
    'Get comprehensive project information including story bible, characters, settings, and episodes. Use this to understand the project context before generating content.',
  parameters: z.object({
    projectId: z.string().optional().describe('Project ID (uses context if not provided)'),
    include: z
      .array(z.enum(['story', 'characters', 'settings', 'episodes', 'departments']))
      .optional()
      .describe('What to include in the context (default: all)'),
  }),
  execute: async (args, context) => {
    const payload = await getPayload({ config })
    const projectId = args.projectId || context.projectId

    // Load project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    const result: any = {
      id: project.id,
      name: project.name,
      slug: project.slug,
      type: project.type,
      logline: project.logline,
      synopsis: project.synopsis,
      genre: project.genre,
      themes: project.themes,
      phase: project.phase,
      status: project.status,
    }

    const includeAll = !args.include || args.include.length === 0
    const shouldInclude = (item: string) => includeAll || args.include?.includes(item as any)

    // Load characters if requested
    if (shouldInclude('characters')) {
      const characters = await payload.find({
        collection: 'characters',
        where: { project: { equals: projectId } },
        limit: 100,
      })
      result.characters = characters.docs.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        description: c.description,
      }))
    }

    // Load episodes if requested
    if (shouldInclude('episodes')) {
      const episodes = await payload.find({
        collection: 'episodes',
        where: { project: { equals: projectId } },
        limit: 100,
        sort: 'episodeNumber',
      })
      result.episodes = episodes.docs.map((e) => ({
        id: e.id,
        episodeNumber: e.episodeNumber,
        title: e.title,
        logline: e.logline,
        status: e.status,
      }))
    }

    // Load departments if requested
    if (shouldInclude('departments')) {
      const departments = await payload.find({
        collection: 'departments',
        where: { isActive: { equals: true } },
        limit: 50,
      })
      result.departments = departments.docs.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        description: d.description,
      }))
    }

    return {
      success: true,
      project: result,
    }
  },
}

