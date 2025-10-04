import { CollectionConfig } from 'payload/types';

export const Scenes: CollectionConfig = {
  slug: 'scenes',
  admin: {
    useAsTitle: 'sceneNumber',
    description: 'Master collection for scene generation with comprehensive tracking',
    defaultColumns: ['sceneNumber', 'status', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    // ========== BASIC INFORMATION ==========
    {
      name: 'sceneNumber',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique scene identifier (e.g., "001", "002a", "003-alt")',
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Scene title or brief description',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Ready for Generation', value: 'ready' },
        { label: 'Generating', value: 'generating' },
        { label: 'Generated', value: 'generated' },
        { label: 'Verified', value: 'verified' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Revision Needed', value: 'revision' },
      ],
      admin: {
        description: 'Current workflow status of the scene',
      },
    },

    // ========== STORY CONTEXT ==========
    {
      name: 'act',
      type: 'number',
      admin: {
        description: 'Act number in the story structure',
      },
    },
    {
      name: 'sequence',
      type: 'text',
      admin: {
        description: 'Sequence identifier within the act',
      },
    },
    {
      name: 'storyBeat',
      type: 'textarea',
      admin: {
        description: 'Key story beat or plot point this scene represents',
      },
    },
    {
      name: 'emotionalTone',
      type: 'select',
      options: [
        { label: 'Joyful', value: 'joyful' },
        { label: 'Tense', value: 'tense' },
        { label: 'Melancholic', value: 'melancholic' },
        { label: 'Suspenseful', value: 'suspenseful' },
        { label: 'Action-packed', value: 'action' },
        { label: 'Comedic', value: 'comedic' },
        { label: 'Dramatic', value: 'dramatic' },
        { label: 'Mysterious', value: 'mysterious' },
        { label: 'Romantic', value: 'romantic' },
        { label: 'Horror', value: 'horror' },
      ],
      admin: {
        description: 'Emotional tone of the scene',
      },
    },
    {
      name: 'pacing',
      type: 'select',
      options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Fast', value: 'fast' },
        { label: 'Frenetic', value: 'frenetic' },
      ],
      admin: {
        description: 'Scene pacing',
      },
    },
    {
      name: 'narrativePurpose',
      type: 'textarea',
      admin: {
        description: 'What this scene accomplishes in the overall narrative',
      },
    },

    // ========== VISUAL COMPOSITION ==========
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'Scene location (e.g., "Aladdin\'s house", "Cave entrance")',
      },
    },
    {
      name: 'timeOfDay',
      type: 'select',
      options: [
        { label: 'Dawn', value: 'dawn' },
        { label: 'Morning', value: 'morning' },
        { label: 'Midday', value: 'midday' },
        { label: 'Afternoon', value: 'afternoon' },
        { label: 'Dusk', value: 'dusk' },
        { label: 'Evening', value: 'evening' },
        { label: 'Night', value: 'night' },
        { label: 'Midnight', value: 'midnight' },
      ],
      admin: {
        description: 'Time of day for the scene',
      },
    },
    {
      name: 'weather',
      type: 'select',
      options: [
        { label: 'Clear', value: 'clear' },
        { label: 'Cloudy', value: 'cloudy' },
        { label: 'Rainy', value: 'rainy' },
        { label: 'Stormy', value: 'stormy' },
        { label: 'Foggy', value: 'foggy' },
        { label: 'Snowy', value: 'snowy' },
        { label: 'Windy', value: 'windy' },
      ],
      admin: {
        description: 'Weather conditions',
      },
    },
    {
      name: 'environment',
      type: 'select',
      options: [
        { label: 'Interior', value: 'interior' },
        { label: 'Exterior', value: 'exterior' },
        { label: 'Interior/Exterior Mix', value: 'mixed' },
      ],
      admin: {
        description: 'Indoor or outdoor setting',
      },
    },
    {
      name: 'visualStyle',
      type: 'textarea',
      admin: {
        description: 'Overall visual style description (e.g., "Ghibli-inspired, vibrant colors")',
      },
    },
    {
      name: 'colorPalette',
      type: 'textarea',
      admin: {
        description: 'Key colors and color scheme for the scene',
      },
    },
    {
      name: 'composition',
      type: 'textarea',
      admin: {
        description: 'Scene composition and framing notes',
      },
    },
    {
      name: 'atmosphere',
      type: 'textarea',
      admin: {
        description: 'Atmospheric qualities (dust particles, mist, light rays, etc.)',
      },
    },

    // ========== CAMERA SETTINGS ==========
    {
      name: 'cameraAngle',
      type: 'select',
      options: [
        { label: 'Eye Level', value: 'eye-level' },
        { label: 'High Angle', value: 'high-angle' },
        { label: 'Low Angle', value: 'low-angle' },
        { label: 'Bird\'s Eye', value: 'birds-eye' },
        { label: 'Worm\'s Eye', value: 'worms-eye' },
        { label: 'Dutch Angle', value: 'dutch' },
        { label: 'Over Shoulder', value: 'over-shoulder' },
      ],
      admin: {
        description: 'Primary camera angle for the scene',
      },
    },
    {
      name: 'shotType',
      type: 'select',
      options: [
        { label: 'Wide Shot', value: 'wide' },
        { label: 'Full Shot', value: 'full' },
        { label: 'Medium Shot', value: 'medium' },
        { label: 'Close-Up', value: 'closeup' },
        { label: 'Extreme Close-Up', value: 'extreme-closeup' },
        { label: 'Two Shot', value: 'two-shot' },
        { label: 'Over-the-Shoulder', value: 'ots' },
        { label: 'POV', value: 'pov' },
      ],
      admin: {
        description: 'Shot type/framing',
      },
    },
    {
      name: 'cameraMovement',
      type: 'select',
      options: [
        { label: 'Static', value: 'static' },
        { label: 'Pan', value: 'pan' },
        { label: 'Tilt', value: 'tilt' },
        { label: 'Dolly In', value: 'dolly-in' },
        { label: 'Dolly Out', value: 'dolly-out' },
        { label: 'Tracking', value: 'tracking' },
        { label: 'Crane', value: 'crane' },
        { label: 'Zoom', value: 'zoom' },
        { label: 'Handheld', value: 'handheld' },
      ],
      admin: {
        description: 'Camera movement type',
      },
    },
    {
      name: 'focusPoint',
      type: 'text',
      admin: {
        description: 'Primary focus point in the frame',
      },
    },
    {
      name: 'depthOfField',
      type: 'select',
      options: [
        { label: 'Shallow', value: 'shallow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Deep', value: 'deep' },
      ],
      admin: {
        description: 'Depth of field setting',
      },
    },

    // ========== LIGHTING ==========
    {
      name: 'lightingSetup',
      type: 'select',
      options: [
        { label: 'Natural', value: 'natural' },
        { label: 'Studio', value: 'studio' },
        { label: 'Dramatic', value: 'dramatic' },
        { label: 'Soft', value: 'soft' },
        { label: 'Hard', value: 'hard' },
        { label: 'Mixed', value: 'mixed' },
      ],
      admin: {
        description: 'Primary lighting setup',
      },
    },
    {
      name: 'keyLightDirection',
      type: 'select',
      options: [
        { label: 'Front', value: 'front' },
        { label: 'Side', value: 'side' },
        { label: 'Back', value: 'back' },
        { label: 'Top', value: 'top' },
        { label: 'Bottom', value: 'bottom' },
      ],
      admin: {
        description: 'Direction of key light',
      },
    },
    {
      name: 'lightingMood',
      type: 'select',
      options: [
        { label: 'Bright', value: 'bright' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'Dark', value: 'dark' },
        { label: 'Moody', value: 'moody' },
        { label: 'Ethereal', value: 'ethereal' },
      ],
      admin: {
        description: 'Overall lighting mood',
      },
    },
    {
      name: 'shadows',
      type: 'select',
      options: [
        { label: 'Soft', value: 'soft' },
        { label: 'Hard', value: 'hard' },
        { label: 'Long', value: 'long' },
        { label: 'Minimal', value: 'minimal' },
      ],
      admin: {
        description: 'Shadow characteristics',
      },
    },
    {
      name: 'practicalLights',
      type: 'textarea',
      admin: {
        description: 'Practical lights in scene (candles, lamps, fire, etc.)',
      },
    },

    // ========== CHARACTERS ==========
    {
      name: 'characters',
      type: 'array',
      admin: {
        description: 'Characters present in this scene',
      },
      fields: [
        {
          name: 'characterName',
          type: 'text',
          required: true,
        },
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Background', value: 'background' },
          ],
        },
        {
          name: 'action',
          type: 'textarea',
          admin: {
            description: 'What this character is doing',
          },
        },
        {
          name: 'emotion',
          type: 'text',
          admin: {
            description: 'Character\'s emotional state',
          },
        },
        {
          name: 'position',
          type: 'text',
          admin: {
            description: 'Position in frame (foreground/midground/background, left/center/right)',
          },
        },
        {
          name: 'costumeNotes',
          type: 'textarea',
          admin: {
            description: 'Costume or appearance notes for this scene',
          },
        },
        {
          name: 'dialogue',
          type: 'textarea',
          admin: {
            description: 'Character dialogue in this scene',
          },
        },
      ],
    },

    // ========== PROPS & OBJECTS ==========
    {
      name: 'props',
      type: 'array',
      admin: {
        description: 'Props and objects in the scene',
      },
      fields: [
        {
          name: 'propName',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'importance',
          type: 'select',
          options: [
            { label: 'Critical', value: 'critical' },
            { label: 'Important', value: 'important' },
            { label: 'Background', value: 'background' },
          ],
        },
        {
          name: 'position',
          type: 'text',
        },
        {
          name: 'interaction',
          type: 'textarea',
          admin: {
            description: 'How characters interact with this prop',
          },
        },
      ],
    },

    // ========== AUDIO ==========
    {
      name: 'soundDesign',
      type: 'textarea',
      admin: {
        description: 'Sound effects and ambient audio notes',
      },
    },
    {
      name: 'musicCue',
      type: 'textarea',
      admin: {
        description: 'Music or score notes for the scene',
      },
    },
    {
      name: 'dialogue',
      type: 'textarea',
      admin: {
        description: 'Full dialogue for the scene',
      },
    },
    {
      name: 'voiceoverNarration',
      type: 'textarea',
      admin: {
        description: 'Voiceover or narration text',
      },
    },

    // ========== TRANSITIONS ==========
    {
      name: 'transitionIn',
      type: 'select',
      options: [
        { label: 'Cut', value: 'cut' },
        { label: 'Fade In', value: 'fade-in' },
        { label: 'Dissolve', value: 'dissolve' },
        { label: 'Wipe', value: 'wipe' },
        { label: 'Match Cut', value: 'match-cut' },
      ],
      admin: {
        description: 'Transition into this scene',
      },
    },
    {
      name: 'transitionOut',
      type: 'select',
      options: [
        { label: 'Cut', value: 'cut' },
        { label: 'Fade Out', value: 'fade-out' },
        { label: 'Dissolve', value: 'dissolve' },
        { label: 'Wipe', value: 'wipe' },
        { label: 'Match Cut', value: 'match-cut' },
      ],
      admin: {
        description: 'Transition out of this scene',
      },
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        description: 'Scene duration in seconds',
      },
    },

    // ========== GENERATION PROMPTS ==========
    {
      name: 'mainPrompt',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Main generation prompt for the scene',
      },
    },
    {
      name: 'negativePrompt',
      type: 'textarea',
      admin: {
        description: 'Negative prompt (things to avoid)',
      },
    },
    {
      name: 'stylePrompt',
      type: 'textarea',
      admin: {
        description: 'Additional style guidance',
      },
    },
    {
      name: 'technicalPrompt',
      type: 'textarea',
      admin: {
        description: 'Technical parameters (resolution, aspect ratio, etc.)',
      },
    },
    {
      name: 'referencePrompts',
      type: 'array',
      admin: {
        description: 'Reference prompts from templates',
      },
      fields: [
        {
          name: 'category',
          type: 'text',
        },
        {
          name: 'promptText',
          type: 'textarea',
        },
        {
          name: 'weight',
          type: 'number',
          admin: {
            description: 'Prompt weight/importance (0-1)',
          },
        },
      ],
    },

    // ========== GENERATION PARAMETERS ==========
    {
      name: 'generationModel',
      type: 'select',
      options: [
        { label: 'Runway Gen-3 Alpha', value: 'runway-gen3-alpha' },
        { label: 'Runway Gen-3 Turbo', value: 'runway-gen3-turbo' },
        { label: 'Luma Dream Machine', value: 'luma-dream' },
        { label: 'Pika 1.0', value: 'pika-1' },
        { label: 'Custom', value: 'custom' },
      ],
      admin: {
        description: 'AI model used for generation',
      },
    },
    {
      name: 'seed',
      type: 'number',
      admin: {
        description: 'Generation seed for reproducibility',
      },
    },
    {
      name: 'steps',
      type: 'number',
      admin: {
        description: 'Number of generation steps',
      },
    },
    {
      name: 'cfgScale',
      type: 'number',
      admin: {
        description: 'CFG scale value',
      },
    },
    {
      name: 'aspectRatio',
      type: 'select',
      options: [
        { label: '16:9', value: '16:9' },
        { label: '9:16', value: '9:16' },
        { label: '1:1', value: '1:1' },
        { label: '4:3', value: '4:3' },
        { label: '21:9', value: '21:9' },
      ],
      admin: {
        description: 'Video aspect ratio',
      },
    },
    {
      name: 'resolution',
      type: 'select',
      options: [
        { label: '1920x1080 (Full HD)', value: '1920x1080' },
        { label: '1280x720 (HD)', value: '1280x720' },
        { label: '3840x2160 (4K)', value: '3840x2160' },
        { label: 'Custom', value: 'custom' },
      ],
      admin: {
        description: 'Output resolution',
      },
    },
    {
      name: 'fps',
      type: 'number',
      defaultValue: 24,
      admin: {
        description: 'Frames per second',
      },
    },

    // ========== COMPOSITE ITERATIONS ==========
    {
      name: 'iterations',
      type: 'array',
      admin: {
        description: 'Track multiple generation attempts and composites',
      },
      fields: [
        {
          name: 'iterationNumber',
          type: 'number',
          required: true,
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'outputUrl',
          type: 'text',
          admin: {
            description: 'URL to generated video/image',
          },
        },
        {
          name: 'compositeType',
          type: 'select',
          options: [
            { label: 'Full Scene', value: 'full' },
            { label: 'Character Only', value: 'character' },
            { label: 'Background Only', value: 'background' },
            { label: 'Layered Composite', value: 'layered' },
          ],
        },
        {
          name: 'layers',
          type: 'array',
          admin: {
            description: 'Individual layers in composite',
          },
          fields: [
            {
              name: 'layerName',
              type: 'text',
            },
            {
              name: 'layerUrl',
              type: 'text',
            },
            {
              name: 'blendMode',
              type: 'text',
            },
            {
              name: 'opacity',
              type: 'number',
            },
          ],
        },
        {
          name: 'qualityScore',
          type: 'number',
          admin: {
            description: 'Quality score (0-10)',
          },
        },
        {
          name: 'notes',
          type: 'textarea',
        },
        {
          name: 'selected',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Mark as selected final version',
          },
        },
      ],
    },

    // ========== VERIFICATION & QUALITY ==========
    {
      name: 'verificationResults',
      type: 'group',
      admin: {
        description: 'AI verification results',
      },
      fields: [
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'verifiedAt',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'consistencyScore',
          type: 'number',
          admin: {
            description: 'Character consistency score (0-10)',
          },
        },
        {
          name: 'qualityScore',
          type: 'number',
          admin: {
            description: 'Overall quality score (0-10)',
          },
        },
        {
          name: 'storyAlignmentScore',
          type: 'number',
          admin: {
            description: 'Story bible alignment score (0-10)',
          },
        },
        {
          name: 'issues',
          type: 'array',
          fields: [
            {
              name: 'issueType',
              type: 'select',
              options: [
                { label: 'Character Inconsistency', value: 'character-inconsistency' },
                { label: 'Quality Issue', value: 'quality' },
                { label: 'Story Mismatch', value: 'story-mismatch' },
                { label: 'Technical Problem', value: 'technical' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
            },
            {
              name: 'severity',
              type: 'select',
              options: [
                { label: 'Critical', value: 'critical' },
                { label: 'Major', value: 'major' },
                { label: 'Minor', value: 'minor' },
              ],
            },
            {
              name: 'resolved',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
        {
          name: 'aiAnalysis',
          type: 'textarea',
          admin: {
            description: 'Detailed AI analysis of the scene',
          },
        },
      ],
    },

    // ========== AGENT DECISIONS ==========
    {
      name: 'agentDecisions',
      type: 'array',
      admin: {
        description: 'AI agent decisions and reasoning',
      },
      fields: [
        {
          name: 'agentName',
          type: 'text',
          admin: {
            description: 'Name of the AI agent',
          },
        },
        {
          name: 'timestamp',
          type: 'date',
          admin: {
            hasTime: true,
          },
        },
        {
          name: 'decisionType',
          type: 'select',
          options: [
            { label: 'Prompt Adjustment', value: 'prompt' },
            { label: 'Parameter Change', value: 'parameter' },
            { label: 'Regeneration', value: 'regeneration' },
            { label: 'Composite Strategy', value: 'composite' },
            { label: 'Quality Assessment', value: 'quality' },
          ],
        },
        {
          name: 'reasoning',
          type: 'textarea',
          admin: {
            description: 'Agent\'s reasoning for the decision',
          },
        },
        {
          name: 'action',
          type: 'textarea',
          admin: {
            description: 'Action taken',
          },
        },
        {
          name: 'result',
          type: 'textarea',
          admin: {
            description: 'Result of the action',
          },
        },
      ],
    },

    // ========== METADATA & TRACKING ==========
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Scene version number',
      },
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Tags for organization and search',
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
        description: 'General notes and comments',
      },
    },
    {
      name: 'productionNotes',
      type: 'textarea',
      admin: {
        description: 'Production-specific notes',
      },
    },
    {
      name: 'revisionHistory',
      type: 'array',
      admin: {
        description: 'Track revisions and changes',
      },
      fields: [
        {
          name: 'revisionDate',
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
          name: 'changes',
          type: 'textarea',
        },
        {
          name: 'reason',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'approvedBy',
      type: 'text',
      admin: {
        description: 'Who approved this scene',
      },
    },
    {
      name: 'approvedAt',
      type: 'date',
      admin: {
        hasTime: true,
        description: 'When the scene was approved',
      },
    },
    {
      name: 'finalOutputUrl',
      type: 'text',
      admin: {
        description: 'URL to final approved output',
      },
    },
    {
      name: 'renderTime',
      type: 'number',
      admin: {
        description: 'Total render time in seconds',
      },
    },
    {
      name: 'costEstimate',
      type: 'number',
      admin: {
        description: 'Estimated generation cost',
      },
    },
  ],
  timestamps: true,
};

export default Scenes;
