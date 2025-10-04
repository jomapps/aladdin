/**
 * Mock Brain Client (brain.ft.tc)
 * Provides mock implementations for Brain API calls
 */

import { vi } from 'vitest';

export const mockBrainClient = {
  ingest: vi.fn(),
  getNode: vi.fn(),
  addNode: vi.fn(),
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  addRelationship: vi.fn(),
  query: vi.fn(),
  search: vi.fn(),
  getRelationships: vi.fn(),
};

// Default mock implementations
mockBrainClient.ingest.mockResolvedValue({
  nodeId: 'brain-node-123',
  success: true,
});

mockBrainClient.getNode.mockResolvedValue({
  id: 'node-123',
  type: 'concept',
  content: 'Mock node content',
  projectId: 'project-123',
  properties: {
    entityType: 'character',
    name: 'Test Character',
    imageUrl: 'https://example.com/character.png',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

mockBrainClient.addNode.mockResolvedValue({
  nodeId: 'new-node-456',
  success: true,
});

mockBrainClient.updateNode.mockResolvedValue({
  success: true,
});

mockBrainClient.deleteNode.mockResolvedValue({
  success: true,
});

mockBrainClient.addRelationship.mockResolvedValue({
  relationshipId: 'rel-789',
  success: true,
});

mockBrainClient.query.mockResolvedValue({
  nodes: [
    {
      id: 'node-1',
      type: 'concept',
      properties: { name: 'Character 1', qualityScore: 0.92 },
    },
    {
      id: 'node-2',
      type: 'concept',
      properties: { name: 'Character 2', qualityScore: 0.88 },
    },
  ],
  count: 2,
});

mockBrainClient.search.mockResolvedValue({
  results: [
    {
      nodeId: 'node-search-1',
      score: 0.95,
      content: 'Matching content',
    },
  ],
});

mockBrainClient.getRelationships.mockResolvedValue({
  relationships: [
    {
      id: 'rel-1',
      fromNodeId: 'node-1',
      toNodeId: 'node-2',
      type: 'RELATED_TO',
    },
  ],
});

export default mockBrainClient;
