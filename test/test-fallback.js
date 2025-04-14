import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import readline from 'readline';

// Create a simple server with a fallback handler
const server = new Server(
  { name: 'test-server', version: '1.0.0' },
  { capabilities: { methods: ['chat'] } }
);

// Set a fallback handler that logs requests and handles 'chat'
server.fallbackRequestHandler = async (request) => {
  console.error(`Fallback handler received: ${JSON.stringify(request, null, 2)}`);
  
  if (request.method === 'chat') {
    console.error('Chat method found, processing request');
    
    const { message } = request.params || {};
    
    if (!message || typeof message !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'message' parameter");
    }
    
    console.error(`Processing message: ${message}`);
    
    return {
      content: `Echo: ${message}`
    };
  }
  
  console.error(`Method '${request.method}' not found`);
  throw new McpError(ErrorCode.MethodNotFound, `Method '${request.method}' not found`);
};

// Connect to stdio
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error('Server connected');
  
  // Setup readline for direct input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Listen for SIGINT to close gracefully
  process.on('SIGINT', async () => {
    console.error('Shutting down server...');
    await server.close();
    process.exit(0);
  });
  
  // Log errors
  server.onerror = (error) => {
    console.error('Server error:', error);
  };
}).catch(error => {
  console.error('Failed to connect server:', error);
  process.exit(1);
}); 