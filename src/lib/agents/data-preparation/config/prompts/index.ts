/**
 * Prompt Templates Index
 * Central export for all entity-specific prompt templates
 */

import { characterPrompts } from './character-prompts'
import { scenePrompts } from './scene-prompts'
import { locationPrompts } from './location-prompts'
import { episodePrompts } from './episode-prompts'
import { dialoguePrompts } from './dialogue-prompts'
import { conceptPrompts } from './concept-prompts'
import { PromptTemplate } from './template-utils'

export interface EntityPromptSet {
  analyze: PromptTemplate
  extract: PromptTemplate
  summarize: PromptTemplate
  relationships: PromptTemplate
}

/**
 * All prompt templates organized by entity type and stage
 */
export const promptTemplates: Record<string, EntityPromptSet> = {
  character: characterPrompts,
  scene: scenePrompts,
  location: locationPrompts,
  episode: episodePrompts,
  dialogue: dialoguePrompts,
  concept: conceptPrompts,
}

/**
 * Get prompts for a specific entity type
 */
export function getEntityPrompts(entityType: string): EntityPromptSet | null {
  return promptTemplates[entityType.toLowerCase()] || null
}

/**
 * Get a specific prompt template
 */
export function getPromptTemplate(
  entityType: string,
  stage: 'analyze' | 'extract' | 'summarize' | 'relationships'
): PromptTemplate | null {
  const entityPrompts = getEntityPrompts(entityType)
  return entityPrompts ? entityPrompts[stage] : null
}

/**
 * List all available entity types with prompts
 */
export function getAvailableEntityTypes(): string[] {
  return Object.keys(promptTemplates)
}

/**
 * Validate that prompts exist for an entity type
 */
export function hasPrompts(entityType: string): boolean {
  return entityType.toLowerCase() in promptTemplates
}

// Re-export utilities
export * from './template-utils'
export { characterPrompts } from './character-prompts'
export { scenePrompts } from './scene-prompts'
export { locationPrompts } from './location-prompts'
export { episodePrompts } from './episode-prompts'
export { dialoguePrompts } from './dialogue-prompts'
export { conceptPrompts } from './concept-prompts'
