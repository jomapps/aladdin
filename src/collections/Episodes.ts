import type { CollectionConfig } from 'payload'
import { dataPrepHooks } from '@/lib/agents/data-preparation/payload-hooks'

export const Episodes: CollectionConfig = {
  slug: 'episodes',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'project', 'episodeNumber', 'seasonNumber', 'status'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    ...dataPrepHooks.projectBased(),
  },
  fields: [
    // ========== IDENTITY ==========
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Episode Name',
    },

    // ========== ASSOCIATION ==========
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      label: 'Project',
      admin: {
        description: 'Parent project/series',
      },
    },
    {
      name: 'episodeNumber',
      type: 'number',
      required: true,
      label: 'Episode Number',
      min: 1,
    },
    {
      name: 'seasonNumber',
      type: 'number',
      label: 'Season Number',
      min: 1,
      admin: {
        description: 'Optional season number',
      },
    },

    // ========== STORY ==========
    {
      name: 'title',
      type: 'text',
      label: 'Episode Title',
      admin: {
        description: 'Official episode title',
      },
    },
    {
      name: 'logline',
      type: 'textarea',
      label: 'Logline',
      admin: {
        description: 'One-sentence summary',
      },
    },
    {
      name: 'synopsis',
      type: 'textarea',
      label: 'Synopsis',
      admin: {
        description: 'Full episode synopsis',
      },
    },

    // ========== PRODUCTION ==========
    {
      name: 'targetLength',
      type: 'number',
      label: 'Target Length (minutes)',
      admin: {
        description: 'Expected runtime',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Outlined', value: 'outlined' },
        { label: 'Scripted', value: 'scripted' },
        { label: 'Storyboarded', value: 'storyboarded' },
        { label: 'Generated', value: 'generated' },
        { label: 'Complete', value: 'complete' },
      ],
      label: 'Production Status',
      defaultValue: 'outlined',
    },

    // ========== QUALITY ==========
    {
      name: 'qualityRating',
      type: 'number',
      label: 'Quality Rating',
      min: 0,
      max: 1,
      admin: {
        description: '0-1 scale',
      },
    },

    // ========== STORY STRUCTURE ==========
    {
      name: 'actStructure',
      type: 'array',
      label: 'Act Structure',
      admin: {
        description: 'Episode act breakdown',
      },
      fields: [
        {
          name: 'actNumber',
          type: 'number',
          required: true,
          label: 'Act Number',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Act Description',
        },
        {
          name: 'sceneCount',
          type: 'number',
          label: 'Scene Count',
          admin: {
            description: 'Number of scenes in this act',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
