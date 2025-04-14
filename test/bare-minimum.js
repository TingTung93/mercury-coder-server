import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

console.error("Starting bare-minimum MCP server...");

// Create the most minimal server possible
const server = new Server(
  { name: 'bare-minimum-server', version: '1.0.0' },
  { 
    capabilities: { 
      // Explicitly list supported methods
      methods: ['chat']
    } 
  }
);

// Log when server is initialized
server.oninitialized = () => {
  console.error("Server initialized with client");
  console.error("Client capabilities:", server.getClientCapabilities());
};

// Set the error handler
server.onerror = (error) => {
  console.error("Server error:", error);
};

// Define fallback handler for all methods
server.fallbackRequestHandler = async (request) => {
  console.error(`Received request: ${JSON.stringify(request, null, 2)}`);
  
  // Very simple chat handler
  if (request.method === 'chat') {
    console.error("Processing chat request");
    return { content: "This is a response from the bare-minimum server" };
  }
  
  // Also handle ping
  if (request.method === 'ping') {
    console.error("Processing ping request");
    return {};
  }
  
  // Reject all other methods
  console.error(`Method '${request.method}' not found`);
  throw new McpError(ErrorCode.MethodNotFound, `Method '${request.method}' not found`);
};

// Connect to stdio transport
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => console.error("Server connected to transport"))
  .catch(error => {
    console.error("Server connection error:", error);
    process.exit(1);
  });

// Handle SIGINT for graceful shutdown
process.on('SIGINT', async () => {
  console.error("Shutting down server...");
  await server.close();
  process.exit(0);
}); 