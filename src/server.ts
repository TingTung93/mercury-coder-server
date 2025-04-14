#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { SERVER_CONFIG } from "./config/index.js";

// Import the new components
import { MercuryApi } from "./mercuryApi.js";
import { ToolDispatcher } from "./toolDispatcher.js";
import { LocalTool, getAvailableTools } from "./local_tools/index.js";

console.error("Initializing Mercury Coder Server...");

// Check API key
if (!process.env.MERCURY_API_KEY) {
  console.error("MERCURY_API_KEY environment variable is required");
  process.exit(1);
}

// Create API components
const mercuryApi = new MercuryApi();
const toolDispatcher = new ToolDispatcher();

// Get definitions of available local tools
const localTools: LocalTool[] = getAvailableTools();
const localToolDefinitions = localTools.map((tool: LocalTool) => tool.getDefinition());

console.error(`Available tools: ${localToolDefinitions.map(t => t.name).join(', ')}`);

// Create the MCP Server with both chat and ping methods
const server = new Server(
  {
    name: SERVER_CONFIG.NAME,
    version: SERVER_CONFIG.VERSION,
  },
  {
    capabilities: {
      methods: ["chat", "ping"],
      tools: {}
    },
  }
);

console.error("Server capabilities configured with methods: chat, ping");

// Set up the initialization callback
server.oninitialized = () => {
  console.error("Server initialized with client");
  console.error("Client capabilities:", server.getClientCapabilities());
};

// Set the error handler
server.onerror = (error) => {
  console.error("[MCP Server Error]", error);
};

// Define fallback handler for all methods
server.fallbackRequestHandler = async (request) => {
  console.error(`⭐ DEBUG: Received request: ${JSON.stringify(request, null, 2)}`);
  
  // Handle chat method
  if (request.method === 'chat') {
    console.error("⭐ DEBUG: Processing chat request");
    
    // Extract parameters from the request
    const params = request.params || {};
    const message = params.message;
    const context = params.context;
    const _meta = params._meta;
    
    // Validate required parameters
    if (!message || typeof message !== 'string') {
      console.error("⭐ DEBUG: Invalid message parameter:", message);
      throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'message' parameter");
    }
    
    try {
      console.error(`⭐ DEBUG: Processing message: "${message.substring(0, 30)}..."`);
      
      // Call Mercury API
      const finalResponse = await mercuryApi.callWithToolHandling(
        message,
        context,
        getAvailableTools(),
        toolDispatcher,
        _meta?.progressToken 
          ? (progressMessage: string) => {
              server.notification({
                method: '$/progress',
                params: {
                  token: _meta.progressToken,
                  value: { kind: 'report', message: progressMessage }
                }
              });
            }
          : () => {}
      );
      
      console.error(`⭐ DEBUG: Got response from Mercury API`);
      
      // Return the content in expected format
      return {
        content: finalResponse.content
      };
    } catch (error) {
      console.error("⭐ DEBUG: Error handling chat request:", error);
      if (error instanceof McpError) {
        throw error;
      } else if (error instanceof Error) {
        throw new McpError(ErrorCode.InternalError, `Handler failed: ${error.message}`, error.stack);
      } else {
        throw new McpError(ErrorCode.InternalError, "An unknown error occurred");
      }
    }
  }
  
  // Handle ping method
  if (request.method === 'ping') {
    console.error("⭐ DEBUG: Handling ping request");
    return {};
  }
  
  // Reject all other methods
  console.error(`⭐ DEBUG: Method '${request.method}' not found`);
  throw new McpError(ErrorCode.MethodNotFound, `Method '${request.method}' not found`);
};

// Connect to stdio transport
const transport = new StdioServerTransport();
console.error("Connecting server to stdio transport...");
server.connect(transport)
  .then(() => {
    console.error(`${SERVER_CONFIG.NAME} v${SERVER_CONFIG.VERSION} MCP server running on stdio`);
  })
  .catch(error => {
    console.error("Failed to connect to transport:", error);
    process.exit(1);
  });

// Handle SIGINT for graceful shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down server...");
  await server.close();
  process.exit(0);
}); 