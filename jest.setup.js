// Jest setup file
// Add any global test configuration here

// Extend Jest with custom matchers
import '@testing-library/jest-dom';

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.PERPLEXITY_API_KEY = 'test-perplexity-key';

// Suppress console.log in tests unless debugging
if (process.env.DEBUG !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    // Keep error and warn for visibility
    error: console.error,
    warn: console.warn,
  };
}

// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
