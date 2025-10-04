import { CollectionConfig } from 'payload/types';

export const CharacterReferences: CollectionConfig = {
  slug: 'character-references',
  admin: {
    useAsTitle: 'characterName',
    description: '360° character reference sheets with multiple angle tracking',
    defaultColumns: ['characterName', 'status', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'characterName',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Character name (e.g., "Aladdin", "Jasmine", "Genie")',
      },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Protagonist', value: 'protagonist' },
        { label: 'Antagonist', value: 'antagonist' },
        { label: 'Supporting', value: 'supporting' },
        { label: 'Minor', value: 'minor' },
        { label: 'Background', value: 'background' },
      ],
      admin: {
        description: 'Character role in the story',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'in-progress',
      options: [
        { label: 'Planning', value: 'planning' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Complete', value: 'complete' },
        { label: 'Approved', value: 'approved' },
      ],
      admin: {
        description: 'Reference sheet status',
      },
    },

    // ========== GENERAL DESCRIPTION ==========
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Overall character description',
      },
    },
    {
      name: 'personality',
      type: 'textarea',
      admin: {
        description: 'Character personality traits',
      },
    },
    {
      name: 'backstory',
      type: 'textarea',
      admin: {
        description: 'Character backstory summary',
      },
    },

    // ========== MASTER REFERENCE ==========
    {
      name: 'masterReferenceUrl',
      type: 'text',
      admin: {
        description: 'URL to the primary/master reference image',
      },
    },
    {
      name: 'masterDescription',
      type: 'textarea',
      admin: {
        description: 'Description of the master reference',
      },
    },

    // ========== 360° ANGLE REFERENCES ==========
    {
      name: 'frontView',
      type: 'group',
      admin: {
        description: 'Front-facing reference',
      },
      fields: [
        {
          name: 'imageUrl',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Description of front view specifics',
          },
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'prompt',
          type: 'textarea',
          admin: {
            description: 'Prompt used to generate this view',
          },
        },
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'backView',
      type: 'group',
      admin: {
        description: 'Back-facing reference',
      },
      fields: [
        {
          name: 'imageUrl',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Description of back view specifics',
          },
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'prompt',
          type: 'textarea',
          admin: {
            description: 'Prompt used to generate this view',
          },
        },
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'leftSideView',
      type: 'group',
      admin: {
        description: 'Left side profile reference',
      },
      fields: [
        {
          name: 'imageUrl',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Description of left side view specifics',
          },
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'prompt',
          type: 'textarea',
          admin: {
            description: 'Prompt used to generate this view',
          },
        },
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'rightSideView',
      type: 'group',
      admin: {
        description: 'Right side profile reference',
      },
      fields: [
        {
          name: 'imageUrl',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Description of right side view specifics',
          },
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'prompt',
          type: 'textarea',
          admin: {
            description: 'Prompt used to generate this view',
          },
        },
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'threeFourthsFrontLeft',
      type: 'group',
      admin: {
        description: '3/4 front-left view reference',
      },
      fields: [
        {
          name: 'imageUrl',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Description of 3/4 front-left view specifics',
          },
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'prompt',
          type: 'textarea',
          admin: {
            description: 'Prompt used to generate this view',
          },
        },
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'threeFourthsFrontRight',
      type: 'group',
      admin: {
        description: '3/4 front-right view reference',
      },
      fields: [
        {
          name: 'imageUrl',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Description of 3/4 front-right view specifics',
          },
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'prompt',
          type: 'textarea',
          admin: {
            description: 'Prompt used to generate this view',
          },
        },
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'threeFourthsBackLeft',
      type: 'group',
      admin: {
        description: '3/4 back-left view reference',
      },
      fields: [
        {
          name: 'imageUrl',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Description of 3/4 back-left view specifics',
          },
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'prompt',
          type: 'textarea',
          admin: {
            description: 'Prompt used to generate this view',
          },
        },
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'threeFourthsBackRight',
      type: 'group',
      admin: {
        description: '3/4 back-right view reference',
      },
      fields: [
        {
          name: 'imageUrl',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Description of 3/4 back-right view specifics',
          },
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'prompt',
          type: 'textarea',
          admin: {
            description: 'Prompt used to generate this view',
          },
        },
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },

    // ========== ADDITIONAL ANGLES ==========
    {
      name: 'additionalAngles',
      type: 'array',
      admin: {
        description: 'Any additional custom angle references',
      },
      fields: [
        {
          name: 'angleName',
          type: 'text',
          required: true,
          admin: {
            description: 'Name of the angle (e.g., "Top-down", "Close-up face")',
          },
        },
        {
          name: 'imageUrl',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'prompt',
          type: 'textarea',
        },
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },

    // ========== PHYSICAL ATTRIBUTES ==========
    {
      name: 'physicalAttributes',
      type: 'group',
      admin: {
        description: 'Detailed physical characteristics',
      },
      fields: [
        {
          name: 'height',
          type: 'text',
        },
        {
          name: 'build',
          type: 'text',
        },
        {
          name: 'skinTone',
          type: 'text',
        },
        {
          name: 'hairColor',
          type: 'text',
        },
        {
          name: 'hairStyle',
          type: 'textarea',
        },
        {
          name: 'eyeColor',
          type: 'text',
        },
        {
          name: 'facialFeatures',
          type: 'textarea',
          admin: {
            description: 'Notable facial features',
          },
        },
        {
          name: 'distinctiveMarks',
          type: 'textarea',
          admin: {
            description: 'Scars, tattoos, birthmarks, etc.',
          },
        },
        {
          name: 'age',
          type: 'text',
        },
        {
          name: 'gender',
          type: 'text',
        },
      ],
    },

    // ========== COSTUME & APPEARANCE ==========
    {
      name: 'costumes',
      type: 'array',
      admin: {
        description: 'Different costume variations',
      },
      fields: [
        {
          name: 'costumeName',
          type: 'text',
          required: true,
          admin: {
            description: 'Costume name (e.g., "Street clothes", "Royal attire")',
          },
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'referenceUrl',
          type: 'text',
        },
        {
          name: 'colors',
          type: 'text',
        },
        {
          name: 'accessories',
          type: 'textarea',
          admin: {
            description: 'Accessories worn with this costume',
          },
        },
        {
          name: 'scenesUsed',
          type: 'textarea',
          admin: {
            description: 'Which scenes use this costume',
          },
        },
      ],
    },

    // ========== EXPRESSIONS & EMOTIONS ==========
    {
      name: 'expressions',
      type: 'array',
      admin: {
        description: 'Reference for different facial expressions',
      },
      fields: [
        {
          name: 'emotion',
          type: 'select',
          options: [
            { label: 'Happy', value: 'happy' },
            { label: 'Sad', value: 'sad' },
            { label: 'Angry', value: 'angry' },
            { label: 'Surprised', value: 'surprised' },
            { label: 'Fearful', value: 'fearful' },
            { label: 'Disgusted', value: 'disgusted' },
            { label: 'Neutral', value: 'neutral' },
            { label: 'Determined', value: 'determined' },
            { label: 'Confused', value: 'confused' },
            { label: 'Loving', value: 'loving' },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'referenceUrl',
          type: 'text',
        },
        {
          name: 'notes',
          type: 'textarea',
        },
      ],
    },

    // ========== POSES & ACTIONS ==========
    {
      name: 'poses',
      type: 'array',
      admin: {
        description: 'Common poses and action references',
      },
      fields: [
        {
          name: 'poseName',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'referenceUrl',
          type: 'text',
        },
        {
          name: 'bodyLanguage',
          type: 'textarea',
          admin: {
            description: 'Body language notes for this pose',
          },
        },
      ],
    },

    // ========== COLOR & STYLE GUIDE ==========
    {
      name: 'colorGuide',
      type: 'group',
      admin: {
        description: 'Color palette and styling guide',
      },
      fields: [
        {
          name: 'primaryColors',
          type: 'text',
          admin: {
            description: 'Primary colors for this character',
          },
        },
        {
          name: 'secondaryColors',
          type: 'text',
          admin: {
            description: 'Secondary/accent colors',
          },
        },
        {
          name: 'colorNotes',
          type: 'textarea',
          admin: {
            description: 'Color usage notes and guidelines',
          },
        },
        {
          name: 'styleNotes',
          type: 'textarea',
          admin: {
            description: 'General style notes for the character',
          },
        },
      ],
    },

    // ========== CONSISTENCY TRACKING ==========
    {
      name: 'consistencyChecks',
      type: 'array',
      admin: {
        description: 'Track consistency across generations',
      },
      fields: [
        {
          name: 'checkDate',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'sceneNumber',
          type: 'text',
        },
        {
          name: 'consistencyScore',
          type: 'number',
          admin: {
            description: 'Consistency score (0-10)',
          },
        },
        {
          name: 'issues',
          type: 'textarea',
          admin: {
            description: 'Any consistency issues found',
          },
        },
        {
          name: 'resolved',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },

    // ========== METADATA ==========
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Tags for organization',
      },
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
      admin: {
        description: 'General notes about this character reference',
      },
    },
    {
      name: 'approvedBy',
      type: 'text',
      admin: {
        description: 'Who approved this reference sheet',
      },
    },
    {
      name: 'approvedAt',
      type: 'date',
      admin: {
        hasTime: true,
        description: 'When approved',
      },
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Reference sheet version',
      },
    },
  ],
  timestamps: true,
};

export default CharacterReferences;
