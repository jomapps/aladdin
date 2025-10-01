import type { CollectionConfig } from 'payload'

export const ExportJobs: CollectionConfig = {
  slug: 'export-jobs',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'status', 'format', 'progress', 'user', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'jobId',
      type: 'text',
      required: true,
      unique: true,
      label: 'Job ID',
      index: true,
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      label: 'Project',
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'User',
      index: true,
    },
    {
      name: 'videoId',
      type: 'text',
      required: true,
      label: 'Video ID',
      admin: {
        description: 'ID of the video being exported',
      },
    },
    {
      name: 'format',
      type: 'select',
      required: true,
      options: [
        { label: 'MP4', value: 'mp4' },
        { label: 'WebM', value: 'webm' },
        { label: 'MOV', value: 'mov' },
      ],
      label: 'Export Format',
    },
    {
      name: 'quality',
      type: 'select',
      required: true,
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Ultra', value: 'ultra' },
      ],
      label: 'Quality',
    },
    {
      name: 'resolution',
      type: 'text',
      required: true,
      label: 'Resolution',
      admin: {
        description: 'e.g., 1920x1080',
      },
    },
    {
      name: 'fps',
      type: 'number',
      required: true,
      label: 'FPS',
      admin: {
        description: 'Frames per second',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      label: 'Status',
      defaultValue: 'pending',
      index: true,
    },
    {
      name: 'progress',
      type: 'number',
      required: true,
      label: 'Progress (%)',
      min: 0,
      max: 100,
      defaultValue: 0,
    },
    {
      name: 'outputUrl',
      type: 'text',
      label: 'Output URL',
      admin: {
        description: 'URL of the exported file',
      },
    },
    {
      name: 'outputSize',
      type: 'number',
      label: 'Output Size (bytes)',
      admin: {
        description: 'File size in bytes',
      },
    },
    {
      name: 'errorMessage',
      type: 'textarea',
      label: 'Error Message',
      admin: {
        description: 'Error details if job failed',
      },
    },
    {
      name: 'options',
      type: 'json',
      label: 'Export Options',
      admin: {
        description: 'Additional export options',
      },
    },
    {
      name: 'startedAt',
      type: 'date',
      label: 'Started At',
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Completed At',
    },
    {
      name: 'processingTime',
      type: 'number',
      label: 'Processing Time (seconds)',
      admin: {
        description: 'Time taken to complete export',
      },
    },
  ],
  timestamps: true,
}
