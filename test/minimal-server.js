import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

console.error("Starting minimal MCP server for testing...");

// Define a simple handler for the 'chat' method
const ChatMethodSchema = z.object({
  method: z.literal('chat'),
  params: z.object({
    message: z.string(),
    context: z.optional(z.object({
      code: z.optional(z.string())
    }).passthrough())
  }).passthrough()
});

// Create the server
const server = new Server(
  { name: 'test-server', version: '1.0.0' },
  { 
    capabilities: { 
      methods: ['chat'],
      tools: {}
    } 
  }
);

// Explicitly register the chat handler
console.error("Registering chat handler...");
server.setRequestHandler(ChatMethodSchema, async (request) => {
  console.error("Chat handler called with request:", JSON.stringify(request));
  
  const { message } = request.params;
  console.error(`Processing message: ${message}`);
  
  return {
    content: `Echoing your message: ${message}`
  };
});

// Add fallback handler for other methods
server.fallbackRequestHandler = async (request) => {
  console.error(`Fallback handler called for method: ${request.method}`);
  
  if (request.method === 'chat') {
    console.error("Fallback handling chat request:", JSON.stringify(request, null, 2));
    
    // Validate and extract message
    const params = request.params || {};
    if (!params.message || typeof params.message !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'message' parameter");
    }
    
    return {
      content: `Fallback echo: ${params.message}`
    };
  }
  
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

// Handle SIGINT to gracefully shutdown
process.on('SIGINT', async () => {
  console.error("Shutting down server...");
  await server.close();
  process.exit(0);
}); 