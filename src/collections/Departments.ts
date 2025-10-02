import type { CollectionConfig } from 'payload'

/**
 * Departments Collection
 *
 * Defines organizational departments for movie production (Story, Character, Visual, Video, Audio, Production).
 * Each department has a single Department Head agent and multiple Specialist agents.
 *
 * @see {@link /docs/idea/dynamic-agents.md} for complete architecture
 */
export const Departments: CollectionConfig = {
  slug: 'departments',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'priority', 'isActive'],
    description: 'Movie production departments with AI agent coordination',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: ({ req, data }) => {
      // Prevent deletion of core departments
      if (data?.coreDepartment === true) {
        return false
      }
      return true
    },
  },
  fields: [
    // ========== IDENTITY ==========
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Department Slug',
      admin: {
        description: 'Unique identifier (e.g., "story", "character", "visual")',
      },
      validate: (value) => {
        if (!/^[a-z][a-z0-9-]*$/.test(value)) {
          return 'Slug must start with lowercase letter and contain only lowercase letters, numbers, and hyphens'
        }
        return true
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Department Name',
      admin: {
        description: 'Display name (e.g., "Story Department")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
      admin: {
        description: 'Purpose and responsibilities of this department',
      },
    },

    // ========== VISUAL IDENTITY ==========
    {
      name: 'icon',
      type: 'text',
      label: 'Icon',
      admin: {
        description: 'Emoji or icon identifier (e.g., "📖", "👤")',
      },
    },
    {
      name: 'color',
      type: 'text',
      label: 'Color',
      admin: {
        description: 'Hex color for UI (e.g., "#8B5CF6")',
      },
      validate: (value) => {
        if (value && !/^#[0-9A-F]{6}$/i.test(value)) {
          return 'Color must be a valid hex color (e.g., #8B5CF6)'
        }
        return true
      },
    },

    // ========== EXECUTION PRIORITY ==========
    {
      name: 'priority',
      type: 'number',
      required: true,
      label: 'Execution Priority',
      defaultValue: 5,
      min: 1,
      max: 10,
      admin: {
        description: 'Execution order (1-10, lower = higher priority)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Whether this department is active',
      },
    },
    {
      name: 'coreDepartment',
      type: 'checkbox',
      label: 'Core Department',
      defaultValue: false,
      admin: {
        description:
          'Core departments cannot be deleted (Story, Character, Visual, Video, Audio, Production)',
        readOnly: true,
      },
    },
    {
      name: 'gatherCheck',
      type: 'checkbox',
      label: 'Gather Check',
      defaultValue: false,
      admin: {
        description: 'Enable gather check for this department',
      },
    },

    // ========== @codebuff/sdk INTEGRATION ==========
    {
      name: 'defaultModel',
      type: 'text',
      label: 'Default AI Model',
      defaultValue: 'anthropic/claude-3.5-sonnet',
      admin: {
        description:
          'Default model for agents in this department (e.g., "anthropic/claude-3.5-sonnet")',
      },
    },
    {
      name: 'maxAgentSteps',
      type: 'number',
      label: 'Max Agent Steps',
      defaultValue: 20,
      min: 1,
      max: 100,
      admin: {
        description: 'Maximum steps for agent execution',
      },
    },

    // ========== COORDINATION SETTINGS ==========
    {
      name: 'coordinationSettings',
      type: 'group',
      label: 'Coordination Settings',
      admin: {
        description: 'Settings for department coordination and workflow',
      },
      fields: [
        {
          name: 'allowParallelExecution',
          type: 'checkbox',
          label: 'Allow Parallel Execution',
          defaultValue: true,
          admin: {
            description: 'Allow specialists to run in parallel',
          },
        },
        {
          name: 'requiresDepartmentHeadReview',
          type: 'checkbox',
          label: 'Requires Department Head Review',
          defaultValue: true,
          admin: {
            description: 'All specialist outputs must be reviewed by department head',
          },
        },
        {
          name: 'minQualityThreshold',
          type: 'number',
          label: 'Minimum Quality Threshold',
          defaultValue: 80,
          min: 0,
          max: 100,
          admin: {
            description: 'Minimum quality score (0-100) for approval',
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
            description: 'Maximum retry attempts for failed executions',
          },
        },
      ],
    },

    // ========== PERFORMANCE TRACKING ==========
    {
      name: 'performance',
      type: 'group',
      label: 'Performance Metrics',
      admin: {
        description: 'Auto-tracked performance metrics',
        readOnly: true,
      },
      fields: [
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
          name: 'averageExecutionTime',
          type: 'number',
          label: 'Average Execution Time (ms)',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
  ],
  timestamps: true,
}
