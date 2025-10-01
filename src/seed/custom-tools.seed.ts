/**
 * Custom Tools Seed Data
 *
 * Creates reusable custom tools for AI agents:
 * - Character consistency checker
 * - Plot structure validator
 * - Dialogue authenticity analyzer
 * - Visual style guide generator
 * - Scene pacing calculator
 * - Character relationship mapper
 * - Theme consistency tracker
 * - Quality assessment tool
 * - Content retrieval tools
 * - Validation utilities
 *
 * @module seed/custom-tools
 */

import type { Payload } from 'payload'

/**
 * Custom tools seed data with complete implementation
 */
export const customToolsSeedData = [
  // ========== CHARACTER TOOLS ==========
  {
    toolName: 'fetch-character-profile',
    displayName: 'Fetch Character Profile',
    description:
      'Retrieves complete character profile including personality, background, traits, and development arc. Essential for maintaining character consistency.',
    category: 'data-retrieval',
    inputSchema: {
      type: 'object',
      properties: {
        characterId: {
          type: 'string',
          description: 'Character ID or name to fetch',
        },
        includeRelationships: {
          type: 'boolean',
          description: 'Include character relationships',
          default: true,
        },
      },
      required: ['characterId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        profile: { type: 'object' },
        arc: { type: 'object' },
        relationships: { type: 'array' },
        continuityNotes: { type: 'array' },
      },
    },
    executeFunction: `async ({ characterId, includeRelationships = true }, { payload }) => {
  // Fetch character from database
  const character = await payload.findByID({
    collection: 'characters',
    id: characterId,
  });

  if (!character) {
    throw new Error(\`Character \${characterId} not found\`);
  }

  const result = {
    profile: {
      name: character.name,
      age: character.age,
      personality: character.personality,
      background: character.background,
      traits: character.traits,
    },
    arc: character.developmentArc,
    continuityNotes: character.continuityNotes || [],
  };

  if (includeRelationships) {
    result.relationships = character.relationships || [];
  }

  return result;
}`,
    setupCode: `// No setup required - uses PayloadCMS directly`,
    isGlobal: false,
    isActive: true,
    version: '1.0.0',
    exampleInputs: [
      {
        example: {
          characterId: 'char-001',
          includeRelationships: true,
        },
      },
    ],
    testCases: [
      {
        name: 'Fetch existing character',
        input: {
          characterId: 'char-001',
          includeRelationships: true,
        },
        shouldFail: false,
      },
    ],
    performanceMetrics: {
      totalCalls: 450,
      successfulCalls: 438,
      failedCalls: 12,
      averageExecutionTime: 120,
    },
    documentation: {
      usage: 'Use this tool whenever you need character information to maintain consistency in dialogue, actions, or development.',
      examples: 'await fetchCharacterProfile({ characterId: "protagonist-001", includeRelationships: true })',
      limitations: 'Character must exist in database. Does not create or modify characters.',
    },
    tags: [{ tag: 'character' }, { tag: 'data-retrieval' }, { tag: 'consistency' }],
  },
  {
    toolName: 'check-character-consistency',
    displayName: 'Character Consistency Checker',
    description:
      'Analyzes character actions, dialogue, and decisions against established profile to ensure consistency. Flags contradictions.',
    category: 'validation',
    inputSchema: {
      type: 'object',
      properties: {
        characterId: {
          type: 'string',
          description: 'Character ID to check',
        },
        content: {
          type: 'string',
          description: 'New content (dialogue, action, scene) to validate',
        },
        context: {
          type: 'string',
          description: 'Scene or situation context',
        },
      },
      required: ['characterId', 'content'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        isConsistent: { type: 'boolean' },
        score: { type: 'number' },
        issues: { type: 'array' },
        suggestions: { type: 'array' },
      },
    },
    executeFunction: `async ({ characterId, content, context }, { payload }) => {
  // Fetch character profile
  const character = await payload.findByID({
    collection: 'characters',
    id: characterId,
  });

  if (!character) {
    throw new Error(\`Character \${characterId} not found\`);
  }

  const issues = [];
  let score = 100;

  // Check against personality traits
  const personality = character.personality || {};
  const traits = character.traits || [];

  // Simple consistency checks (in production, use AI for deeper analysis)
  if (content.toLowerCase().includes('angry') && personality.temperament === 'calm') {
    issues.push({
      type: 'personality',
      message: 'Character displays anger inconsistent with calm temperament',
      severity: 'medium',
    });
    score -= 15;
  }

  if (content.toLowerCase().includes('forgot') && traits.includes('perfect-memory')) {
    issues.push({
      type: 'trait',
      message: 'Character forgetting contradicts "perfect memory" trait',
      severity: 'high',
    });
    score -= 25;
  }

  const isConsistent = score >= 75;

  return {
    isConsistent,
    score,
    issues,
    suggestions: issues.map(i => \`Consider revising to align with \${i.type}\`),
  };
}`,
    setupCode: `// No setup required`,
    isGlobal: false,
    isActive: true,
    version: '1.0.0',
    exampleInputs: [
      {
        example: {
          characterId: 'char-001',
          content: 'Character angrily slams door',
          context: 'After receiving bad news',
        },
      },
    ],
    testCases: [
      {
        name: 'Check consistent action',
        input: {
          characterId: 'char-001',
          content: 'Character calmly assesses the situation',
        },
        shouldFail: false,
      },
    ],
    performanceMetrics: {
      totalCalls: 380,
      successfulCalls: 371,
      failedCalls: 9,
      averageExecutionTime: 250,
    },
    documentation: {
      usage: 'Run this tool before finalizing any character content to ensure consistency with established profile.',
      examples: 'await checkCharacterConsistency({ characterId: "hero", content: "dialogue line", context: "confrontation scene" })',
      limitations: 'Basic rule-based checking. For deep analysis, consider using AI-powered validation.',
    },
    tags: [{ tag: 'character' }, { tag: 'validation' }, { tag: 'consistency' }],
  },
  {
    toolName: 'map-character-relationships',
    displayName: 'Character Relationship Mapper',
    description:
      'Generates visual relationship map showing connections, dynamics, and conflicts between characters.',
    category: 'analysis',
    inputSchema: {
      type: 'object',
      properties: {
        characterIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of character IDs to map',
        },
        includeHistory: {
          type: 'boolean',
          description: 'Include relationship history and evolution',
          default: false,
        },
      },
      required: ['characterIds'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        nodes: { type: 'array' },
        edges: { type: 'array' },
        dynamics: { type: 'object' },
      },
    },
    executeFunction: `async ({ characterIds, includeHistory = false }, { payload }) => {
  const nodes = [];
  const edges = [];
  const dynamics = {};

  for (const id of characterIds) {
    const char = await payload.findByID({
      collection: 'characters',
      id,
    });

    if (char) {
      nodes.push({
        id: char.id,
        name: char.name,
        type: char.role,
      });

      // Map relationships
      if (char.relationships) {
        char.relationships.forEach(rel => {
          edges.push({
            from: char.id,
            to: rel.characterId,
            type: rel.type,
            strength: rel.strength,
          });
        });
      }
    }
  }

  return { nodes, edges, dynamics };
}`,
    setupCode: `// No setup required`,
    isGlobal: false,
    isActive: true,
    version: '1.0.0',
    exampleInputs: [
      {
        example: {
          characterIds: ['char-001', 'char-002', 'char-003'],
          includeHistory: true,
        },
      },
    ],
    testCases: [
      {
        name: 'Map multiple characters',
        input: {
          characterIds: ['char-001', 'char-002'],
          includeHistory: false,
        },
        shouldFail: false,
      },
    ],
    performanceMetrics: {
      totalCalls: 220,
      successfulCalls: 215,
      failedCalls: 5,
      averageExecutionTime: 350,
    },
    documentation: {
      usage: 'Use to visualize and analyze character relationships. Helpful for ensuring relationship consistency.',
      examples: 'await mapCharacterRelationships({ characterIds: ["hero", "villain", "sidekick"], includeHistory: true })',
      limitations: 'Requires characters to have relationship data defined. Does not infer unstated relationships.',
    },
    tags: [{ tag: 'character' }, { tag: 'analysis' }, { tag: 'relationships' }],
  },

  // ========== STORY TOOLS ==========
  {
    toolName: 'validate-plot-structure',
    displayName: 'Plot Structure Validator',
    description:
      'Validates story structure against standard frameworks (three-act, hero\'s journey). Identifies missing elements and pacing issues.',
    category: 'validation',
    inputSchema: {
      type: 'object',
      properties: {
        plotData: {
          type: 'object',
          description: 'Plot structure data with acts, beats, turning points',
        },
        framework: {
          type: 'string',
          enum: ['three-act', 'heros-journey', 'save-the-cat'],
          description: 'Story structure framework to validate against',
          default: 'three-act',
        },
      },
      required: ['plotData'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        score: { type: 'number' },
        missingElements: { type: 'array' },
        recommendations: { type: 'array' },
      },
    },
    executeFunction: `async ({ plotData, framework = 'three-act' }) => {
  const missingElements = [];
  let score = 100;

  // Validate three-act structure
  if (framework === 'three-act') {
    const required = ['inciting-incident', 'midpoint', 'climax', 'resolution'];

    required.forEach(element => {
      if (!plotData.beats?.includes(element)) {
        missingElements.push({
          element,
          description: \`Missing \${element} in plot structure\`,
        });
        score -= 20;
      }
    });

    // Check act balance
    if (plotData.acts) {
      const actRatios = plotData.acts.map(act => act.length);
      const total = actRatios.reduce((a, b) => a + b, 0);
      const ratios = actRatios.map(r => r / total);

      // Ideal: 25%, 50%, 25%
      if (Math.abs(ratios[0] - 0.25) > 0.1) {
        missingElements.push({
          element: 'act-balance',
          description: 'Act 1 length deviates from ideal 25%',
        });
        score -= 10;
      }
    }
  }

  return {
    isValid: score >= 70,
    score,
    missingElements,
    recommendations: missingElements.map(e => \`Add or refine \${e.element}\`),
  };
}`,
    setupCode: `// No setup required`,
    isGlobal: false,
    isActive: true,
    version: '1.0.0',
    exampleInputs: [
      {
        example: {
          plotData: {
            acts: [{ length: 25 }, { length: 50 }, { length: 25 }],
            beats: ['inciting-incident', 'midpoint', 'climax', 'resolution'],
          },
          framework: 'three-act',
        },
      },
    ],
    testCases: [
      {
        name: 'Valid three-act structure',
        input: {
          plotData: {
            acts: [{ length: 25 }, { length: 50 }, { length: 25 }],
            beats: ['inciting-incident', 'midpoint', 'climax', 'resolution'],
          },
          framework: 'three-act',
        },
        shouldFail: false,
      },
    ],
    performanceMetrics: {
      totalCalls: 310,
      successfulCalls: 302,
      failedCalls: 8,
      averageExecutionTime: 180,
    },
    documentation: {
      usage: 'Use to validate story structure before finalizing plot. Ensures all critical story beats are present.',
      examples: 'await validatePlotStructure({ plotData: {...}, framework: "three-act" })',
      limitations: 'Rule-based validation. Cannot assess quality or emotional impact of story elements.',
    },
    tags: [{ tag: 'story' }, { tag: 'validation' }, { tag: 'plot' }],
  },
  {
    toolName: 'analyze-dialogue-authenticity',
    displayName: 'Dialogue Authenticity Analyzer',
    description:
      'Analyzes dialogue for natural speech patterns, character voice consistency, and subtext. Provides improvement suggestions.',
    category: 'analysis',
    inputSchema: {
      type: 'object',
      properties: {
        dialogue: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              character: { type: 'string' },
              line: { type: 'string' },
            },
          },
          description: 'Array of dialogue lines to analyze',
        },
        context: {
          type: 'string',
          description: 'Scene context for dialogue',
        },
      },
      required: ['dialogue'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        authenticityScore: { type: 'number' },
        issues: { type: 'array' },
        improvements: { type: 'array' },
        voiceConsistency: { type: 'object' },
      },
    },
    executeFunction: `async ({ dialogue, context }) => {
  const issues = [];
  let authenticityScore = 100;

  for (const line of dialogue) {
    // Check for exposition dumps
    if (line.line.length > 200 && line.line.includes('because') && line.line.includes('and')) {
      issues.push({
        character: line.character,
        issue: 'potential-exposition-dump',
        line: line.line.substring(0, 50) + '...',
        severity: 'medium',
      });
      authenticityScore -= 10;
    }

    // Check for overly formal speech
    if (line.line.includes('furthermore') || line.line.includes('therefore')) {
      issues.push({
        character: line.character,
        issue: 'overly-formal',
        line: line.line.substring(0, 50) + '...',
        severity: 'low',
      });
      authenticityScore -= 5;
    }

    // Check for contractions (natural speech)
    const hasContractions = /\\b(don't|won't|can't|shouldn't|wouldn't|couldn't)\\b/.test(line.line);
    if (!hasContractions && line.line.split(' ').length > 10) {
      issues.push({
        character: line.character,
        issue: 'lacks-natural-contractions',
        line: line.line.substring(0, 50) + '...',
        severity: 'low',
      });
      authenticityScore -= 3;
    }
  }

  return {
    authenticityScore: Math.max(0, authenticityScore),
    issues,
    improvements: issues.map(i => ({
      issue: i.issue,
      suggestion: \`Revise \${i.character}'s dialogue for more natural speech\`,
    })),
    voiceConsistency: {
      score: authenticityScore,
      analysis: 'Basic authenticity check completed',
    },
  };
}`,
    setupCode: `// No setup required`,
    isGlobal: false,
    isActive: true,
    version: '1.0.0',
    exampleInputs: [
      {
        example: {
          dialogue: [
            { character: 'Hero', line: 'I don\'t think we can trust him.' },
            { character: 'Sidekick', line: 'You\'re right. He\'s been lying all along.' },
          ],
          context: 'Confrontation scene',
        },
      },
    ],
    testCases: [
      {
        name: 'Natural dialogue',
        input: {
          dialogue: [
            { character: 'Hero', line: 'We need to go now!' },
          ],
        },
        shouldFail: false,
      },
    ],
    performanceMetrics: {
      totalCalls: 420,
      successfulCalls: 412,
      failedCalls: 8,
      averageExecutionTime: 200,
    },
    documentation: {
      usage: 'Use to improve dialogue quality and ensure natural speech patterns before finalization.',
      examples: 'await analyzeDialogueAuthenticity({ dialogue: [...], context: "action scene" })',
      limitations: 'Basic pattern matching. For deep analysis, use AI-powered review.',
    },
    tags: [{ tag: 'story' }, { tag: 'analysis' }, { tag: 'dialogue' }],
  },
  {
    toolName: 'calculate-scene-pacing',
    displayName: 'Scene Pacing Calculator',
    description:
      'Calculates optimal scene pacing based on story structure, emotional beats, and genre conventions.',
    category: 'analysis',
    inputSchema: {
      type: 'object',
      properties: {
        scenes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              duration: { type: 'number' },
              intensity: { type: 'number' },
              type: { type: 'string' },
            },
          },
          description: 'Array of scenes with duration and intensity',
        },
        genre: {
          type: 'string',
          description: 'Story genre (affects pacing expectations)',
        },
      },
      required: ['scenes'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        overallPacing: { type: 'string' },
        pacingCurve: { type: 'array' },
        recommendations: { type: 'array' },
        targetDurations: { type: 'object' },
      },
    },
    executeFunction: `async ({ scenes, genre = 'drama' }) => {
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const avgIntensity = scenes.reduce((sum, s) => sum + s.intensity, 0) / scenes.length;

  const recommendations = [];

  // Check for pacing variety
  const intensities = scenes.map(s => s.intensity);
  const hasVariety = Math.max(...intensities) - Math.min(...intensities) >= 3;

  if (!hasVariety) {
    recommendations.push({
      type: 'variety',
      message: 'Scenes lack intensity variation. Add quieter and more intense moments.',
    });
  }

  // Check scene length distribution
  const longScenes = scenes.filter(s => s.duration > totalDuration * 0.15).length;
  if (longScenes > scenes.length * 0.3) {
    recommendations.push({
      type: 'length',
      message: 'Too many long scenes. Consider breaking up or shortening some.',
    });
  }

  return {
    overallPacing: avgIntensity > 7 ? 'fast' : avgIntensity > 4 ? 'moderate' : 'slow',
    pacingCurve: scenes.map((s, i) => ({ scene: i + 1, intensity: s.intensity })),
    recommendations,
    targetDurations: {
      average: Math.round(totalDuration / scenes.length),
      min: Math.min(...scenes.map(s => s.duration)),
      max: Math.max(...scenes.map(s => s.duration)),
    },
  };
}`,
    setupCode: `// No setup required`,
    isGlobal: false,
    isActive: true,
    version: '1.0.0',
    exampleInputs: [
      {
        example: {
          scenes: [
            { id: 'scene-1', duration: 120, intensity: 3, type: 'setup' },
            { id: 'scene-2', duration: 180, intensity: 7, type: 'action' },
            { id: 'scene-3', duration: 90, intensity: 5, type: 'dialogue' },
          ],
          genre: 'action',
        },
      },
    ],
    testCases: [
      {
        name: 'Calculate pacing for multiple scenes',
        input: {
          scenes: [
            { id: 'scene-1', duration: 120, intensity: 5, type: 'setup' },
            { id: 'scene-2', duration: 150, intensity: 8, type: 'action' },
          ],
          genre: 'thriller',
        },
        shouldFail: false,
      },
    ],
    performanceMetrics: {
      totalCalls: 280,
      successfulCalls: 275,
      failedCalls: 5,
      averageExecutionTime: 150,
    },
    documentation: {
      usage: 'Use to analyze and optimize scene pacing before editing. Ensures proper rhythm and flow.',
      examples: 'await calculateScenePacing({ scenes: [...], genre: "thriller" })',
      limitations: 'Algorithmic analysis. Does not account for subjective emotional impact.',
    },
    tags: [{ tag: 'story' }, { tag: 'analysis' }, { tag: 'pacing' }],
  },
  {
    toolName: 'track-theme-consistency',
    displayName: 'Theme Consistency Tracker',
    description:
      'Tracks thematic elements throughout story to ensure consistency. Identifies where themes are reinforced or contradicted.',
    category: 'validation',
    inputSchema: {
      type: 'object',
      properties: {
        themes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Main themes to track',
        },
        content: {
          type: 'string',
          description: 'Story content to analyze for themes',
        },
      },
      required: ['themes', 'content'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        themeStrength: { type: 'object' },
        consistencyScore: { type: 'number' },
        contradictions: { type: 'array' },
        reinforcements: { type: 'array' },
      },
    },
    executeFunction: `async ({ themes, content }) => {
  const themeStrength = {};
  const contradictions = [];
  const reinforcements = [];

  themes.forEach(theme => {
    const themeKeywords = getThemeKeywords(theme);
    const mentions = countKeywordMentions(content, themeKeywords);

    themeStrength[theme] = {
      mentions,
      strength: mentions > 5 ? 'strong' : mentions > 2 ? 'moderate' : 'weak',
    };

    if (mentions > 2) {
      reinforcements.push({
        theme,
        count: mentions,
        message: \`Theme "\${theme}" is well-represented\`,
      });
    } else {
      contradictions.push({
        theme,
        count: mentions,
        message: \`Theme "\${theme}" is underrepresented\`,
      });
    }
  });

  const totalMentions = Object.values(themeStrength).reduce((sum, t) => sum + t.mentions, 0);
  const avgMentions = totalMentions / themes.length;
  const consistencyScore = Math.min(100, (avgMentions / 5) * 100);

  return {
    themeStrength,
    consistencyScore: Math.round(consistencyScore),
    contradictions,
    reinforcements,
  };

  function getThemeKeywords(theme) {
    const keywordMap = {
      'redemption': ['redemption', 'forgiveness', 'second chance', 'atone'],
      'love': ['love', 'romance', 'affection', 'care'],
      'power': ['power', 'control', 'dominance', 'authority'],
      'freedom': ['freedom', 'liberty', 'independence', 'escape'],
    };
    return keywordMap[theme.toLowerCase()] || [theme];
  }

  function countKeywordMentions(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(\`\\\\b\${keyword}\\\\b\`, 'gi');
      const matches = lowerText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }
}`,
    setupCode: `// No setup required`,
    isGlobal: false,
    isActive: true,
    version: '1.0.0',
    exampleInputs: [
      {
        example: {
          themes: ['redemption', 'love', 'sacrifice'],
          content: 'The hero seeks redemption for past mistakes. Love drives their actions as they sacrifice everything for others.',
        },
      },
    ],
    testCases: [
      {
        name: 'Track multiple themes',
        input: {
          themes: ['power', 'freedom'],
          content: 'The struggle for power leads to the loss of freedom.',
        },
        shouldFail: false,
      },
    ],
    performanceMetrics: {
      totalCalls: 260,
      successfulCalls: 254,
      failedCalls: 6,
      averageExecutionTime: 220,
    },
    documentation: {
      usage: 'Use throughout story development to ensure themes are consistently represented.',
      examples: 'await trackThemeConsistency({ themes: ["redemption"], content: "..." })',
      limitations: 'Keyword-based tracking. May miss subtle thematic elements.',
    },
    tags: [{ tag: 'story' }, { tag: 'validation' }, { tag: 'theme' }],
  },

  // ========== VISUAL TOOLS ==========
  {
    toolName: 'generate-visual-style-guide',
    displayName: 'Visual Style Guide Generator',
    description:
      'Generates comprehensive visual style guide including color palettes, composition rules, and aesthetic direction.',
    category: 'generation',
    inputSchema: {
      type: 'object',
      properties: {
        mood: {
          type: 'string',
          description: 'Overall mood (dark, light, dramatic, whimsical)',
        },
        genre: {
          type: 'string',
          description: 'Genre (fantasy, sci-fi, drama, comedy)',
        },
        references: {
          type: 'array',
          items: { type: 'string' },
          description: 'Visual reference inspirations',
        },
      },
      required: ['mood', 'genre'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        colorPalette: { type: 'object' },
        compositionRules: { type: 'array' },
        lightingStyle: { type: 'string' },
        aestheticDirection: { type: 'string' },
      },
    },
    executeFunction: `async ({ mood, genre, references = [] }) => {
  // Generate color palette based on mood
  const colorPalettes = {
    dark: { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560' },
    light: { primary: '#f4f4f9', secondary: '#e8e8e8', accent: '#4a90e2' },
    dramatic: { primary: '#0f0f0f', secondary: '#8b0000', accent: '#ffd700' },
    whimsical: { primary: '#ff6b9d', secondary: '#c44569', accent: '#feca57' },
  };

  const compositionRules = [
    'Use rule of thirds for key subject placement',
    'Create depth with foreground, midground, background',
    'Guide viewer attention with leading lines',
    \`Maintain \${mood} atmosphere throughout\`,
  ];

  return {
    colorPalette: colorPalettes[mood] || colorPalettes.light,
    compositionRules,
    lightingStyle: mood === 'dark' ? 'low-key, high contrast' : 'natural, soft lighting',
    aestheticDirection: \`\${genre} visual style with \${mood} tone. \${references.length ? 'Inspired by: ' + references.join(', ') : ''}\`,
  };
}`,
    setupCode: `// No setup required`,
    isGlobal: false,
    isActive: true,
    version: '1.0.0',
    exampleInputs: [
      {
        example: {
          mood: 'dark',
          genre: 'sci-fi',
          references: ['Blade Runner', 'The Matrix'],
        },
      },
    ],
    testCases: [
      {
        name: 'Generate style guide',
        input: {
          mood: 'light',
          genre: 'fantasy',
          references: [],
        },
        shouldFail: false,
      },
    ],
    performanceMetrics: {
      totalCalls: 190,
      successfulCalls: 186,
      failedCalls: 4,
      averageExecutionTime: 180,
    },
    documentation: {
      usage: 'Use at project start to establish visual direction. Reference throughout production.',
      examples: 'await generateVisualStyleGuide({ mood: "dramatic", genre: "thriller" })',
      limitations: 'Provides starting point. Requires refinement by visual artists.',
    },
    tags: [{ tag: 'visual' }, { tag: 'generation' }, { tag: 'style' }],
  },

  // ========== QUALITY TOOLS ==========
  {
    toolName: 'assess-content-quality',
    displayName: 'Content Quality Assessor',
    description:
      'Comprehensive quality assessment tool that evaluates content across multiple dimensions: coherence, originality, technical quality.',
    category: 'validation',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Content to assess',
        },
        contentType: {
          type: 'string',
          enum: ['story', 'character', 'dialogue', 'visual', 'audio'],
          description: 'Type of content being assessed',
        },
        criteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific criteria to assess',
        },
      },
      required: ['content', 'contentType'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        overallScore: { type: 'number' },
        dimensionScores: { type: 'object' },
        strengths: { type: 'array' },
        weaknesses: { type: 'array' },
        recommendations: { type: 'array' },
      },
    },
    executeFunction: `async ({ content, contentType, criteria = [] }) => {
  const scores = {};
  const strengths = [];
  const weaknesses = [];

  // Assess coherence
  const wordCount = content.split(/\\s+/).length;
  const sentenceCount = content.split(/[.!?]+/).length;
  const avgWordsPerSentence = wordCount / sentenceCount;

  scores.coherence = avgWordsPerSentence > 15 && avgWordsPerSentence < 25 ? 90 : 70;

  if (scores.coherence >= 85) {
    strengths.push('Well-structured sentences with good flow');
  } else {
    weaknesses.push('Sentence structure could be improved');
  }

  // Assess completeness
  scores.completeness = content.length > 500 ? 90 : content.length > 200 ? 75 : 60;

  // Assess technical quality (basic checks)
  const hasTypos = /\\b(teh|adn|taht)\\b/.test(content);
  scores.technical = hasTypos ? 70 : 95;

  // Calculate overall score
  const overallScore = Math.round(
    Object.values(scores).reduce((sum, s) => sum + s, 0) / Object.keys(scores).length
  );

  return {
    overallScore,
    dimensionScores: scores,
    strengths,
    weaknesses,
    recommendations: weaknesses.map(w => \`Improve: \${w}\`),
  };
}`,
    setupCode: `// No setup required`,
    isGlobal: true,
    isActive: true,
    version: '1.0.0',
    exampleInputs: [
      {
        example: {
          content: 'Sample content for quality assessment...',
          contentType: 'story',
          criteria: ['coherence', 'originality'],
        },
      },
    ],
    testCases: [
      {
        name: 'Assess story content',
        input: {
          content: 'Once upon a time in a land far away, there lived a hero who embarked on an epic journey.',
          contentType: 'story',
        },
        shouldFail: false,
      },
    ],
    performanceMetrics: {
      totalCalls: 550,
      successfulCalls: 542,
      failedCalls: 8,
      averageExecutionTime: 190,
    },
    documentation: {
      usage: 'Use for final quality check before content approval. Provides objective assessment.',
      examples: 'await assessContentQuality({ content: "...", contentType: "dialogue" })',
      limitations: 'Automated assessment. Human review recommended for final approval.',
    },
    tags: [{ tag: 'quality' }, { tag: 'validation' }, { tag: 'global' }],
  },
]

/**
 * Seed custom tools collection
 * @param payload - Payload CMS instance
 */
export async function seedCustomTools(payload: Payload): Promise<void> {
  console.log('🛠️  Seeding custom tools...')

  // Get department IDs for relationship mapping
  const departments = await payload.find({
    collection: 'departments',
    limit: 100,
  })

  const departmentMap = new Map<string, string>()
  departments.docs.forEach((dept: any) => {
    departmentMap.set(dept.slug, dept.id)
  })

  // Tool to department mapping
  const toolDepartments: Record<string, string[]> = {
    'fetch-character-profile': ['character'],
    'check-character-consistency': ['character'],
    'map-character-relationships': ['character'],
    'validate-plot-structure': ['story'],
    'analyze-dialogue-authenticity': ['story'],
    'calculate-scene-pacing': ['story', 'video'],
    'track-theme-consistency': ['story'],
    'generate-visual-style-guide': ['visual'],
    'assess-content-quality': [], // Global tool
  }

  for (const toolData of customToolsSeedData) {
    try {
      // Check if tool already exists
      const existing = await payload.find({
        collection: 'custom-tools',
        where: {
          toolName: {
            equals: toolData.toolName,
          },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(`  ⏭️  Tool "${toolData.displayName}" already exists, skipping...`)
        continue
      }

      // Map department slugs to IDs
      const deptSlugs = toolDepartments[toolData.toolName] || []
      const departmentIds = deptSlugs
        .map((slug) => departmentMap.get(slug))
        .filter((id): id is string => id !== undefined)

      // Create tool
      await payload.create({
        collection: 'custom-tools',
        data: {
          ...toolData,
          departments: departmentIds,
        },
      })

      console.log(`  ✅ Created tool: ${toolData.displayName}`)
    } catch (error) {
      console.error(`  ❌ Failed to create tool ${toolData.displayName}:`, error)
      throw error
    }
  }

  console.log('✅ Custom tools seeded successfully\n')
}
