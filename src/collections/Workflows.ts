import type { CollectionConfig } from 'payload'

export const Workflows: CollectionConfig = {
  slug: 'workflows',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'project', 'currentPhase'],
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
      name: 'name',
      type: 'text',
      required: true,
      label: 'Workflow Name',
      admin: {
        description: 'Descriptive workflow name',
      },
    },

    // ========== ASSOCIATION ==========
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      label: 'Project',
      admin: {
        description: 'Associated project',
      },
    },

    // ========== CURRENT STATE ==========
    {
      name: 'currentPhase',
      type: 'select',
      options: [
        { label: 'Expansion', value: 'expansion' },
        { label: 'Compacting', value: 'compacting' },
        { label: 'Complete', value: 'complete' },
      ],
      label: 'Current Phase',
      admin: {
        description: 'Current production phase',
      },
    },

    // ========== QUALITY GATES ==========
    {
      name: 'qualityGates',
      type: 'array',
      label: 'Quality Gates',
      admin: {
        description: 'Quality checkpoints and thresholds',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Gate Name',
        },
        {
          name: 'threshold',
          type: 'number',
          required: true,
          label: 'Quality Threshold',
          min: 0,
          max: 1,
          admin: {
            description: '0-1 scale, minimum quality required to pass',
          },
        },
        {
          name: 'passed',
          type: 'checkbox',
          label: 'Passed',
          admin: {
            description: 'Whether this gate has been passed',
          },
        },
        {
          name: 'evaluatedAt',
          type: 'date',
          label: 'Evaluated At',
          admin: {
            description: 'When this gate was last evaluated',
          },
        },
      ],
    },
  ],
  timestamps: true,
}