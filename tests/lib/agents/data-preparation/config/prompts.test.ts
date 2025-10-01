/**
 * Prompt Template Tests
 * Tests for prompt template substitution and validation
 */

import { describe, it, expect } from 'vitest'

describe('Prompt Templates', () => {
  describe('Variable Substitution', () => {
    it('should replace single variable', () => {
      const template = 'Hello {{name}}!'
      const variables = { name: 'John' }

      const result = substituteVariables(template, variables)

      expect(result).toBe('Hello John!')
    })

    it('should replace multiple variables', () => {
      const template = 'Character {{name}} in {{project}} ({{genre}})'
      const variables = {
        name: 'John Doe',
        project: 'Test Movie',
        genre: 'Action'
      }

      const result = substituteVariables(template, variables)

      expect(result).toBe('Character John Doe in Test Movie (Action)')
    })

    it('should replace same variable multiple times', () => {
      const template = '{{name}} says hello. {{name}} is happy.'
      const variables = { name: 'Alice' }

      const result = substituteVariables(template, variables)

      expect(result).toBe('Alice says hello. Alice is happy.')
    })

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, from {{location}}'
      const variables = { name: 'John' }

      const result = substituteVariables(template, variables)

      // Should keep unreplaced variables
      expect(result).toContain('Hello John')
      expect(result).toContain('{{location}}')
    })

    it('should handle empty variables object', () => {
      const template = 'Hello {{name}}!'
      const variables = {}

      const result = substituteVariables(template, variables)

      expect(result).toBe('Hello {{name}}!')
    })

    it('should handle null and undefined values', () => {
      const template = '{{a}} {{b}} {{c}}'
      const variables = { a: null, b: undefined, c: 'value' }

      const result = substituteVariables(template, variables)

      expect(result).toContain('null')
      expect(result).toContain('undefined')
      expect(result).toContain('value')
    })

    it('should handle numeric values', () => {
      const template = 'Episode {{number}}: {{title}}'
      const variables = { number: 5, title: 'The Beginning' }

      const result = substituteVariables(template, variables)

      expect(result).toBe('Episode 5: The Beginning')
    })

    it('should handle boolean values', () => {
      const template = 'Has cliffhanger: {{cliffhanger}}'
      const variables = { cliffhanger: true }

      const result = substituteVariables(template, variables)

      expect(result).toBe('Has cliffhanger: true')
    })

    it('should handle array values', () => {
      const template = 'Genres: {{genres}}'
      const variables = { genres: ['Action', 'Thriller', 'Drama'] }

      const result = substituteVariables(template, variables)

      expect(result).toContain('Action,Thriller,Drama')
    })

    it('should handle special characters', () => {
      const template = 'Quote: "{{quote}}"'
      const variables = { quote: 'Hello "world"!' }

      const result = substituteVariables(template, variables)

      expect(result).toBe('Quote: "Hello "world"!"')
    })
  })

  describe('Character Prompt Templates', () => {
    const template = `Analyze this character in the context of {{projectName}} ({{genre}}).

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

    it('should generate complete character analysis prompt', () => {
      const variables = {
        projectName: 'Dark Knight',
        genre: 'Action, Crime',
        name: 'Bruce Wayne',
        description: 'Billionaire vigilante fighting crime in Gotham'
      }

      const result = substituteVariables(template, variables)

      expect(result).toContain('Dark Knight')
      expect(result).toContain('Action, Crime')
      expect(result).toContain('Bruce Wayne')
      expect(result).toContain('Billionaire vigilante')
      expect(result).not.toContain('{{')
    })

    it('should maintain prompt structure', () => {
      const variables = {
        projectName: 'Test',
        genre: 'Test',
        name: 'Test',
        description: 'Test'
      }

      const result = substituteVariables(template, variables)

      expect(result).toContain('Determine:')
      expect(result).toContain('1. Character type')
      expect(result).toContain('9. Emotional journey')
    })
  })

  describe('Scene Prompt Templates', () => {
    const template = `Analyze this scene for {{projectName}}.

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

    it('should generate scene analysis prompt', () => {
      const variables = {
        projectName: 'Test Movie',
        name: 'Opening Scene',
        content: 'The hero enters the room and discovers the truth.'
      }

      const result = substituteVariables(template, variables)

      expect(result).toContain('Test Movie')
      expect(result).toContain('Opening Scene')
      expect(result).toContain('discovers the truth')
    })

    it('should handle long content', () => {
      const variables = {
        projectName: 'Epic Story',
        name: 'Battle Scene',
        content: 'A'.repeat(1000)
      }

      const result = substituteVariables(template, variables)

      expect(result).toContain('A'.repeat(1000))
    })
  })

  describe('Location Prompt Templates', () => {
    const template = `Describe this location for {{projectName}}.

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

    it('should generate location description prompt', () => {
      const variables = {
        projectName: 'Mystery Movie',
        name: 'Abandoned Warehouse',
        description: 'Dark, dusty warehouse on the outskirts of town'
      }

      const result = substituteVariables(template, variables)

      expect(result).toContain('Mystery Movie')
      expect(result).toContain('Abandoned Warehouse')
      expect(result).toContain('Dark, dusty warehouse')
    })
  })

  describe('Episode Prompt Templates', () => {
    const template = `Analyze episode {{number}}: {{title}} for {{projectName}}.

Description: {{description}}

Determine:
1. Episode type (pilot, regular, finale, special)
2. Narrative arc
3. Thematic focus
4. Character focus
5. Plot threads
6. Cliffhanger presence
7. Overall emotional tone`

    it('should generate episode analysis prompt', () => {
      const variables = {
        number: 1,
        title: 'Pilot',
        projectName: 'Series Name',
        description: 'The journey begins'
      }

      const result = substituteVariables(template, variables)

      expect(result).toContain('episode 1: Pilot')
      expect(result).toContain('Series Name')
      expect(result).toContain('The journey begins')
    })
  })

  describe('Template Validation', () => {
    it('should identify all variables in template', () => {
      const template = 'Name: {{name}}, Age: {{age}}, City: {{city}}'

      const variables = extractVariables(template)

      expect(variables).toContain('name')
      expect(variables).toContain('age')
      expect(variables).toContain('city')
      expect(variables).toHaveLength(3)
    })

    it('should identify duplicate variables', () => {
      const template = '{{name}} is {{name}}'

      const variables = extractVariables(template)

      expect(variables).toContain('name')
      expect(variables).toHaveLength(1) // Should dedupe
    })

    it('should handle templates without variables', () => {
      const template = 'This is a plain template'

      const variables = extractVariables(template)

      expect(variables).toHaveLength(0)
    })

    it('should validate required variables are provided', () => {
      const template = 'Hello {{name}} from {{city}}'
      const requiredVars = ['name', 'city']
      const providedVars = { name: 'John' }

      const validation = validateVariables(template, requiredVars, providedVars)

      expect(validation.valid).toBe(false)
      expect(validation.missing).toContain('city')
    })

    it('should pass validation when all variables provided', () => {
      const template = 'Hello {{name}} from {{city}}'
      const requiredVars = ['name', 'city']
      const providedVars = { name: 'John', city: 'NYC' }

      const validation = validateVariables(template, requiredVars, providedVars)

      expect(validation.valid).toBe(true)
      expect(validation.missing).toHaveLength(0)
    })
  })

  describe('Output Format Validation', () => {
    it('should validate JSON output format', () => {
      const prompt = 'Return a JSON object with {}'

      expect(isJSONOutputFormat(prompt)).toBe(true)
    })

    it('should validate plain text output format', () => {
      const prompt = 'Return ONLY the summary text'

      expect(isJSONOutputFormat(prompt)).toBe(false)
    })

    it('should detect structured output instructions', () => {
      const prompt = 'Return a JSON array of relationships: []'

      expect(hasStructuredOutput(prompt)).toBe(true)
      expect(getOutputFormat(prompt)).toBe('json')
    })
  })

  describe('Performance', () => {
    it('should handle large templates efficiently', () => {
      const largeTemplate = 'Start {{var}} ' + 'middle '.repeat(1000) + ' end {{var}}'
      const variables = { var: 'value' }

      const start = performance.now()
      const result = substituteVariables(largeTemplate, variables)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10) // Should be fast
      expect(result).toContain('Start value')
      expect(result).toContain('end value')
    })

    it('should handle many variables efficiently', () => {
      const variables: Record<string, string> = {}
      let template = ''

      for (let i = 0; i < 100; i++) {
        variables[`var${i}`] = `value${i}`
        template += `{{var${i}}} `
      }

      const start = performance.now()
      const result = substituteVariables(template, variables)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
      expect(result).toContain('value0')
      expect(result).toContain('value99')
    })
  })
})

// Helper functions for testing (these would be in the actual implementation)

function substituteVariables(template: string, variables: Record<string, any>): string {
  return Object.entries(variables).reduce((result, [key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    return result.replace(regex, String(value))
  }, template)
}

function extractVariables(template: string): string[] {
  const regex = /{{([^}]+)}}/g
  const matches = template.matchAll(regex)
  const variables = Array.from(matches, m => m[1])
  return [...new Set(variables)] // Dedupe
}

function validateVariables(
  template: string,
  required: string[],
  provided: Record<string, any>
): { valid: boolean; missing: string[] } {
  const missing = required.filter(key => !(key in provided))
  return {
    valid: missing.length === 0,
    missing
  }
}

function isJSONOutputFormat(prompt: string): boolean {
  return prompt.toLowerCase().includes('json')
}

function hasStructuredOutput(prompt: string): boolean {
  return prompt.toLowerCase().includes('json') ||
         prompt.toLowerCase().includes('array') ||
         prompt.toLowerCase().includes('object')
}

function getOutputFormat(prompt: string): 'json' | 'text' {
  return isJSONOutputFormat(prompt) ? 'json' : 'text'
}
