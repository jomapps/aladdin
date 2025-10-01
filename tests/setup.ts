/**
 * Global test setup for Vitest
 */

import { vi } from 'vitest';

// Setup global test environment
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
  process.env.BRAIN_SERVICE_API_KEY = 'test-brain-key';
  process.env.CODEBUFF_API_KEY = 'test-codebuff-key';
  process.env.REDIS_URL = 'redis://localhost:6379';
});

// Cleanup after all tests
afterAll(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// Global test utilities
declare global {
  function sleep(ms: number): Promise<void>;
}

global.sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  // Keep error for debugging
  error: console.error,
};
