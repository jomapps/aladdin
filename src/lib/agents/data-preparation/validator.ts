/**
 * Brain Document Validator - Validates documents before storage
 * Now supports entity-specific validation rules from ConfigManager
 */

import type { ConfigManager } from './config'
import type { AgentConfig, BrainDocument, ValidationResult } from './types'

export class BrainDocumentValidator {
  private config: AgentConfig
  private configManager: ConfigManager | null

  constructor(config: AgentConfig, configManager?: ConfigManager) {
    this.config = config
    this.configManager = configManager || null
  }

  /**
   * Validate brain document with entity-specific rules
   */
  async validate(document: BrainDocument): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic required fields validation
    if (!document.id) errors.push('Document ID is required')
    if (!document.type) errors.push('Document type is required')
    if (!document.project_id) errors.push('Project ID is required')
    if (!document.text) errors.push('Document text is required')

    // Apply entity-specific validation rules if available
    const hasEntityConfig = this.configManager?.hasEntityConfig(document.type)
    if (hasEntityConfig && this.configManager) {
      console.log(`[Validator] Applying entity-specific validation for ${document.type}`)
      const entityValidation = this.configManager.validateEntityData(document.type, {
        ...document,
        ...document.metadata,
      })

      errors.push(...entityValidation.errors)
      warnings.push(...entityValidation.warnings)

      // Apply quality thresholds if configured
      const entityConfig = this.configManager.getEntityConfig(document.type)
      if (entityConfig?.enrichmentStrategy.qualityThresholds) {
        const thresholds = entityConfig.enrichmentStrategy.qualityThresholds

        // Check metadata completeness
        if (thresholds.minMetadataCompleteness) {
          const metadataFields = entityConfig.metadataFields
          const requiredFields = metadataFields.filter(f => f.required)
          const presentFields = requiredFields.filter(f => document.metadata[f.name])
          const completeness = requiredFields.length > 0
            ? presentFields.length / requiredFields.length
            : 1

          if (completeness < thresholds.minMetadataCompleteness) {
            const message = `Metadata completeness ${(completeness * 100).toFixed(1)}% is below threshold ${(thresholds.minMetadataCompleteness * 100)}%`
            if (thresholds.blockLowQuality) {
              errors.push(message)
            } else {
              warnings.push(message)
            }
          }
        }

        // Check relationship confidence
        if (thresholds.minRelationshipConfidence && document.relationships) {
          const lowConfidenceRels = document.relationships.filter(
            r => r.confidence && r.confidence < thresholds.minRelationshipConfidence!
          )
          if (lowConfidenceRels.length > 0) {
            warnings.push(
              `${lowConfidenceRels.length} relationships have confidence below ${thresholds.minRelationshipConfidence}`
            )
          }
        }
      }
    } else {
      // Fallback to default validation
      console.log(`[Validator] Using default validation for ${document.type}`)

      // Text length validation
      if (document.text && document.text.length < 10) {
        warnings.push('Document text is very short (< 10 characters)')
      }
      if (document.text && document.text.length > 10000) {
        warnings.push('Document text is very long (> 10000 characters)')
      }

      // Metadata validation
      if (!document.metadata || Object.keys(document.metadata).length === 0) {
        warnings.push('Document has no metadata')
      }

      // Relationships validation
      if (!document.relationships || document.relationships.length === 0) {
        warnings.push('Document has no relationships')
      }
    }

    // Validate relationships structure (always apply)
    if (document.relationships) {
      for (const rel of document.relationships) {
        if (!rel.type) errors.push('Relationship missing type')
        if (!rel.target) errors.push('Relationship missing target')

        // Validate relationship type is allowed for this entity
        if (hasEntityConfig && this.configManager) {
          const allowedTypes = this.configManager.getRelationshipTypes(document.type).map(r => r.type)
          if (allowedTypes.length > 0 && !allowedTypes.includes(rel.type)) {
            warnings.push(`Relationship type '${rel.type}' is not configured for ${document.type}`)
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

