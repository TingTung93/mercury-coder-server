import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

console.error("Starting new minimal MCP server without schemas...");

// Create the server
const server = new Server(
  { name: 'minimal-chat-server', version: '1.0.0' },
  { 
    capabilities: { 
      methods: ['chat']
    } 
  }
);

// Define fallback handler for all requests
server.fallbackRequestHandler = async (request) => {
  console.error(`Received request for method ${request.method}:`, JSON.stringify(request));
  
  if (request.method === 'chat') {
    console.error("Processing chat request");
    
    // Validate and extract message
    const params = request.params || {};
    if (!params.message || typeof params.message !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'message' parameter");
    }
    
    console.error(`Processing message: "${params.message}"`);
    
    // Return a simple echo response
    return {
      content: `Echo from minimal server: ${params.message}`
    };
  }
  
  if (request.method === 'ping') {
    console.error("Processing ping request");
    return {};
  }
  
  console.error(`Method ${request.method} not found`);
  throw new McpError(ErrorCode.MethodNotFound, `Method '${request.method}' not found`);
};

// Connect to stdio transport
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error("Server connected to transport");
}).catch(error => {
  console.error("Server connection error:", error);
  process.exit(1);
});

// Error handling
server.onerror = (error) => {
  console.error("Server error:", error);
};

// Handle SIGINT for graceful shutdown
process.on('SIGINT', async () => {
  console.error("Shutting down server...");
  await server.close();
  process.exit(0);
}); 