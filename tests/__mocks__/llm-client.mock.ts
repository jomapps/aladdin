/**
 * Mock for LLM Client
 */

export interface MockLLMResponse {
  content: string;
  tokensUsed: number;
}

export class MockLLMClient {
  private totalTokens = 0;
  private mockResponses: MockLLMResponse[] = [];
  private responseIndex = 0;

  async chat(messages: any[]): Promise<MockLLMResponse> {
    const response = this.mockResponses[this.responseIndex] || {
      content: JSON.stringify({
        summary: 'Generated summary',
        keywords: ['test', 'mock'],
        categories: ['test-category'],
        entities: [{ name: 'Test Entity', type: 'character' }],
      }),
      tokensUsed: 500,
    };

    this.responseIndex = (this.responseIndex + 1) % Math.max(1, this.mockResponses.length);
    this.totalTokens += response.tokensUsed;

    return response;
  }

  getTotalTokensUsed(): number {
    return this.totalTokens;
  }

  setMockResponses(responses: MockLLMResponse[]): void {
    this.mockResponses = responses;
    this.responseIndex = 0;
  }

  reset(): void {
    this.totalTokens = 0;
    this.mockResponses = [];
    this.responseIndex = 0;
  }
}

export function createMockLLMClient(): MockLLMClient {
  return new MockLLMClient();
}
