import type { CollectionConfig } from 'payload'

/**
 * Custom Tools Collection
 *
 * Defines reusable custom tools that agents can use during execution.
 * Tools are defined with input schemas, implementation code, and department availability.
 *
 * Tools can be:
 * - Global (available to all agents)
 * - Department-specific (available to specific departments)
 *
 * @see {@link /docs/idea/dynamic-agents.md} for complete architecture
 */
export const CustomTools: CollectionConfig = {
  slug: 'custom-tools',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'toolName', 'isGlobal', 'isActive', 'version'],
    description: 'Reusable custom tools for AI agents',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    // ========== IDENTITY ==========
    {
      name: 'toolName',
      type: 'text',
      required: true,
      unique: true,
      label: 'Tool Name',
      admin: {
        description: 'Unique identifier (e.g., "fetch-character-profile", "analyze-plot-structure")',
      },
      validate: (value) => {
        if (!/^[a-z][a-z0-9-]*$/.test(value)) {
          return 'Tool name must start with lowercase letter and contain only lowercase letters, numbers, and hyphens'
        }
        return true
      },
    },
    {
      name: 'displayName',
      type: 'text',
      required: true,
      label: 'Display Name',
      admin: {
        description: 'Human-readable name',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
      admin: {
        description: 'What this tool does and when to use it',
        rows: 3,
      },
    },

    // ========== TOOL CONFIGURATION ==========
    {
      name: 'inputSchema',
      type: 'json',
      required: true,
      label: 'Input Schema',
      admin: {
        description: 'Zod schema as JSON defining tool inputs',
      },
    },
    {
      name: 'exampleInputs',
      type: 'array',
      label: 'Example Inputs',
      admin: {
        description: 'Example inputs for documentation and testing',
      },
      fields: [
        {
          name: 'example',
          type: 'json',
          label: 'Example',
        },
      ],
    },
    {
      name: 'outputSchema',
      type: 'json',
      label: 'Output Schema',
      admin: {
        description: 'Expected output structure',
      },
    },

    // ========== IMPLEMENTATION ==========
    {
      name: 'executeFunction',
      type: 'code',
      required: true,
      label: 'Execute Function',
      admin: {
        description: 'JavaScript/TypeScript function implementation',
        language: 'typescript',
      },
    },
    {
      name: 'setupCode',
      type: 'code',
      label: 'Setup Code',
      admin: {
        description: 'Optional setup code (imports, initialization)',
        language: 'typescript',
      },
    },

    // ========== AVAILABILITY ==========
    {
      name: 'isGlobal',
      type: 'checkbox',
      label: 'Global Tool',
      defaultValue: false,
      admin: {
        description: 'Available to all agents across all departments',
      },
    },
    {
      name: 'departments',
      type: 'relationship',
      relationTo: 'departments',
      hasMany: true,
      label: 'Departments',
      admin: {
        description: 'Departments that can use this tool (if not global)',
        condition: (data) => !data?.isGlobal,
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Is this tool active and available?',
      },
    },

    // ========== VERSIONING ==========
    {
      name: 'version',
      type: 'text',
      label: 'Version',
      defaultValue: '1.0.0',
      admin: {
        description: 'Semantic version (e.g., 1.0.0)',
      },
      validate: (value) => {
        if (value && !/^\d+\.\d+\.\d+$/.test(value)) {
          return 'Version must be in format X.Y.Z (e.g., 1.0.0)'
        }
        return true
      },
    },
    {
      name: 'changelog',
      type: 'array',
      label: 'Changelog',
      admin: {
        description: 'Version history',
      },
      fields: [
        {
          name: 'version',
          type: 'text',
          label: 'Version',
          required: true,
        },
        {
          name: 'changes',
          type: 'textarea',
          label: 'Changes',
          required: true,
        },
        {
          name: 'date',
          type: 'date',
          label: 'Date',
          defaultValue: () => new Date(),
        },
      ],
    },

    // ========== DEPENDENCIES ==========
    {
      name: 'dependencies',
      type: 'group',
      label: 'Dependencies',
      fields: [
        {
          name: 'npmPackages',
          type: 'array',
          label: 'NPM Packages',
          admin: {
            description: 'Required NPM packages',
          },
          fields: [
            {
              name: 'package',
              type: 'text',
              label: 'Package Name',
              required: true,
            },
            {
              name: 'version',
              type: 'text',
              label: 'Version',
            },
          ],
        },
        {
          name: 'apiKeys',
          type: 'array',
          label: 'Required API Keys',
          admin: {
            description: 'API keys needed for this tool',
          },
          fields: [
            {
              name: 'keyName',
              type: 'text',
              label: 'Key Name',
              required: true,
            },
            {
              name: 'description',
              type: 'text',
              label: 'Description',
            },
          ],
        },
        {
          name: 'otherTools',
          type: 'array',
          label: 'Other Tools',
          admin: {
            description: 'Other tools this tool depends on',
          },
          fields: [
            {
              name: 'toolName',
              type: 'text',
              label: 'Tool Name',
              required: true,
            },
          ],
        },
      ],
    },

    // ========== PERFORMANCE & USAGE ==========
    {
      name: 'performanceMetrics',
      type: 'group',
      label: 'Performance Metrics',
      admin: {
        description: 'Auto-tracked usage metrics',
        readOnly: true,
      },
      fields: [
        {
          name: 'totalCalls',
          type: 'number',
          label: 'Total Calls',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'successfulCalls',
          type: 'number',
          label: 'Successful Calls',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'failedCalls',
          type: 'number',
          label: 'Failed Calls',
          defaultValue: 0,
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
          name: 'lastUsedAt',
          type: 'date',
          label: 'Last Used',
          admin: {
            readOnly: true,
          },
        },
      ],
    },

    // ========== TESTING ==========
    {
      name: 'testCases',
      type: 'array',
      label: 'Test Cases',
      admin: {
        description: 'Test cases for validation',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Test Name',
          required: true,
        },
        {
          name: 'input',
          type: 'json',
          label: 'Input',
          required: true,
        },
        {
          name: 'expectedOutput',
          type: 'json',
          label: 'Expected Output',
        },
        {
          name: 'shouldFail',
          type: 'checkbox',
          label: 'Should Fail',
          defaultValue: false,
        },
      ],
    },

    // ========== DOCUMENTATION ==========
    {
      name: 'documentation',
      type: 'group',
      label: 'Documentation',
      fields: [
        {
          name: 'usage',
          type: 'textarea',
          label: 'Usage Guide',
          admin: {
            description: 'How to use this tool',
            rows: 5,
          },
        },
        {
          name: 'examples',
          type: 'textarea',
          label: 'Examples',
          admin: {
            description: 'Usage examples',
            rows: 5,
          },
        },
        {
          name: 'limitations',
          type: 'textarea',
          label: 'Limitations',
          admin: {
            description: 'Known limitations',
          },
        },
      ],
    },

    // ========== METADATA ==========
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: [
        { label: 'Data Retrieval', value: 'data-retrieval' },
        { label: 'Analysis', value: 'analysis' },
        { label: 'Generation', value: 'generation' },
        { label: 'Validation', value: 'validation' },
        { label: 'Integration', value: 'integration' },
        { label: 'Utility', value: 'utility' },
      ],
    },
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
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      label: 'Author',
      admin: {
        description: 'Tool creator',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Internal Notes',
    },
  ],
  timestamps: true,
}
