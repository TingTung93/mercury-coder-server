#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpError, ErrorCode, Request } from "@modelcontextprotocol/sdk/types.js";

// Constants for server configuration
const SERVER_CONFIG = {
  NAME: "Mercury Coder Simple Server",
  VERSION: "0.1.0"
};

console.error("Initializing Simple Mercury Coder Server...");

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
  try {
    console.error("Client capabilities:", server.getClientCapabilities());
  } catch (error) {
    console.error("Unable to get client info:", error);
  }
};

// Set the error handler
server.onerror = (error) => {
  console.error("[MCP Server Error]", error);
};

// Define types for chat parameters
interface ChatParams {
  message: string;
  context?: {
    code?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Handle incoming requests
server.fallbackRequestHandler = async (request: Request) => {
  console.error(`DEBUG: Received request method: ${request.method}`);
  console.error(`DEBUG: Received request params: ${JSON.stringify(request.params)}`);

  try {
    // Handle ping method
    if (request.method === 'ping') {
      console.error('DEBUG: Processing ping request');
      return {
        result: {}
      };
    }

    // Handle chat method
    if (request.method === 'chat') {
      console.error('DEBUG: Processing chat request');
      
      // Parse params
      const params = request.params as ChatParams;
      const { message, context = {} } = params;
      
      if (!message) {
        return {
          error: {
            code: -32602,
            message: 'Invalid params: message is required'
          }
        };
      }
      
      // Generate a simple response
      let responseText = `You said: ${message}`;
      
      if (context && context.code) {
        responseText += `\nContext code length: ${context.code.length}`;
      }
      
      return {
        result: {
          message: responseText
        }
      };
    }

    // Reject all other methods
    console.error(`DEBUG: Method '${request.method}' not found`);
    throw new McpError(ErrorCode.MethodNotFound, `Method '${request.method}' not found`);
  } catch (error) {
    console.error("DEBUG: Error handling request:", error);
    if (error instanceof McpError) {
      throw error;
    } else if (error instanceof Error) {
      throw new McpError(ErrorCode.InternalError, `Handler failed: ${error.message}`, error.stack);
    } else {
      throw new McpError(ErrorCode.InternalError, "An unknown error occurred");
    }
  }
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
  console.error("Received SIGINT, shutting down server");
  await server.close();
  process.exit(0);
}); 