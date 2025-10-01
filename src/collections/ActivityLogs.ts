import type { CollectionConfig } from 'payload'
import { dataPrepHooks } from '@/lib/agents/data-preparation/payload-hooks'

export const ActivityLogs: CollectionConfig = {
  slug: 'activity-logs',
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'user', 'project', 'timestamp'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => false,
    delete: () => true,
  },
  hooks: {
    ...dataPrepHooks.projectBased(),
  },
  fields: [
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
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Project Created', value: 'project.created' },
        { label: 'Project Updated', value: 'project.updated' },
        { label: 'Project Deleted', value: 'project.deleted' },
        { label: 'Content Created', value: 'content.created' },
        { label: 'Content Updated', value: 'content.updated' },
        { label: 'Content Deleted', value: 'content.deleted' },
        { label: 'Export Started', value: 'export.started' },
        { label: 'Export Completed', value: 'export.completed' },
        { label: 'Team Member Added', value: 'team.member.added' },
        { label: 'Team Member Removed', value: 'team.member.removed' },
        { label: 'Team Role Changed', value: 'team.role.changed' },
        { label: 'Clone Created', value: 'clone.created' },
        { label: 'Media Uploaded', value: 'media.uploaded' },
      ],
      label: 'Action',
      index: true,
    },
    {
      name: 'entityType',
      type: 'text',
      label: 'Entity Type',
      admin: {
        description: 'Type of entity affected (e.g., character, scene)',
      },
    },
    {
      name: 'entityId',
      type: 'text',
      label: 'Entity ID',
      admin: {
        description: 'ID of the affected entity',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      label: 'Metadata',
      admin: {
        description: 'Additional context about the action',
      },
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      label: 'Timestamp',
      defaultValue: () => new Date(),
      index: true,
    },
    {
      name: 'ipAddress',
      type: 'text',
      label: 'IP Address',
      admin: {
        description: 'User IP address',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      label: 'User Agent',
      admin: {
        description: 'Browser user agent',
      },
    },
  ],
  timestamps: false,
}
