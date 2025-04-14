import { jest } from '@jest/globals';

export const mockTypes = {
  ErrorCode: {
    InvalidParams: 'INVALID_PARAMS',
    InternalError: 'INTERNAL_ERROR'
  },
  McpError: class extends Error {
    constructor(public code: string, message: string) {
      super(message);
      this.name = 'McpError';
    }
  }
};

jest.mock('../../src/types/index.js', () => mockTypes);