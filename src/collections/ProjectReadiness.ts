import type { CollectionConfig } from 'payload'

/**
 * ProjectReadiness Collection
 *
 * Tracks department-level readiness evaluations for projects.
 * Each record represents one department's evaluation results.
 *
 * @see {@link /docs/idea/pages/project-readiness.md} for complete specification
 */
export const ProjectReadiness: CollectionConfig = {
  slug: 'project-readiness',
  admin: {
    useAsTitle: 'departmentId',
    defaultColumns: ['projectId', 'departmentId', 'status', 'rating', 'lastEvaluatedAt'],
    description: 'Department readiness evaluations for production pipeline',
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
      name: 'projectId',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      label: 'Project',
      admin: {
        description: 'Project this evaluation belongs to',
      },
    },
    {
      name: 'departmentId',
      type: 'relationship',
      relationTo: 'departments',
      required: true,
      label: 'Department',
      admin: {
        description: 'Department being evaluated',
      },
    },

    // ========== EVALUATION RESULTS ==========
    {
      name: 'evaluationResult',
      type: 'textarea',
      label: 'Full Evaluation Result',
      admin: {
        description: 'Complete evaluation text from AI',
      },
    },
    {
      name: 'evaluationSummary',
      type: 'text',
      label: 'Evaluation Summary',
      admin: {
        description: '~200 character summary of evaluation',
      },
    },
    {
      name: 'rating',
      type: 'number',
      label: 'Department Rating',
      min: 0,
      max: 100,
      admin: {
        description: 'Quality score (0-100) for this department',
      },
    },
    {
      name: 'readinessScore',
      type: 'number',
      label: 'Project Readiness Score',
      min: 0,
      max: 100,
      admin: {
        description: 'Overall project readiness score (0-100)',
      },
    },

    // ========== STATUS TRACKING ==========
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
      label: 'Evaluation Status',
      admin: {
        description: 'Current status of this evaluation',
      },
    },

    // ========== TASK SERVICE INTEGRATION ==========
    {
      name: 'taskId',
      type: 'text',
      label: 'Task Service ID',
      admin: {
        description: 'tasks.ft.tc task ID for this evaluation',
      },
    },
    {
      name: 'taskStatus',
      type: 'text',
      label: 'Task Status',
      admin: {
        description: 'Current status from task service',
      },
    },

    // ========== METADATA ==========
    {
      name: 'evaluationDuration',
      type: 'number',
      label: 'Evaluation Duration (seconds)',
      admin: {
        description: 'How long the evaluation took to complete',
      },
    },
    {
      name: 'agentModel',
      type: 'text',
      label: 'AI Model Used',
      admin: {
        description: 'Model used for evaluation (e.g., "anthropic/claude-sonnet-4.5")',
      },
    },
    {
      name: 'gatherDataCount',
      type: 'number',
      label: 'Gather Items Processed',
      admin: {
        description: 'Number of gather items included in evaluation',
      },
    },
    {
      name: 'iterationCount',
      type: 'number',
      label: 'Processing Iterations',
      admin: {
        description: 'Number of AI processing iterations used',
      },
    },

    // ========== ISSUES & RECOMMENDATIONS ==========
    {
      name: 'issues',
      type: 'array',
      label: 'Identified Issues',
      admin: {
        description: 'Issues found during evaluation',
      },
      fields: [
        {
          name: 'issue',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'suggestions',
      type: 'array',
      label: 'Improvement Suggestions',
      admin: {
        description: 'Suggestions for improvement',
      },
      fields: [
        {
          name: 'suggestion',
          type: 'text',
          required: true,
        },
      ],
    },

    // ========== TIMESTAMPS ==========
    {
      name: 'lastEvaluatedAt',
      type: 'date',
      label: 'Last Evaluated At',
      admin: {
        description: 'When this department was last evaluated',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  timestamps: true,
}
