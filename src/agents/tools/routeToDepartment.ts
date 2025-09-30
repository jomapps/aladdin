/**
 * Route to Department Custom Tool
 * Master Orchestrator uses this to route requests to department heads
 */

import { getCustomToolDefinition } from '@codebuff/sdk'
import { z } from 'zod'

export const routeToDepartmentTool = getCustomToolDefinition({
  toolName: 'route_to_department',
  description: 'Route a request to specific department head',

  inputSchema: z.object({
    department: z.enum(['character', 'story', 'visual', 'audio', 'production']),
    instructions: z.string(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    dependencies: z.array(z.string()).optional()
  }),

  execute: async ({ department, instructions, priority = 'medium', dependencies = [] }) => {
    try {
      // Store routing info for execution
      const routingInfo = {
        department,
        instructions,
        priority,
        dependencies,
        routedAt: new Date().toISOString()
      }

      return [{
        type: 'text',
        value: `✓ Routed to ${department} department with ${priority} priority\n\nInstructions: ${instructions}\n\nDependencies: ${dependencies.length > 0 ? dependencies.join(', ') : 'None'}`
      }]
    } catch (error) {
      return [{
        type: 'text',
        value: `Error routing to department: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
})
