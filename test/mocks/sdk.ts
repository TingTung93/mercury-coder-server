export const ErrorCode = {
  InvalidParams: 'INVALID_PARAMS',
  InternalError: 'INTERNAL_ERROR'
};

export class McpError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'McpError';
  }
}
