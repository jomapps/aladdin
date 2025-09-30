import type { CollectionConfig } from 'payload'

export const Conversations: CollectionConfig = {
  slug: 'conversations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'project', 'status', 'lastMessageAt'],
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
      label: 'Conversation Name',
      admin: {
        description: 'Descriptive name for this conversation',
      },
    },

    // ========== ASSOCIATION ==========
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      label: 'Project',
      admin: {
        description: 'Associated project (optional)',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'User',
      admin: {
        description: 'Conversation owner',
      },
    },

    // ========== MESSAGES ==========
    {
      name: 'messages',
      type: 'array',
      label: 'Messages',
      admin: {
        description: 'Conversation message history',
      },
      fields: [
        {
          name: 'id',
          type: 'text',
          required: true,
          label: 'Message ID',
          admin: {
            description: 'Unique message identifier',
          },
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          options: [
            { label: 'User', value: 'user' },
            { label: 'Assistant', value: 'assistant' },
            { label: 'System', value: 'system' },
          ],
          label: 'Role',
        },
        {
          name: 'content',
          type: 'textarea',
          required: true,
          label: 'Message Content',
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
          label: 'Timestamp',
          defaultValue: () => new Date(),
        },
        {
          name: 'agentId',
          type: 'text',
          label: 'Agent ID',
          admin: {
            description: 'ID of the agent that generated this message',
          },
        },
      ],
    },

    // ========== STATUS ==========
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
      label: 'Status',
      defaultValue: 'active',
    },

    // ========== METADATA ==========
    {
      name: 'lastMessageAt',
      type: 'date',
      label: 'Last Message At',
      admin: {
        description: 'Timestamp of last message',
      },
    },
  ],
  timestamps: true,
}