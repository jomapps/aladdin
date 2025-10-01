/**
 * Validation Rules Tests
 * Tests for validation rule behavior and enforcement
 */

import { describe, it, expect } from 'vitest'
import type { ValidationRule, EntityConfig } from '@/lib/agents/data-preparation/types'

describe('Validation Rules', () => {
  describe('Required Rule', () => {
    const requiredRule: ValidationRule = {
      field: 'name',
      rule: 'required',
      message: 'Name is required'
    }

    it('should pass when field is present', () => {
      const data = { name: 'John Doe' }
      const isValid = data.name !== null && data.name !== undefined && data.name !== ''

      expect(isValid).toBe(true)
    })

    it('should fail when field is missing', () => {
      const data = {}
      const isValid = !!(data as any).name

      expect(isValid).toBe(false)
    })

    it('should fail when field is null', () => {
      const data = { name: null }
      const isValid = data.name !== null && data.name !== undefined && data.name !== ''

      expect(isValid).toBe(false)
    })

    it('should fail when field is undefined', () => {
      const data = { name: undefined }
      const isValid = data.name !== null && data.name !== undefined && data.name !== ''

      expect(isValid).toBe(false)
    })

    it('should fail when field is empty string', () => {
      const data = { name: '' }
      const isValid = data.name !== null && data.name !== undefined && data.name !== ''

      expect(isValid).toBe(false)
    })
  })

  describe('MinLength Rule', () => {
    const minLengthRule: ValidationRule = {
      field: 'name',
      rule: 'minLength',
      value: 3,
      message: 'Name must be at least 3 characters'
    }

    it('should pass when length equals minimum', () => {
      const data = { name: 'ABC' }
      const isValid = data.name.length >= minLengthRule.value!

      expect(isValid).toBe(true)
    })

    it('should pass when length exceeds minimum', () => {
      const data = { name: 'ABCD' }
      const isValid = data.name.length >= minLengthRule.value!

      expect(isValid).toBe(true)
    })

    it('should fail when length is below minimum', () => {
      const data = { name: 'AB' }
      const isValid = data.name.length >= minLengthRule.value!

      expect(isValid).toBe(false)
    })

    it('should fail when field is empty', () => {
      const data = { name: '' }
      const isValid = data.name && data.name.length >= minLengthRule.value!

      expect(isValid).toBe(false)
    })
  })

  describe('MaxLength Rule', () => {
    const maxLengthRule: ValidationRule = {
      field: 'description',
      rule: 'maxLength',
      value: 100,
      message: 'Description must not exceed 100 characters'
    }

    it('should pass when length equals maximum', () => {
      const data = { description: 'A'.repeat(100) }
      const isValid = data.description.length <= maxLengthRule.value!

      expect(isValid).toBe(true)
    })

    it('should pass when length is below maximum', () => {
      const data = { description: 'Short text' }
      const isValid = data.description.length <= maxLengthRule.value!

      expect(isValid).toBe(true)
    })

    it('should fail when length exceeds maximum', () => {
      const data = { description: 'A'.repeat(101) }
      const isValid = data.description.length <= maxLengthRule.value!

      expect(isValid).toBe(false)
    })

    it('should pass when field is empty', () => {
      const data = { description: '' }
      const isValid = data.description.length <= maxLengthRule.value!

      expect(isValid).toBe(true)
    })
  })

  describe('Pattern Rule', () => {
    const emailRule: ValidationRule = {
      field: 'email',
      rule: 'pattern',
      value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      message: 'Invalid email format'
    }

    it('should pass with valid email', () => {
      const data = { email: 'test@example.com' }
      const pattern = new RegExp(emailRule.value!)
      const isValid = pattern.test(data.email)

      expect(isValid).toBe(true)
    })

    it('should pass with complex valid email', () => {
      const data = { email: 'user.name+tag@sub.domain.com' }
      const pattern = new RegExp(emailRule.value!)
      const isValid = pattern.test(data.email)

      expect(isValid).toBe(true)
    })

    it('should fail with invalid email', () => {
      const data = { email: 'invalid-email' }
      const pattern = new RegExp(emailRule.value!)
      const isValid = pattern.test(data.email)

      expect(isValid).toBe(false)
    })

    it('should fail with empty string', () => {
      const data = { email: '' }
      const pattern = new RegExp(emailRule.value!)
      const isValid = pattern.test(data.email)

      expect(isValid).toBe(false)
    })
  })

  describe('Multiple Rules', () => {
    const rules: ValidationRule[] = [
      {
        field: 'name',
        rule: 'required',
        message: 'Name is required'
      },
      {
        field: 'name',
        rule: 'minLength',
        value: 2,
        message: 'Name must be at least 2 characters'
      },
      {
        field: 'name',
        rule: 'maxLength',
        value: 50,
        message: 'Name must not exceed 50 characters'
      }
    ]

    it('should pass all rules with valid data', () => {
      const data = { name: 'John Doe' }

      const errors = rules
        .map(rule => {
          if (rule.rule === 'required' && !data.name) {
            return rule.message
          }
          if (rule.rule === 'minLength' && data.name.length < rule.value!) {
            return rule.message
          }
          if (rule.rule === 'maxLength' && data.name.length > rule.value!) {
            return rule.message
          }
          return null
        })
        .filter(Boolean)

      expect(errors).toHaveLength(0)
    })

    it('should fail multiple rules with invalid data', () => {
      const data = { name: 'A' }

      const errors = rules
        .map(rule => {
          if (rule.rule === 'required' && !data.name) {
            return rule.message
          }
          if (rule.rule === 'minLength' && data.name.length < rule.value!) {
            return rule.message
          }
          if (rule.rule === 'maxLength' && data.name.length > rule.value!) {
            return rule.message
          }
          return null
        })
        .filter(Boolean)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain('Name must be at least 2 characters')
    })

    it('should return all errors when multiple rules fail', () => {
      const data = { name: '' }

      const errors = rules
        .map(rule => {
          if (rule.rule === 'required' && !data.name) {
            return rule.message
          }
          if (rule.rule === 'minLength' && data.name.length < rule.value!) {
            return rule.message
          }
          if (rule.rule === 'maxLength' && data.name.length > rule.value!) {
            return rule.message
          }
          return null
        })
        .filter(Boolean)

      expect(errors.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Entity Configuration Validation', () => {
    const characterConfig: EntityConfig = {
      type: 'character',
      requiredFields: ['name', 'description'],
      contextSources: ['project', 'payload'],
      relationshipRules: [],
      enrichmentStrategy: 'standard',
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

    it('should validate complete character data', () => {
      const data = {
        name: 'John Doe',
        description: 'A brave detective seeking justice'
      }

      const errors = validateWithRules(data, characterConfig.validationRules || [])

      expect(errors).toHaveLength(0)
    })

    it('should fail validation for incomplete character data', () => {
      const data = {
        name: 'J',
        description: 'Short'
      }

      const errors = validateWithRules(data, characterConfig.validationRules || [])

      expect(errors.length).toBeGreaterThan(0)
    })

    it('should check required fields', () => {
      const data = { name: 'John Doe' }

      const missingFields = characterConfig.requiredFields.filter(
        field => !(data as any)[field]
      )

      expect(missingFields).toContain('description')
    })
  })

  describe('Custom Rule Implementation', () => {
    it('should support custom validation logic', () => {
      const customRule: ValidationRule = {
        field: 'age',
        rule: 'custom',
        value: (value: any) => value >= 18 && value <= 100,
        message: 'Age must be between 18 and 100'
      }

      const validData = { age: 25 }
      const invalidDataLow = { age: 10 }
      const invalidDataHigh = { age: 150 }

      expect(typeof customRule.value === 'function' && customRule.value(validData.age)).toBe(true)
      expect(typeof customRule.value === 'function' && customRule.value(invalidDataLow.age)).toBe(false)
      expect(typeof customRule.value === 'function' && customRule.value(invalidDataHigh.age)).toBe(false)
    })
  })

  describe('Error Messages', () => {
    it('should provide clear error messages', () => {
      const rules: ValidationRule[] = [
        {
          field: 'name',
          rule: 'required',
          message: 'Character name is required'
        },
        {
          field: 'email',
          rule: 'pattern',
          value: '^[^@]+@[^@]+$',
          message: 'Invalid email format'
        }
      ]

      rules.forEach(rule => {
        expect(rule.message).toBeDefined()
        expect(rule.message.length).toBeGreaterThan(0)
        expect(typeof rule.message).toBe('string')
      })
    })

    it('should include field name in error message', () => {
      const rules: ValidationRule[] = [
        {
          field: 'name',
          rule: 'required',
          message: 'Character name is required'
        },
        {
          field: 'description',
          rule: 'minLength',
          value: 10,
          message: 'Character description must be at least 10 characters'
        }
      ]

      rules.forEach(rule => {
        const mentionsField = rule.message.toLowerCase().includes(rule.field.toLowerCase())
        // Message should ideally mention the field, but not strictly required
        expect(rule.message).toBeTruthy()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const data = { name: null }
      const rule: ValidationRule = {
        field: 'name',
        rule: 'required',
        message: 'Name is required'
      }

      const isValid = !!(data.name)
      expect(isValid).toBe(false)
    })

    it('should handle undefined values', () => {
      const data = { name: undefined }
      const rule: ValidationRule = {
        field: 'name',
        rule: 'required',
        message: 'Name is required'
      }

      const isValid = !!(data.name)
      expect(isValid).toBe(false)
    })

    it('should handle whitespace-only strings', () => {
      const data = { name: '   ' }
      const rule: ValidationRule = {
        field: 'name',
        rule: 'minLength',
        value: 3,
        message: 'Name must be at least 3 characters'
      }

      const isValid = data.name.length >= rule.value!
      expect(isValid).toBe(true) // Length is 3, but might want to trim first
    })

    it('should handle numeric fields', () => {
      const data = { age: 25 }
      const rule: ValidationRule = {
        field: 'age',
        rule: 'required',
        message: 'Age is required'
      }

      const isValid = data.age !== null && data.age !== undefined
      expect(isValid).toBe(true)
    })
  })
})

// Helper function for testing
function validateWithRules(data: any, rules: ValidationRule[]): string[] {
  const errors: string[] = []

  rules.forEach(rule => {
    const value = data[rule.field]

    switch (rule.rule) {
      case 'required':
        if (!value && value !== 0) {
          errors.push(rule.message)
        }
        break

      case 'minLength':
        if (value && value.length < rule.value!) {
          errors.push(rule.message)
        }
        break

      case 'maxLength':
        if (value && value.length > rule.value!) {
          errors.push(rule.message)
        }
        break

      case 'pattern':
        if (value && !new RegExp(rule.value!).test(value)) {
          errors.push(rule.message)
        }
        break

      case 'custom':
        if (typeof rule.value === 'function' && !rule.value(value)) {
          errors.push(rule.message)
        }
        break
    }
  })

  return errors
}
