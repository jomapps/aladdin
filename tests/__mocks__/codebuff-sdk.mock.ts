/**
 * Mock for @codebuff/sdk
 */

export interface MockCodebuffRunConfig {
  agent: string;
  prompt: string;
  customToolDefinitions?: any[];
  previousRun?: any;
}

export interface MockCodebuffRunResult {
  id: string;
  output: any;
  status: 'success' | 'error';
  tokensUsed?: number;
}

export class MockCodebuffClient {
  private mockResponses: Map<string, MockCodebuffRunResult> = new Map();
  private callHistory: MockCodebuffRunConfig[] = [];

  constructor(config?: { apiKey: string }) {
    // Mock constructor
  }

  /**
   * Mock run method
   */
  async run(config: MockCodebuffRunConfig): Promise<MockCodebuffRunResult> {
    this.callHistory.push(config);

    // Check for pre-configured mock response
    const mockResponse = this.mockResponses.get(config.agent);
    if (mockResponse) {
      return mockResponse;
    }

    // Default mock response
    return {
      id: `run-${Date.now()}`,
      output: {
        departments: ['character'],
        instructions: { character: config.prompt },
        relevance: 0.8,
        specialists: [
          { id: 'character-creator', instructions: 'Create character' },
          { id: 'hair-stylist', instructions: 'Design hair' },
        ],
      },
      status: 'success',
      tokensUsed: 1000,
    };
  }

  /**
   * Configure mock response for specific agent
   */
  mockResponse(agentId: string, response: MockCodebuffRunResult): void {
    this.mockResponses.set(agentId, response);
  }

  /**
   * Get call history
   */
  getCallHistory(): MockCodebuffRunConfig[] {
    return this.callHistory;
  }

  /**
   * Reset mock state
   */
  reset(): void {
    this.mockResponses.clear();
    this.callHistory = [];
  }
}

// Export mock factory
export function createMockCodebuffClient(): MockCodebuffClient {
  return new MockCodebuffClient({ apiKey: 'test-key' });
}
