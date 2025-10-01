/**
 * Test Fixtures - Context Data
 * Sample context data for testing
 */

import type { Context } from '@/lib/agents/data-preparation/types'

export const mockProjectContext = {
  id: 'proj-001',
  name: 'Dark Justice',
  slug: 'dark-justice',
  type: 'series' as const,
  genre: ['Crime', 'Thriller', 'Drama'],
  tone: 'Dark and gritty',
  themes: ['Justice vs. Revenge', 'Corruption', 'Redemption'],
  targetAudience: 'Adults 25-45',
  phase: 'expansion' as const,
  status: 'active' as const
}

export const mockPayloadContext = {
  characters: [
    {
      id: 'char-001',
      name: 'John Doe',
      role: 'protagonist'
    },
    {
      id: 'char-002',
      name: 'Sarah Chen',
      role: 'antagonist'
    },
    {
      id: 'char-003',
      name: 'Detective Martinez',
      role: 'supporting'
    }
  ],
  scenes: [
    {
      id: 'scene-001',
      name: 'Opening Chase',
      sceneNumber: 1
    },
    {
      id: 'scene-002',
      name: 'First Meeting',
      sceneNumber: 2
    }
  ],
  locations: [
    {
      id: 'loc-001',
      name: 'Abandoned Warehouse'
    },
    {
      id: 'loc-002',
      name: 'City Courthouse'
    }
  ],
  episodes: [
    {
      id: 'ep-001',
      title: 'Pilot',
      number: 1
    }
  ],
  concepts: [
    {
      id: 'concept-001',
      name: 'Justice vs. Revenge'
    }
  ]
}

export const mockBrainContext = {
  existingEntities: [
    {
      id: 'brain-001',
      type: 'character',
      text: 'John Doe is a detective'
    },
    {
      id: 'brain-002',
      type: 'scene',
      text: 'Opening chase scene in warehouse'
    }
  ],
  totalCount: 2,
  relatedNodes: [
    {
      id: 'brain-001',
      type: 'character',
      relationshipType: 'APPEARS_IN'
    }
  ],
  similarContent: [
    {
      id: 'brain-003',
      type: 'character',
      similarity: 0.85,
      text: 'Similar character profile'
    }
  ]
}

export const mockOpenDBContext = {
  collections: ['characters', 'scenes', 'locations'],
  stats: {
    characters: { count: 5 },
    scenes: { count: 10 },
    locations: { count: 3 }
  },
  recentDocuments: [
    {
      collection: 'characters',
      id: 'char-recent',
      updatedAt: new Date().toISOString()
    }
  ]
}

export const mockRelatedEntities = {
  characters: ['char-001', 'char-002', 'char-003'],
  scenes: ['scene-001', 'scene-002'],
  locations: ['loc-001', 'loc-002'],
  concepts: ['concept-001'],
  episodes: ['ep-001']
}

export const mockFullContext: Context = {
  project: mockProjectContext,
  payload: mockPayloadContext,
  brain: mockBrainContext,
  opendb: mockOpenDBContext,
  related: mockRelatedEntities
}

export const mockEmptyContext: Context = {
  project: {
    id: 'proj-empty',
    name: 'Empty Project',
    slug: 'empty-project'
  },
  payload: {
    characters: [],
    scenes: [],
    locations: [],
    episodes: [],
    concepts: []
  },
  brain: {
    existingEntities: [],
    totalCount: 0,
    relatedNodes: [],
    similarContent: []
  },
  opendb: {
    collections: [],
    stats: {}
  },
  related: {
    characters: [],
    scenes: [],
    locations: [],
    concepts: [],
    episodes: []
  }
}

export const mockMovieContext: Context = {
  project: {
    id: 'proj-movie',
    name: 'Action Movie',
    slug: 'action-movie',
    type: 'movie',
    genre: ['Action', 'Adventure'],
    tone: 'Fast-paced and exciting',
    themes: ['Good vs. Evil', 'Heroism'],
    targetAudience: 'Adults 18-35'
  },
  payload: mockPayloadContext,
  brain: mockBrainContext,
  opendb: mockOpenDBContext,
  related: mockRelatedEntities
}

export const mockLargeContext: Context = {
  project: mockProjectContext,
  payload: {
    characters: Array.from({ length: 50 }, (_, i) => ({
      id: `char-${i}`,
      name: `Character ${i}`,
      role: 'supporting'
    })),
    scenes: Array.from({ length: 100 }, (_, i) => ({
      id: `scene-${i}`,
      name: `Scene ${i}`,
      sceneNumber: i
    })),
    locations: Array.from({ length: 20 }, (_, i) => ({
      id: `loc-${i}`,
      name: `Location ${i}`
    })),
    episodes: Array.from({ length: 10 }, (_, i) => ({
      id: `ep-${i}`,
      title: `Episode ${i}`,
      number: i
    })),
    concepts: []
  },
  brain: {
    existingEntities: Array.from({ length: 200 }, (_, i) => ({
      id: `brain-${i}`,
      type: 'character',
      text: `Entity ${i}`
    })),
    totalCount: 200,
    relatedNodes: [],
    similarContent: []
  },
  opendb: mockOpenDBContext,
  related: {
    characters: Array.from({ length: 50 }, (_, i) => `char-${i}`),
    scenes: Array.from({ length: 100 }, (_, i) => `scene-${i}`),
    locations: Array.from({ length: 20 }, (_, i) => `loc-${i}`),
    concepts: [],
    episodes: Array.from({ length: 10 }, (_, i) => `ep-${i}`)
  }
}
