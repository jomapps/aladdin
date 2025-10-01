import type { CollectionConfig } from 'payload'

/**
 * Agents Collection
 *
 * Defines individual AI agents with their capabilities and configurations.
 * Each department has one Department Head and multiple Specialist agents.
 *
 * Validation Rules:
 * - Only ONE agent per department can have isDepartmentHead: true
 * - Department heads MUST have requiresReview: false
 * - Specialist agents MUST have requiresReview: true
 *
 * @see {@link /docs/idea/dynamic-agents.md} for complete architecture
 */
export const Agents: CollectionConfig = {
  slug: 'agents',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'agentId', 'department', 'isDepartmentHead', 'isActive'],
    description: 'AI agents for movie production workflow',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // Validate department head uniqueness
        if (data?.isDepartmentHead && data?.department) {
          const existingHead = await req.payload.find({
            collection: 'agents',
            where: {
              department: { equals: data.department },
              isDepartmentHead: { equals: true },
              ...(operation === 'update' && data.id ? { id: { not_equals: data.id } } : {}),
            },
            limit: 1,
          })

          if (existingHead.docs.length > 0) {
            throw new Error(
              `Department already has a head agent: ${existingHead.docs[0].name}. Only one department head per department is allowed.`,
            )
          }
        }

        // Validate review requirements
        if (data?.isDepartmentHead && data?.requiresReview) {
          throw new Error('Department heads must have requiresReview set to false')
        }

        if (data?.isDepartmentHead === false && data?.requiresReview === false) {
          throw new Error('Specialist agents must have requiresReview set to true')
        }

        return data
      },
    ],
  },
  fields: [
    // ========== BASIC INFO ==========
    {
      name: 'agentId',
      type: 'text',
      required: true,
      unique: true,
      label: 'Agent ID',
      admin: {
        description: 'Unique identifier (e.g., "story-head-001", "character-dialogue-specialist")',
      },
      validate: (value) => {
        if (!/^[a-z][a-z0-9-]*$/.test(value)) {
          return 'Agent ID must start with lowercase letter and contain only lowercase letters, numbers, and hyphens'
        }
        return true
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Agent Name',
      admin: {
        description: 'Display name',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
      admin: {
        description: 'Agent role and capabilities',
      },
    },

    // ========== DEPARTMENT RELATIONSHIP ==========
    {
      name: 'department',
      type: 'relationship',
      relationTo: 'departments',
      required: true,
      label: 'Department',
      admin: {
        description: 'Which department this agent belongs to',
      },
    },
    {
      name: 'isDepartmentHead',
      type: 'checkbox',
      label: 'Department Head',
      defaultValue: false,
      admin: {
        description: 'Is this the department head? (Only one per department)',
      },
    },

    // ========== @codebuff/sdk CONFIGURATION ==========
    {
      name: 'model',
      type: 'text',
      required: true,
      label: 'AI Model',
      defaultValue: 'anthropic/claude-3.5-sonnet',
      admin: {
        description:
          'Model to use (e.g., "anthropic/claude-3.5-sonnet", "anthropic/claude-3-opus")',
      },
    },
    {
      name: 'instructionsPrompt',
      type: 'textarea',
      required: true,
      label: 'Instructions Prompt',
      admin: {
        description: 'Core system prompt defining agent behavior and expertise',
        rows: 10,
      },
    },
    {
      name: 'toolNames',
      type: 'array',
      label: 'Tool Names',
      admin: {
        description: 'Custom tools this agent can use',
      },
      fields: [
        {
          name: 'toolName',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'maxAgentSteps',
      type: 'number',
      label: 'Max Agent Steps',
      defaultValue: 20,
      min: 1,
      max: 100,
      admin: {
        description: 'Maximum steps for this agent execution',
      },
    },

    // ========== CAPABILITIES ==========
    {
      name: 'specialization',
      type: 'text',
      label: 'Specialization',
      admin: {
        description:
          'Specific area of expertise (e.g., "dialogue", "plot-structure", "character-arcs")',
      },
    },
    {
      name: 'skills',
      type: 'array',
      label: 'Skills',
      admin: {
        description: 'Specific skills for specialist selection',
      },
      fields: [
        {
          name: 'skill',
          type: 'text',
          required: true,
        },
      ],
    },

    // ========== STATUS & PERFORMANCE ==========
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Is this agent active and available?',
      },
    },
    {
      name: 'performanceMetrics',
      type: 'group',
      label: 'Performance Metrics',
      admin: {
        description: 'Auto-tracked performance data',
        readOnly: true,
      },
      fields: [
        {
          name: 'successRate',
          type: 'number',
          label: 'Success Rate (%)',
          min: 0,
          max: 100,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'averageExecutionTime',
          type: 'number',
          label: 'Average Execution Time (ms)',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'totalExecutions',
          type: 'number',
          label: 'Total Executions',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'successfulExecutions',
          type: 'number',
          label: 'Successful Executions',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'failedExecutions',
          type: 'number',
          label: 'Failed Executions',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'averageQualityScore',
          type: 'number',
          label: 'Average Quality Score',
          min: 0,
          max: 100,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'totalTokensUsed',
          type: 'number',
          label: 'Total Tokens Used',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'lastExecutedAt',
      type: 'date',
      label: 'Last Executed',
      admin: {
        description: 'Last execution timestamp',
        readOnly: true,
      },
    },

    // ========== QUALITY CONTROL ==========
    {
      name: 'requiresReview',
      type: 'checkbox',
      label: 'Requires Review',
      defaultValue: true,
      admin: {
        description: 'Does output need department head review? (Department heads must be false)',
      },
    },
    {
      name: 'qualityThreshold',
      type: 'number',
      label: 'Quality Threshold',
      defaultValue: 80,
      min: 0,
      max: 100,
      admin: {
        description: 'Minimum quality score (0-100) for approval',
      },
    },

    // ========== EXECUTION SETTINGS ==========
    {
      name: 'executionSettings',
      type: 'group',
      label: 'Execution Settings',
      fields: [
        {
          name: 'timeout',
          type: 'number',
          label: 'Timeout (seconds)',
          defaultValue: 300,
          min: 10,
          max: 3600,
          admin: {
            description: 'Maximum execution time in seconds',
          },
        },
        {
          name: 'maxRetries',
          type: 'number',
          label: 'Max Retries',
          defaultValue: 3,
          min: 0,
          max: 10,
          admin: {
            description: 'Maximum retry attempts on failure',
          },
        },
        {
          name: 'temperature',
          type: 'number',
          label: 'Temperature',
          defaultValue: 0.7,
          min: 0,
          max: 2,
          admin: {
            description: 'Model temperature for creativity (0-2)',
          },
        },
      ],
    },

    // ========== METADATA ==========
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Internal Notes',
      admin: {
        description: 'Internal notes for agent configuration',
      },
    },
  ],
  timestamps: true,
}
