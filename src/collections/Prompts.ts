import { CollectionConfig } from 'payload/types';

export const Prompts: CollectionConfig = {
  slug: 'prompts',
  admin: {
    useAsTitle: 'name',
    description: 'Reusable prompt templates with variable replacement',
    defaultColumns: ['name', 'category', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Template name (e.g., "Character Close-up", "Wide Establishing Shot")',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Character', value: 'character' },
        { label: 'Scene', value: 'scene' },
        { label: 'Location', value: 'location' },
        { label: 'Props', value: 'props' },
        { label: 'Video Generation', value: 'video' },
        { label: 'Lighting', value: 'lighting' },
        { label: 'Camera', value: 'camera' },
        { label: 'Style', value: 'style' },
        { label: 'Effects', value: 'effects' },
        { label: 'Transition', value: 'transition' },
      ],
      admin: {
        description: 'Prompt category for organization',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Description of what this prompt template does',
      },
    },
    {
      name: 'promptTemplate',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Prompt template with variables like {{character}}, {{location}}, {{action}}',
      },
    },
    {
      name: 'variables',
      type: 'array',
      admin: {
        description: 'Available variables for this template',
      },
      fields: [
        {
          name: 'variableName',
          type: 'text',
          required: true,
          admin: {
            description: 'Variable name (without curly braces, e.g., "character")',
          },
        },
        {
          name: 'description',
          type: 'text',
          admin: {
            description: 'What this variable represents',
          },
        },
        {
          name: 'defaultValue',
          type: 'text',
          admin: {
            description: 'Optional default value if not provided',
          },
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Is this variable required?',
          },
        },
        {
          name: 'example',
          type: 'text',
          admin: {
            description: 'Example value for this variable',
          },
        },
      ],
    },
    {
      name: 'examples',
      type: 'array',
      admin: {
        description: 'Example outputs with filled variables',
      },
      fields: [
        {
          name: 'exampleName',
          type: 'text',
        },
        {
          name: 'variableValues',
          type: 'json',
          admin: {
            description: 'JSON object with variable values',
          },
        },
        {
          name: 'output',
          type: 'textarea',
          admin: {
            description: 'Resulting prompt after variable replacement',
          },
        },
      ],
    },
    {
      name: 'negativePrompt',
      type: 'textarea',
      admin: {
        description: 'Default negative prompt for this template',
      },
    },
    {
      name: 'styleModifiers',
      type: 'array',
      admin: {
        description: 'Optional style modifiers that can be added',
      },
      fields: [
        {
          name: 'modifier',
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Tags for searching and filtering',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'weight',
      type: 'number',
      admin: {
        description: 'Default prompt weight/importance (0-1)',
      },
    },
    {
      name: 'modelSpecific',
      type: 'group',
      admin: {
        description: 'Model-specific variations',
      },
      fields: [
        {
          name: 'runwayGen3',
          type: 'textarea',
          admin: {
            description: 'Runway Gen-3 optimized version',
          },
        },
        {
          name: 'lumaDream',
          type: 'textarea',
          admin: {
            description: 'Luma Dream Machine optimized version',
          },
        },
        {
          name: 'pika',
          type: 'textarea',
          admin: {
            description: 'Pika optimized version',
          },
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Is this template active and available?',
      },
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'How many times this template has been used',
        readOnly: true,
      },
    },
    {
      name: 'lastUsedAt',
      type: 'date',
      admin: {
        hasTime: true,
        description: 'When this template was last used',
        readOnly: true,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this template',
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Validate that variables in template match defined variables
        if (data.promptTemplate && data.variables) {
          const templateVars = (data.promptTemplate.match(/\{\{(\w+)\}\}/g) || [])
            .map((v: string) => v.replace(/\{\{|\}\}/g, ''));
          const definedVars = data.variables.map((v: { variableName: string }) => v.variableName);

          // This is just a validation helper - in production you'd want to throw errors
          // if there are undefined variables used in the template
          console.log('Template variables:', templateVars);
          console.log('Defined variables:', definedVars);
        }
        return data;
      },
    ],
  },
};

export default Prompts;
