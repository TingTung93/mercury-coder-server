import { McpServerBuilder } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

console.error("Starting minimal MCP server for debugging chat method handler registration...");

// Create a server builder
const builder = new McpServerBuilder();

// Define server capabilities
builder.setCapabilities({
  methods: ['chat', 'ping'], // Include ping for testing
  tools: {}
});

// Add a ping handler (standard)
builder.addRequestHandler('ping', async (request) => {
  console.error("Handling ping request:", request);
  return {};
});

// Add a chat handler
builder.addRequestHandler('chat', async (request) => {
  console.error("Chat handler called with request:", JSON.stringify(request));
  
  // Extract parameters from the request
  const { message } = request.params;
  console.error(`Processing message: "${message}"`);
  
  // Return a simple response
  return {
    content: `Echo from debug server: ${message}`
  };
});

// Configure error handler
builder.setErrorHandler((error) => {
  console.error("Server error:", error);
});

// Build the server
const server = builder.build();

// Connect to stdio transport
server.connect(new StdioServerTransport()).then(() => {
  console.error("Server connected to transport");
}).catch(error => {
  console.error("Server connection error:", error);
  process.exit(1);
});

console.error("Test server started and listening");

// Handle exit
process.on('SIGINT', () => {
  console.error('Server shutting down...');
  process.exit(0);
}); 