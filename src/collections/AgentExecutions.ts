import type { CollectionConfig } from 'payload'

/**
 * Agent Executions Collection
 *
 * Tracks all agent executions for audit, monitoring, and analytics.
 * Captures complete input/output history, performance metrics, and quality assessments.
 *
 * Provides complete audit trail for:
 * - Original prompts and parameters
 * - Agent instructions used
 * - All tool calls and results
 * - Intermediate thinking steps
 * - Final outputs
 * - Quality scores and reviews
 * - Token usage and execution time
 * - Error logs
 *
 * @see {@link /docs/idea/dynamic-agents.md} for complete architecture
 */
export const AgentExecutions: CollectionConfig = {
  slug: 'agent-executions',
  admin: {
    useAsTitle: 'executionId',
    defaultColumns: ['executionId', 'agent', 'status', 'qualityScore', 'startedAt'],
    description: 'Agent execution tracking and audit trail',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    // ========== EXECUTION IDENTITY ==========
    {
      name: 'executionId',
      type: 'text',
      required: true,
      unique: true,
      label: 'Execution ID',
      admin: {
        description: 'Unique execution identifier (auto-generated)',
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (!value) {
              return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
            return value
          },
        ],
      },
    },

    // ========== AGENT INFO ==========
    {
      name: 'agent',
      type: 'relationship',
      relationTo: 'agents',
      required: true,
      label: 'Agent',
      admin: {
        description: 'Agent that executed this task',
      },
    },
    {
      name: 'department',
      type: 'relationship',
      relationTo: 'departments',
      required: false,
      label: 'Department',
      admin: {
        description: 'Department this execution belongs to (optional for utility agents)',
      },
    },

    // ========== EXECUTION CONTEXT ==========
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      label: 'Project',
      admin: {
        description: 'Project this execution is part of',
      },
    },
    {
      name: 'episode',
      type: 'relationship',
      relationTo: 'episodes',
      label: 'Episode',
      admin: {
        description: 'Episode (if applicable)',
      },
    },
    {
      name: 'conversationId',
      type: 'text',
      label: 'Conversation ID',
      admin: {
        description: 'Link to conversation thread',
      },
    },
    {
      name: 'parentExecutionId',
      type: 'text',
      label: 'Parent Execution ID',
      admin: {
        description: 'Parent execution if this is a sub-task',
      },
    },

    // ========== INPUT/OUTPUT ==========
    {
      name: 'prompt',
      type: 'textarea',
      required: true,
      label: 'Prompt',
      admin: {
        description: 'User or system prompt',
        rows: 5,
      },
    },
    {
      name: 'params',
      type: 'json',
      label: 'Parameters',
      admin: {
        description: 'Additional execution parameters',
      },
    },
    {
      name: 'output',
      type: 'json',
      label: 'Output',
      admin: {
        description: 'Agent output data',
      },
    },
    {
      name: 'outputText',
      type: 'textarea',
      label: 'Output Text',
      admin: {
        description: 'Human-readable output text',
        rows: 10,
      },
    },

    // ========== @codebuff/sdk STATE ==========
    {
      name: 'runState',
      type: 'json',
      label: 'Run State',
      admin: {
        description: 'Complete RunState from @codebuff/sdk',
      },
    },
    {
      name: 'events',
      type: 'array',
      label: 'Events',
      admin: {
        description: 'All events during execution',
      },
      fields: [
        {
          name: 'event',
          type: 'json',
          label: 'Event Data',
        },
      ],
    },

    // ========== PERFORMANCE METRICS ==========
    {
      name: 'status',
      type: 'select',
      required: true,
      label: 'Status',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Running', value: 'running' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Timeout', value: 'timeout' },
      ],
    },
    {
      name: 'startedAt',
      type: 'date',
      label: 'Started At',
      admin: {
        description: 'Execution start time',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Completed At',
      admin: {
        description: 'Execution completion time',
      },
    },
    {
      name: 'executionTime',
      type: 'number',
      label: 'Execution Time (ms)',
      admin: {
        description: 'Total execution time in milliseconds',
      },
    },
    {
      name: 'tokenUsage',
      type: 'group',
      label: 'Token Usage',
      fields: [
        {
          name: 'inputTokens',
          type: 'number',
          label: 'Input Tokens',
        },
        {
          name: 'outputTokens',
          type: 'number',
          label: 'Output Tokens',
        },
        {
          name: 'totalTokens',
          type: 'number',
          label: 'Total Tokens',
        },
        {
          name: 'estimatedCost',
          type: 'number',
          label: 'Estimated Cost ($)',
          admin: {
            description: 'Estimated cost in USD',
          },
        },
      ],
    },

    // ========== QUALITY METRICS ==========
    {
      name: 'qualityScore',
      type: 'number',
      label: 'Quality Score',
      min: 0,
      max: 100,
      admin: {
        description: 'Quality score (0-100)',
      },
    },
    {
      name: 'qualityBreakdown',
      type: 'group',
      label: 'Quality Breakdown',
      fields: [
        {
          name: 'accuracy',
          type: 'number',
          label: 'Accuracy',
          min: 0,
          max: 100,
        },
        {
          name: 'completeness',
          type: 'number',
          label: 'Completeness',
          min: 0,
          max: 100,
        },
        {
          name: 'coherence',
          type: 'number',
          label: 'Coherence',
          min: 0,
          max: 100,
        },
        {
          name: 'creativity',
          type: 'number',
          label: 'Creativity',
          min: 0,
          max: 100,
        },
      ],
    },
    {
      name: 'reviewStatus',
      type: 'select',
      label: 'Review Status',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Revision Needed', value: 'revision-needed' },
      ],
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'agents',
      label: 'Reviewed By',
      admin: {
        description: 'Department head or reviewer',
      },
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      label: 'Review Notes',
      admin: {
        description: 'Reviewer feedback and notes',
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      label: 'Reviewed At',
      admin: {
        description: 'Review timestamp',
      },
    },

    // ========== ERROR HANDLING ==========
    {
      name: 'error',
      type: 'group',
      label: 'Error Details',
      admin: {
        description: 'Error information if execution failed',
      },
      fields: [
        {
          name: 'message',
          type: 'text',
          label: 'Error Message',
        },
        {
          name: 'code',
          type: 'text',
          label: 'Error Code',
        },
        {
          name: 'stack',
          type: 'textarea',
          label: 'Stack Trace',
        },
        {
          name: 'details',
          type: 'json',
          label: 'Additional Details',
        },
      ],
    },
    {
      name: 'retryCount',
      type: 'number',
      label: 'Retry Count',
      defaultValue: 0,
      admin: {
        description: 'Number of retry attempts',
      },
    },
    {
      name: 'maxRetries',
      type: 'number',
      label: 'Max Retries',
      defaultValue: 3,
      admin: {
        description: 'Maximum retry attempts allowed',
      },
    },

    // ========== TOOL CALLS ==========
    {
      name: 'toolCalls',
      type: 'array',
      label: 'Tool Calls',
      admin: {
        description: 'All tool calls made during execution',
      },
      fields: [
        {
          name: 'toolName',
          type: 'text',
          label: 'Tool Name',
          required: true,
        },
        {
          name: 'input',
          type: 'json',
          label: 'Input',
        },
        {
          name: 'output',
          type: 'json',
          label: 'Output',
        },
        {
          name: 'executionTime',
          type: 'number',
          label: 'Execution Time (ms)',
        },
        {
          name: 'success',
          type: 'checkbox',
          label: 'Success',
          defaultValue: true,
        },
        {
          name: 'error',
          type: 'text',
          label: 'Error',
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
    },
  ],
  timestamps: true,
}
