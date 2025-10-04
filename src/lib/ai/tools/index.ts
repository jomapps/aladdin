/**
 * Tool Registry
 * Central registry of all custom tools available to agents
 */

import type { AladdinTool } from '../types'
import { queryBrainTool } from './query-brain'
import { saveToGatherTool } from './save-to-gather'
import { getProjectContextTool } from './get-project-context'

/**
 * Registry of all custom tools
 * Maps tool names to tool definitions
 */
export const toolRegistry: Record<string, AladdinTool> = {
  query_brain: queryBrainTool,
  save_to_gather: saveToGatherTool,
  get_project_context: getProjectContextTool,
}

/**
 * Get tools by names
 * 
 * @param toolNames - Array of tool names to retrieve
 * @returns Array of tool definitions
 */
export function getTools(toolNames: string[]): AladdinTool[] {
  return toolNames.map((name) => toolRegistry[name]).filter(Boolean)
}

/**
 * Get all available tool names
 */
export function getAvailableToolNames(): string[] {
  return Object.keys(toolRegistry)
}

/**
 * Check if a tool exists
 */
export function hasTool(toolName: string): boolean {
  return toolName in toolRegistry
}

