/**
 * Brain Document Validator - Validates documents before storage
 */

import type { AgentConfig, BrainDocument, ValidationResult } from './types'

export class BrainDocumentValidator {
  private config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
  }

  /**
   * Validate brain document
   */
  async validate(document: BrainDocument): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!document.id) errors.push('Document ID is required')
    if (!document.type) errors.push('Document type is required')
    if (!document.project_id) errors.push('Project ID is required')
    if (!document.text) errors.push('Document text is required')

    // Text length
    if (document.text && document.text.length < 10) {
      warnings.push('Document text is very short (< 10 characters)')
    }
    if (document.text && document.text.length > 10000) {
      warnings.push('Document text is very long (> 10000 characters)')
    }

    // Metadata
    if (!document.metadata || Object.keys(document.metadata).length === 0) {
      warnings.push('Document has no metadata')
    }

    // Relationships
    if (!document.relationships || document.relationships.length === 0) {
      warnings.push('Document has no relationships')
    }

    // Validate relationships
    if (document.relationships) {
      for (const rel of document.relationships) {
        if (!rel.type) errors.push('Relationship missing type')
        if (!rel.target) errors.push('Relationship missing target')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

