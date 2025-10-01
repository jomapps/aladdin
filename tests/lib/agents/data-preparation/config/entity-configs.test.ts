/**
 * Entity Configurations Tests
 * Validates all entity-specific configurations
 */

import { describe, it, expect } from 'vitest'
import type { EntityConfig, RelationshipRule, ValidationRule } from '@/lib/agents/data-preparation/types'

// Mock entity configurations (will be implemented by other agents)
const characterConfig: EntityConfig = {
  type: 'character',
  requiredFields: ['name', 'description'],
  contextSources: ['project', 'payload', 'brain', 'opendb'],
  metadataTemplate: {
    fields: [
      'characterType',
      'role',
      'archetypePattern',
      'visualSignature',
      'personalityTraits',
      'storyFunction',
      'thematicConnection',
      'narrativeArc',
      'emotionalJourney'
    ],
    llmPrompt: `Analyze this character in the context of {{projectName}} ({{genre}}).

Character: {{name}}
Description: {{description}}

Determine:
1. Character type (protagonist, antagonist, supporting, minor)
2. Role in the story
3. Archetype pattern
4. Visual signature
5. Personality traits
6. Story function
7. Thematic connection
8. Narrative arc
9. Emotional journey`
  },
  relationshipRules: [
    { type: 'APPEARS_IN', targetType: 'scene', auto: true },
    { type: 'LIVES_IN', targetType: 'location', auto: false },
    { type: 'RELATES_TO', targetType: 'character', auto: false, bidirectional: true }
  ],
  enrichmentStrategy: 'comprehensive',
  validationRules: [
    {
      field: 'name',
      rule: 'required',
      message: 'Character name is required'
    },
    {
      field: 'name',
      rule: 'minLength',
      value: 2,
      message: 'Character name must be at least 2 characters'
    },
    {
      field: 'description',
      rule: 'required',
      message: 'Character description is required'
    },
    {
      field: 'description',
      rule: 'minLength',
      value: 10,
      message: 'Character description must be at least 10 characters'
    }
  ]
}

const sceneConfig: EntityConfig = {
  type: 'scene',
  requiredFields: ['name', 'content'],
  contextSources: ['project', 'payload', 'brain'],
  metadataTemplate: {
    fields: [
      'sceneType',
      'narrativeFunction',
      'emotionalTone',
      'plotSignificance',
      'characterDevelopment',
      'thematicElements',
      'visualStyle',
      'pacing'
    ],
    llmPrompt: `Analyze this scene for {{projectName}}.

Scene: {{name}}
Content: {{content}}

Provide:
1. Scene type (action, dialogue, exposition, transition)
2. Narrative function
3. Emotional tone
4. Plot significance (low, medium, high)
5. Character development moments
6. Thematic elements
7. Visual style suggestions
8. Pacing (slow, medium, fast)`
  },
  relationshipRules: [
    { type: 'CONTAINS', targetType: 'character', auto: true },
    { type: 'LOCATED_IN', targetType: 'location', auto: true },
    { type: 'FOLLOWS', targetType: 'scene', auto: false },
    { type: 'PRECEDES', targetType: 'scene', auto: false }
  ],
  enrichmentStrategy: 'comprehensive',
  validationRules: [
    {
      field: 'name',
      rule: 'required',
      message: 'Scene name is required'
    },
    {
      field: 'content',
      rule: 'required',
      message: 'Scene content is required'
    },
    {
      field: 'content',
      rule: 'minLength',
      value: 20,
      message: 'Scene content must be at least 20 characters'
    }
  ]
}

const locationConfig: EntityConfig = {
  type: 'location',
  requiredFields: ['name', 'description'],
  contextSources: ['project', 'payload', 'brain'],
  metadataTemplate: {
    fields: [
      'locationType',
      'atmosphere',
      'significance',
      'timeOfDay',
      'weather',
      'soundscape',
      'visualElements'
    ],
    llmPrompt: `Describe this location for {{projectName}}.

Location: {{name}}
Description: {{description}}

Analyze:
1. Location type (interior, exterior, mixed)
2. Atmosphere and mood
3. Significance to story (low, medium, high)
4. Typical time of day
5. Weather conditions
6. Soundscape
7. Key visual elements`
  },
  relationshipRules: [
    { type: 'HOSTS', targetType: 'scene', auto: true },
    { type: 'HOUSES', targetType: 'character', auto: false }
  ],
  enrichmentStrategy: 'standard',
  validationRules: [
    {
      field: 'name',
      rule: 'required',
      message: 'Location name is required'
    },
    {
      field: 'description',
      rule: 'required',
      message: 'Location description is required'
    }
  ]
}

const episodeConfig: EntityConfig = {
  type: 'episode',
  requiredFields: ['title', 'number', 'description'],
  contextSources: ['project', 'payload', 'brain'],
  metadataTemplate: {
    fields: [
      'episodeType',
      'narrativeArc',
      'thematicFocus',
      'characterFocus',
      'plotThreads',
      'cliffhanger',
      'emotionalTone'
    ],
    llmPrompt: `Analyze episode {{number}}: {{title}} for {{projectName}}.

Description: {{description}}

Determine:
1. Episode type (pilot, regular, finale, special)
2. Narrative arc
3. Thematic focus
4. Character focus
5. Plot threads
6. Cliffhanger presence
7. Overall emotional tone`
  },
  relationshipRules: [
    { type: 'INCLUDES', targetType: 'scene', auto: true },
    { type: 'FEATURES', targetType: 'character', auto: true },
    { type: 'FOLLOWS', targetType: 'episode', auto: false }
  ],
  enrichmentStrategy: 'comprehensive',
  validationRules: [
    {
      field: 'title',
      rule: 'required',
      message: 'Episode title is required'
    },
    {
      field: 'number',
      rule: 'required',
      message: 'Episode number is required'
    }
  ]
}

const conceptConfig: EntityConfig = {
  type: 'concept',
  requiredFields: ['name', 'description'],
  contextSources: ['project', 'payload', 'brain'],
  metadataTemplate: {
    fields: [
      'conceptType',
      'thematicSignificance',
      'narrativeRole',
      'symbolism',
      'evolution'
    ],
    llmPrompt: `Analyze this concept for {{projectName}}.

Concept: {{name}}
Description: {{description}}

Explore:
1. Concept type
2. Thematic significance
3. Narrative role
4. Symbolic meaning
5. How it evolves through the story`
  },
  relationshipRules: [
    { type: 'RELATES_TO', targetType: 'character', auto: false },
    { type: 'APPEARS_IN', targetType: 'scene', auto: false },
    { type: 'INFLUENCES', targetType: 'concept', auto: false }
  ],
  enrichmentStrategy: 'standard',
  validationRules: [
    {
      field: 'name',
      rule: 'required',
      message: 'Concept name is required'
    },
    {
      field: 'description',
      rule: 'required',
      message: 'Concept description is required'
    }
  ]
}

describe('Entity Configurations', () => {
  describe('Character Configuration', () => {
    it('should have correct entity type', () => {
      expect(characterConfig.type).toBe('character')
    })

    it('should require name and description', () => {
      expect(characterConfig.requiredFields).toContain('name')
      expect(characterConfig.requiredFields).toContain('description')
    })

    it('should use all context sources', () => {
      expect(characterConfig.contextSources).toContain('project')
      expect(characterConfig.contextSources).toContain('payload')
      expect(characterConfig.contextSources).toContain('brain')
      expect(characterConfig.contextSources).toContain('opendb')
    })

    it('should have comprehensive enrichment strategy', () => {
      expect(characterConfig.enrichmentStrategy).toBe('comprehensive')
    })

    it('should have correct metadata fields', () => {
      const fields = characterConfig.metadataTemplate?.fields || []
      expect(fields).toContain('characterType')
      expect(fields).toContain('role')
      expect(fields).toContain('archetypePattern')
      expect(fields).toContain('narrativeArc')
    })

    it('should have valid relationship rules', () => {
      expect(characterConfig.relationshipRules).toHaveLength(3)

      const appearsIn = characterConfig.relationshipRules.find(r => r.type === 'APPEARS_IN')
      expect(appearsIn).toBeDefined()
      expect(appearsIn?.targetType).toBe('scene')
      expect(appearsIn?.auto).toBe(true)

      const relatesTo = characterConfig.relationshipRules.find(r => r.type === 'RELATES_TO')
      expect(relatesTo?.bidirectional).toBe(true)
    })

    it('should have validation rules', () => {
      expect(characterConfig.validationRules).toBeDefined()
      expect(characterConfig.validationRules?.length).toBeGreaterThan(0)

      const nameRequired = characterConfig.validationRules?.find(
        r => r.field === 'name' && r.rule === 'required'
      )
      expect(nameRequired).toBeDefined()
      expect(nameRequired?.message).toBe('Character name is required')
    })

    it('should have LLM prompt template', () => {
      expect(characterConfig.metadataTemplate?.llmPrompt).toBeDefined()
      expect(characterConfig.metadataTemplate?.llmPrompt).toContain('{{name}}')
      expect(characterConfig.metadataTemplate?.llmPrompt).toContain('{{projectName}}')
    })
  })

  describe('Scene Configuration', () => {
    it('should have correct entity type', () => {
      expect(sceneConfig.type).toBe('scene')
    })

    it('should require name and content', () => {
      expect(sceneConfig.requiredFields).toContain('name')
      expect(sceneConfig.requiredFields).toContain('content')
    })

    it('should have appropriate context sources', () => {
      expect(sceneConfig.contextSources).toContain('project')
      expect(sceneConfig.contextSources).toContain('payload')
      expect(sceneConfig.contextSources).toContain('brain')
    })

    it('should have scene-specific metadata fields', () => {
      const fields = sceneConfig.metadataTemplate?.fields || []
      expect(fields).toContain('sceneType')
      expect(fields).toContain('emotionalTone')
      expect(fields).toContain('plotSignificance')
      expect(fields).toContain('pacing')
    })

    it('should have scene relationship rules', () => {
      const contains = sceneConfig.relationshipRules.find(r => r.type === 'CONTAINS')
      expect(contains?.targetType).toBe('character')

      const locatedIn = sceneConfig.relationshipRules.find(r => r.type === 'LOCATED_IN')
      expect(locatedIn?.targetType).toBe('location')

      const follows = sceneConfig.relationshipRules.find(r => r.type === 'FOLLOWS')
      expect(follows?.targetType).toBe('scene')
    })

    it('should validate content minimum length', () => {
      const contentRule = sceneConfig.validationRules?.find(
        r => r.field === 'content' && r.rule === 'minLength'
      )
      expect(contentRule?.value).toBe(20)
    })
  })

  describe('Location Configuration', () => {
    it('should have correct entity type', () => {
      expect(locationConfig.type).toBe('location')
    })

    it('should use standard enrichment strategy', () => {
      expect(locationConfig.enrichmentStrategy).toBe('standard')
    })

    it('should have location-specific metadata', () => {
      const fields = locationConfig.metadataTemplate?.fields || []
      expect(fields).toContain('locationType')
      expect(fields).toContain('atmosphere')
      expect(fields).toContain('soundscape')
      expect(fields).toContain('visualElements')
    })

    it('should have location relationship rules', () => {
      expect(locationConfig.relationshipRules).toHaveLength(2)

      const hosts = locationConfig.relationshipRules.find(r => r.type === 'HOSTS')
      expect(hosts?.targetType).toBe('scene')
      expect(hosts?.auto).toBe(true)
    })
  })

  describe('Episode Configuration', () => {
    it('should have correct entity type', () => {
      expect(episodeConfig.type).toBe('episode')
    })

    it('should require title, number, and description', () => {
      expect(episodeConfig.requiredFields).toContain('title')
      expect(episodeConfig.requiredFields).toContain('number')
      expect(episodeConfig.requiredFields).toContain('description')
    })

    it('should have episode-specific metadata', () => {
      const fields = episodeConfig.metadataTemplate?.fields || []
      expect(fields).toContain('episodeType')
      expect(fields).toContain('narrativeArc')
      expect(fields).toContain('plotThreads')
      expect(fields).toContain('cliffhanger')
    })

    it('should have episode relationship rules', () => {
      const includes = episodeConfig.relationshipRules.find(r => r.type === 'INCLUDES')
      expect(includes?.targetType).toBe('scene')

      const features = episodeConfig.relationshipRules.find(r => r.type === 'FEATURES')
      expect(features?.targetType).toBe('character')
    })
  })

  describe('Concept Configuration', () => {
    it('should have correct entity type', () => {
      expect(conceptConfig.type).toBe('concept')
    })

    it('should have concept-specific metadata', () => {
      const fields = conceptConfig.metadataTemplate?.fields || []
      expect(fields).toContain('conceptType')
      expect(fields).toContain('thematicSignificance')
      expect(fields).toContain('symbolism')
      expect(fields).toContain('evolution')
    })

    it('should have flexible relationship rules', () => {
      expect(conceptConfig.relationshipRules).toHaveLength(3)
      expect(conceptConfig.relationshipRules.every(r => !r.auto)).toBe(true)
    })
  })

  describe('Configuration Consistency', () => {
    const allConfigs = [
      characterConfig,
      sceneConfig,
      locationConfig,
      episodeConfig,
      conceptConfig
    ]

    it('should all have unique entity types', () => {
      const types = allConfigs.map(c => c.type)
      const uniqueTypes = new Set(types)
      expect(uniqueTypes.size).toBe(allConfigs.length)
    })

    it('should all have at least one required field', () => {
      allConfigs.forEach(config => {
        expect(config.requiredFields.length).toBeGreaterThan(0)
      })
    })

    it('should all have at least one context source', () => {
      allConfigs.forEach(config => {
        expect(config.contextSources.length).toBeGreaterThan(0)
      })
    })

    it('should all have metadata templates', () => {
      allConfigs.forEach(config => {
        expect(config.metadataTemplate).toBeDefined()
        expect(config.metadataTemplate?.fields).toBeDefined()
        expect(config.metadataTemplate?.llmPrompt).toBeDefined()
      })
    })

    it('should all have relationship rules', () => {
      allConfigs.forEach(config => {
        expect(config.relationshipRules).toBeDefined()
        expect(Array.isArray(config.relationshipRules)).toBe(true)
      })
    })

    it('should all have valid enrichment strategies', () => {
      const validStrategies = ['minimal', 'standard', 'comprehensive']

      allConfigs.forEach(config => {
        expect(validStrategies).toContain(config.enrichmentStrategy)
      })
    })

    it('should all have validation rules', () => {
      allConfigs.forEach(config => {
        expect(config.validationRules).toBeDefined()
        expect(config.validationRules?.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Relationship Rules Validation', () => {
    it('should have valid relationship types', () => {
      const validTypes = [
        'APPEARS_IN',
        'LIVES_IN',
        'RELATES_TO',
        'CONTAINS',
        'LOCATED_IN',
        'FOLLOWS',
        'PRECEDES',
        'INCLUDES',
        'FEATURES',
        'HOSTS',
        'HOUSES',
        'INFLUENCES'
      ]

      const allRules = [
        ...characterConfig.relationshipRules,
        ...sceneConfig.relationshipRules,
        ...locationConfig.relationshipRules,
        ...episodeConfig.relationshipRules,
        ...conceptConfig.relationshipRules
      ]

      allRules.forEach(rule => {
        expect(validTypes).toContain(rule.type)
      })
    })

    it('should have valid target types', () => {
      const validTargets = ['character', 'scene', 'location', 'episode', 'concept']

      const allRules = [
        ...characterConfig.relationshipRules,
        ...sceneConfig.relationshipRules,
        ...locationConfig.relationshipRules,
        ...episodeConfig.relationshipRules,
        ...conceptConfig.relationshipRules
      ]

      allRules.forEach(rule => {
        expect(validTargets).toContain(rule.targetType)
      })
    })

    it('should have boolean auto flag', () => {
      const allRules = [
        ...characterConfig.relationshipRules,
        ...sceneConfig.relationshipRules,
        ...locationConfig.relationshipRules
      ]

      allRules.forEach(rule => {
        expect(typeof rule.auto).toBe('boolean')
      })
    })
  })

  describe('Validation Rules Validation', () => {
    it('should have valid rule types', () => {
      const validRules = ['required', 'minLength', 'maxLength', 'pattern', 'custom']

      const allValidationRules = [
        ...(characterConfig.validationRules || []),
        ...(sceneConfig.validationRules || []),
        ...(locationConfig.validationRules || [])
      ]

      allValidationRules.forEach(rule => {
        expect(validRules).toContain(rule.rule)
      })
    })

    it('should have descriptive error messages', () => {
      const allValidationRules = [
        ...(characterConfig.validationRules || []),
        ...(sceneConfig.validationRules || []),
        ...(locationConfig.validationRules || [])
      ]

      allValidationRules.forEach(rule => {
        expect(rule.message).toBeDefined()
        expect(rule.message.length).toBeGreaterThan(0)
        expect(typeof rule.message).toBe('string')
      })
    })
  })

  describe('Prompt Template Validation', () => {
    it('should have variable placeholders', () => {
      const allTemplates = [
        characterConfig.metadataTemplate?.llmPrompt,
        sceneConfig.metadataTemplate?.llmPrompt,
        locationConfig.metadataTemplate?.llmPrompt,
        episodeConfig.metadataTemplate?.llmPrompt,
        conceptConfig.metadataTemplate?.llmPrompt
      ].filter(Boolean) as string[]

      allTemplates.forEach(template => {
        // Should have at least one variable placeholder
        expect(template).toMatch(/{{[a-zA-Z]+}}/)
      })
    })

    it('should reference project context', () => {
      const allTemplates = [
        characterConfig.metadataTemplate?.llmPrompt,
        sceneConfig.metadataTemplate?.llmPrompt,
        locationConfig.metadataTemplate?.llmPrompt
      ].filter(Boolean) as string[]

      allTemplates.forEach(template => {
        expect(template).toContain('{{projectName}}')
      })
    })

    it('should have clear instructions', () => {
      const allTemplates = [
        characterConfig.metadataTemplate?.llmPrompt,
        sceneConfig.metadataTemplate?.llmPrompt
      ].filter(Boolean) as string[]

      allTemplates.forEach(template => {
        // Should have numbered list or clear structure
        expect(template).toMatch(/\d\./);
      })
    })
  })
})
