import { CollectionConfig } from 'payload/types';

export const StoryBible: CollectionConfig = {
  slug: 'story-bible',
  admin: {
    useAsTitle: 'title',
    description: 'Master story bible for narrative consistency',
    defaultColumns: ['title', 'version', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Story title (e.g., "Aladdin - 2025 Production")',
      },
    },
    {
      name: 'version',
      type: 'text',
      defaultValue: '1.0',
      admin: {
        description: 'Story bible version',
      },
    },
    {
      name: 'synopsis',
      type: 'textarea',
      admin: {
        description: 'Overall story synopsis',
      },
    },

    // ========== WORLD RULES ==========
    {
      name: 'worldRules',
      type: 'array',
      admin: {
        description: 'Rules governing the story world',
      },
      fields: [
        {
          name: 'ruleName',
          type: 'text',
          required: true,
          admin: {
            description: 'Rule name (e.g., "Magic System", "Geography")',
          },
        },
        {
          name: 'category',
          type: 'select',
          options: [
            { label: 'Magic/Powers', value: 'magic' },
            { label: 'Technology', value: 'technology' },
            { label: 'Geography', value: 'geography' },
            { label: 'Society/Culture', value: 'society' },
            { label: 'Physics/Natural Laws', value: 'physics' },
            { label: 'History', value: 'history' },
            { label: 'Politics', value: 'politics' },
            { label: 'Economy', value: 'economy' },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          admin: {
            description: 'Detailed description of this rule',
          },
        },
        {
          name: 'constraints',
          type: 'textarea',
          admin: {
            description: 'Limitations or constraints of this rule',
          },
        },
        {
          name: 'examples',
          type: 'textarea',
          admin: {
            description: 'Examples of this rule in action',
          },
        },
        {
          name: 'priority',
          type: 'select',
          defaultValue: 'medium',
          options: [
            { label: 'Critical', value: 'critical' },
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ],
          admin: {
            description: 'How strictly this rule must be followed',
          },
        },
      ],
    },

    // ========== CHARACTER RELATIONSHIPS ==========
    {
      name: 'characterRelationships',
      type: 'json',
      admin: {
        description: 'Character relationship graph in JSON format',
      },
    },
    {
      name: 'relationshipDetails',
      type: 'array',
      admin: {
        description: 'Detailed character relationships',
      },
      fields: [
        {
          name: 'character1',
          type: 'text',
          required: true,
        },
        {
          name: 'character2',
          type: 'text',
          required: true,
        },
        {
          name: 'relationshipType',
          type: 'select',
          options: [
            { label: 'Family', value: 'family' },
            { label: 'Friend', value: 'friend' },
            { label: 'Romantic', value: 'romantic' },
            { label: 'Enemy', value: 'enemy' },
            { label: 'Rival', value: 'rival' },
            { label: 'Mentor/Student', value: 'mentor' },
            { label: 'Professional', value: 'professional' },
            { label: 'Acquaintance', value: 'acquaintance' },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Description of their relationship',
          },
        },
        {
          name: 'dynamicStatus',
          type: 'select',
          options: [
            { label: 'Static', value: 'static' },
            { label: 'Improving', value: 'improving' },
            { label: 'Deteriorating', value: 'deteriorating' },
            { label: 'Complex', value: 'complex' },
          ],
          admin: {
            description: 'How this relationship evolves',
          },
        },
        {
          name: 'keyMoments',
          type: 'textarea',
          admin: {
            description: 'Key moments that define this relationship',
          },
        },
      ],
    },

    // ========== TIMELINE ==========
    {
      name: 'timeline',
      type: 'array',
      admin: {
        description: 'Story timeline and key events',
      },
      fields: [
        {
          name: 'eventName',
          type: 'text',
          required: true,
        },
        {
          name: 'timestamp',
          type: 'text',
          admin: {
            description: 'When this event occurs (can be relative or absolute)',
          },
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'participants',
          type: 'array',
          fields: [
            {
              name: 'character',
              type: 'text',
            },
          ],
        },
        {
          name: 'location',
          type: 'text',
        },
        {
          name: 'importance',
          type: 'select',
          options: [
            { label: 'Critical Plot Point', value: 'critical' },
            { label: 'Major Event', value: 'major' },
            { label: 'Minor Event', value: 'minor' },
            { label: 'Background', value: 'background' },
          ],
        },
        {
          name: 'consequences',
          type: 'textarea',
          admin: {
            description: 'Consequences and ripple effects of this event',
          },
        },
      ],
    },

    // ========== CONSISTENCY RULES ==========
    {
      name: 'consistencyRules',
      type: 'array',
      admin: {
        description: 'Rules for maintaining visual and narrative consistency',
      },
      fields: [
        {
          name: 'ruleName',
          type: 'text',
          required: true,
        },
        {
          name: 'category',
          type: 'select',
          options: [
            { label: 'Character Appearance', value: 'character-appearance' },
            { label: 'Location Design', value: 'location' },
            { label: 'Props/Objects', value: 'props' },
            { label: 'Visual Style', value: 'visual-style' },
            { label: 'Narrative Logic', value: 'narrative' },
            { label: 'Technical', value: 'technical' },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
        {
          name: 'enforcement',
          type: 'select',
          defaultValue: 'strict',
          options: [
            { label: 'Strict (Must Follow)', value: 'strict' },
            { label: 'Recommended', value: 'recommended' },
            { label: 'Guideline', value: 'guideline' },
            { label: 'Flexible', value: 'flexible' },
          ],
        },
        {
          name: 'priority',
          type: 'number',
          defaultValue: 5,
          admin: {
            description: 'Priority level (1-10, higher is more important)',
          },
        },
        {
          name: 'checkpoints',
          type: 'textarea',
          admin: {
            description: 'How to verify this rule is followed',
          },
        },
        {
          name: 'exceptions',
          type: 'textarea',
          admin: {
            description: 'Documented exceptions to this rule',
          },
        },
      ],
    },

    // ========== LOCATION CATALOG ==========
    {
      name: 'locations',
      type: 'array',
      admin: {
        description: 'Catalog of story locations',
      },
      fields: [
        {
          name: 'locationName',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
        {
          name: 'visualReference',
          type: 'text',
          admin: {
            description: 'URL to visual reference or concept art',
          },
        },
        {
          name: 'atmosphere',
          type: 'textarea',
          admin: {
            description: 'Mood and atmosphere of this location',
          },
        },
        {
          name: 'keyFeatures',
          type: 'array',
          fields: [
            {
              name: 'feature',
              type: 'text',
            },
            {
              name: 'description',
              type: 'textarea',
            },
          ],
        },
        {
          name: 'timeOfDayVariations',
          type: 'textarea',
          admin: {
            description: 'How this location appears at different times',
          },
        },
        {
          name: 'connectedLocations',
          type: 'array',
          admin: {
            description: 'Locations connected to this one',
          },
          fields: [
            {
              name: 'locationName',
              type: 'text',
            },
            {
              name: 'connectionType',
              type: 'text',
              admin: {
                description: 'How they connect (door, path, view, etc.)',
              },
            },
          ],
        },
      ],
    },

    // ========== THEMES & MOTIFS ==========
    {
      name: 'themes',
      type: 'array',
      admin: {
        description: 'Story themes and motifs',
      },
      fields: [
        {
          name: 'theme',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'visualMotifs',
          type: 'textarea',
          admin: {
            description: 'Visual elements that represent this theme',
          },
        },
        {
          name: 'colorAssociations',
          type: 'text',
          admin: {
            description: 'Colors associated with this theme',
          },
        },
        {
          name: 'sceneReferences',
          type: 'array',
          admin: {
            description: 'Scenes where this theme appears',
          },
          fields: [
            {
              name: 'sceneNumber',
              type: 'text',
            },
            {
              name: 'howThemeAppears',
              type: 'textarea',
            },
          ],
        },
      ],
    },

    // ========== VISUAL STYLE GUIDE ==========
    {
      name: 'visualStyleGuide',
      type: 'group',
      admin: {
        description: 'Overall visual style guidelines',
      },
      fields: [
        {
          name: 'primaryStyle',
          type: 'textarea',
          admin: {
            description: 'Primary visual style description',
          },
        },
        {
          name: 'colorPalette',
          type: 'textarea',
          admin: {
            description: 'Master color palette for the story',
          },
        },
        {
          name: 'artDirection',
          type: 'textarea',
          admin: {
            description: 'Art direction notes',
          },
        },
        {
          name: 'influences',
          type: 'textarea',
          admin: {
            description: 'Visual influences and references',
          },
        },
        {
          name: 'prohibitedElements',
          type: 'textarea',
          admin: {
            description: 'Visual elements to avoid',
          },
        },
      ],
    },

    // ========== METADATA ==========
    {
      name: 'lastReviewedBy',
      type: 'text',
      admin: {
        description: 'Who last reviewed this story bible',
      },
    },
    {
      name: 'lastReviewedAt',
      type: 'date',
      admin: {
        hasTime: true,
        description: 'When this was last reviewed',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'General notes and updates',
      },
    },
    {
      name: 'changeLog',
      type: 'array',
      admin: {
        description: 'Track changes to the story bible',
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'changedBy',
          type: 'text',
        },
        {
          name: 'section',
          type: 'text',
          admin: {
            description: 'Which section was changed',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'What was changed',
          },
        },
        {
          name: 'reason',
          type: 'textarea',
          admin: {
            description: 'Why the change was made',
          },
        },
      ],
    },
  ],
  timestamps: true,
};

export default StoryBible;
