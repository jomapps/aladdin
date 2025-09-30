import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'phase', 'status', 'owner'],
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
      label: 'Project Name',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL Slug',
      admin: {
        description: 'Auto-generated from name (URL-safe)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          },
        ],
      },
    },

    // ========== PROJECT TYPE ==========
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Movie', value: 'movie' },
        { label: 'Series', value: 'series' },
      ],
      label: 'Project Type',
    },

    // ========== PRODUCTION INFO ==========
    {
      name: 'targetLength',
      type: 'number',
      label: 'Target Length (minutes)',
      admin: {
        description: 'For movies',
      },
    },
    {
      name: 'targetEpisodes',
      type: 'number',
      label: 'Target Episodes',
      admin: {
        description: 'For series',
      },
    },
    {
      name: 'genre',
      type: 'array',
      label: 'Genres',
      fields: [
        {
          name: 'genre',
          type: 'text',
        },
      ],
    },
    {
      name: 'logline',
      type: 'textarea',
      label: 'Logline',
      admin: {
        description: 'One-sentence pitch',
      },
    },
    {
      name: 'synopsis',
      type: 'textarea',
      label: 'Synopsis',
    },
    {
      name: 'targetAudience',
      type: 'text',
      label: 'Target Audience',
    },
    {
      name: 'contentRating',
      type: 'text',
      label: 'Content Rating',
      admin: {
        description: 'e.g., PG-13, R, TV-MA',
      },
    },

    // ========== STORY DEVELOPMENT ==========
    {
      name: 'initialIdea',
      type: 'textarea',
      label: 'Initial Idea',
      admin: {
        description: 'Original concept/pitch',
      },
    },
    {
      name: 'storyPremise',
      type: 'textarea',
      label: 'Story Premise',
    },
    {
      name: 'themes',
      type: 'array',
      label: 'Themes',
      fields: [
        {
          name: 'theme',
          type: 'text',
        },
      ],
    },
    {
      name: 'tone',
      type: 'text',
      label: 'Tone',
      admin: {
        description: 'e.g., dark, comedic, dramatic',
      },
    },

    // ========== PRODUCTION STATUS ==========
    {
      name: 'phase',
      type: 'select',
      options: [
        { label: 'Expansion', value: 'expansion' },
        { label: 'Compacting', value: 'compacting' },
        { label: 'Complete', value: 'complete' },
      ],
      label: 'Production Phase',
      defaultValue: 'expansion',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Archived', value: 'archived' },
        { label: 'Complete', value: 'complete' },
      ],
      label: 'Project Status',
      defaultValue: 'active',
    },
    {
      name: 'expansionProgress',
      type: 'number',
      label: 'Expansion Progress (%)',
      min: 0,
      max: 100,
      admin: {
        description: '0-100',
      },
    },
    {
      name: 'compactingProgress',
      type: 'number',
      label: 'Compacting Progress (%)',
      min: 0,
      max: 100,
      admin: {
        description: '0-100',
      },
    },

    // ========== QUALITY METRICS ==========
    {
      name: 'overallQuality',
      type: 'number',
      label: 'Overall Quality',
      min: 0,
      max: 1,
      admin: {
        description: '0-1 scale',
      },
    },
    {
      name: 'qualityBreakdown',
      type: 'group',
      label: 'Quality Breakdown',
      fields: [
        {
          name: 'story',
          type: 'number',
          label: 'Story Quality',
          min: 0,
          max: 1,
        },
        {
          name: 'characters',
          type: 'number',
          label: 'Character Quality',
          min: 0,
          max: 1,
        },
        {
          name: 'visuals',
          type: 'number',
          label: 'Visual Quality',
          min: 0,
          max: 1,
        },
        {
          name: 'technical',
          type: 'number',
          label: 'Technical Quality',
          min: 0,
          max: 1,
        },
      ],
    },

    // ========== TEAM & ACCESS ==========
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Project Owner',
      admin: {
        description: 'Project creator/owner',
      },
    },
    {
      name: 'team',
      type: 'array',
      label: 'Team Members',
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Producer', value: 'producer' },
            { label: 'Director', value: 'director' },
            { label: 'Writer', value: 'writer' },
            { label: 'Editor', value: 'editor' },
            { label: 'Viewer', value: 'viewer' },
          ],
          required: true,
        },
        {
          name: 'permissions',
          type: 'array',
          label: 'Permissions',
          fields: [
            {
              name: 'permission',
              type: 'text',
            },
          ],
        },
        {
          name: 'addedAt',
          type: 'date',
          label: 'Added At',
          defaultValue: () => new Date(),
        },
      ],
    },

    // ========== SETTINGS ==========
    {
      name: 'settings',
      type: 'group',
      label: 'Project Settings',
      fields: [
        {
          name: 'brainValidationRequired',
          type: 'checkbox',
          label: 'Brain Validation Required',
          defaultValue: true,
        },
        {
          name: 'minQualityThreshold',
          type: 'number',
          label: 'Minimum Quality Threshold',
          min: 0,
          max: 1,
          defaultValue: 0.7,
        },
        {
          name: 'autoGenerateImages',
          type: 'checkbox',
          label: 'Auto-Generate Images',
          defaultValue: false,
        },
        {
          name: 'videoGenerationProvider',
          type: 'text',
          label: 'Video Generation Provider',
          admin: {
            description: 'e.g., RunwayML, Pika Labs',
          },
        },
        {
          name: 'maxBudget',
          type: 'number',
          label: 'Maximum Budget ($)',
        },
      ],
    },

    // ========== OPEN DATABASE REFERENCE ==========
    {
      name: 'openDatabaseName',
      type: 'text',
      required: true,
      unique: true,
      label: 'Open Database Name',
      admin: {
        description: 'Auto-generated: open_[slug]',
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.slug) {
              return `open_${data.slug}`
            }
            return value
          },
        ],
      },
    },
    {
      name: 'dynamicCollections',
      type: 'array',
      label: 'Dynamic Collections',
      admin: {
        description: 'List of created collections in open database',
      },
      fields: [
        {
          name: 'collection',
          type: 'text',
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
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media',
      label: 'Cover Image',
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      label: 'Public Project',
      defaultValue: false,
    },
    {
      name: 'lastActivityAt',
      type: 'date',
      label: 'Last Activity',
      admin: {
        description: 'Auto-updated on activity',
      },
    },
  ],
  timestamps: true,
}