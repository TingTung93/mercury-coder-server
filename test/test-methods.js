import { McpServerBuilder } from '@modelcontextprotocol/sdk/server/index.js';

console.log("Starting test server with explicit chat method");

// Create a server builder
const builder = new McpServerBuilder();

// Define server capabilities
builder.setCapabilities({
  methods: ['chat', 'ping'],
  tools: []
});

// Add a ping handler
builder.addRequestHandler('ping', async (request) => {
  console.log("Handling ping request:", request);
  return {};
});

// Add a chat handler
builder.addRequestHandler('chat', async (request) => {
  console.log("Handling chat request:", request);
  return {
    response: "This is a test response to your message: " + request.message
  };
});

// Configure error handler
builder.setErrorHandler((error) => {
  console.error("Server error:", error);
});

// Build and start the server
const server = builder.build();
server.listen();

console.log("Test server started and listening");

// Handle exit
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit(0);
}); 