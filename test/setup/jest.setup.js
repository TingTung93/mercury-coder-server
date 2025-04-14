import { jest } from '@jest/globals';

// Mock environment variables for tests
process.env.MERCURY_API_KEY = process.env.MERCURY_API_KEY || 'test_api_key';

// Configure jest for ESM
jest.unstable_mockModule('../../src/mercuryApi.js', () => ({
  MercuryApi: jest.fn().mockImplementation(() => ({
    callWithToolHandling: jest.fn().mockImplementation(
      (userMessage, context, availableTools, toolDispatcher, reportProgress) => {
        // Call progress callback
        reportProgress("Mock: Processing request...");
        reportProgress("Mock: Generating response...");
        
        // Return mock response
        return Promise.resolve({
          content: `Mock response to: "${userMessage}"`
        });
      }
    )
  }))
}));

// Increase timeout for tests
jest.setTimeout(10000);

// Before all tests
beforeAll(() => {
  // Any global test setup
});

// After all tests
afterAll(() => {
  // Any global test cleanup
});

// Before each test
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
});

// After each test
afterEach(() => {
  // Clean up after each test
}); 