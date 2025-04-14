#!/usr/bin/env node

import 'dotenv/config';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    // ListToolsRequestSchema, // Keep for now if needed for local tool listing, but the primary flow changes
    McpError,
    ErrorCode,
    ProgressTokenSchema,
    // Import necessary types for a chat/completion request if available in SDK
    // If not, define them based on expected MCP client behavior
    ResultSchema, // Changed from ResponseSchema
    RequestSchema,
    JSONRPCRequestSchema, // Changed from JsonRpcRequest
    JSONRPCRequest
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { SERVER_CONFIG } from "./config/index.js";
// Remove imports for old handlers and TOOL_SCHEMAS
// import { TOOL_SCHEMAS } from "./config/index.js";
// import { ... } from "./tools/handlers.js";

// Import the new components we will create later
import { MercuryApi } from "./mercuryApi.js";
import { ToolDispatcher } from "./toolDispatcher.js";
import { LocalTool, getAvailableTools } from "./local_tools/index.js"; // Changed from localTools to local_tools

// Define schemas for request methods
const ChatRequestSchema = z.object({
  method: z.literal("chat"),
  params: z.object({
    message: z.string(),
    context: z.optional(z.object({
      filePath: z.optional(z.string()),
      code: z.optional(z.string()),
    }).passthrough()),
    _meta: z.optional(z.object({
      progressToken: z.optional(ProgressTokenSchema)
    }).passthrough())
  }).passthrough()
});

const PingRequestSchema = z.object({
  method: z.literal("ping")
});

// Define response schemas
const ChatResponseSchema = z.object({
  content: z.string()
});

type ChatHandlerResponse = z.infer<typeof ChatResponseSchema>;
type ChatRequest = z.infer<typeof ChatRequestSchema>;
type ChatParams = ChatRequest['params'];

// Define fallback handler request type to match Server's expected type
interface FallbackRequest {
  method: string;
  params?: any;
}

/**
 * Mercury Coder Server main class
 */
class MercuryCoderServer {
  private server: Server;
  private mercuryApi: MercuryApi;
  private toolDispatcher: ToolDispatcher;
  private _methods: string[] = [];

  constructor() {
    console.error("💥 INIT: Initializing Mercury Coder Server...");
    console.error(`💥 INIT: Process args: ${process.argv.join(' ')}`);

    // Check for API key - use default from config if not set in environment
    if (!process.env.MERCURY_API_KEY) {
      console.error("WARNING: MERCURY_API_KEY environment variable not found, using fallback value");
      // The fallback value will be used from API_CONFIG.KEY
    }

    // Create API components
    this.mercuryApi = new MercuryApi();
    this.toolDispatcher = new ToolDispatcher();

    // Get definitions of available local tools
    const localTools: LocalTool[] = getAvailableTools();
    const localToolDefinitions = localTools.map((tool: LocalTool) => tool.getDefinition());
    
    console.error(`💥 INIT: Available tools: ${localToolDefinitions.map(t => t.name).join(', ')}`);

    // Store methods for later checking
    this._methods = ["chat", "ping", "callTool"];
    
    // Initialize the MCP Server with required capabilities
    console.error("💥 INIT: Creating server instance with capabilities for chat and ping methods");
    this.server = new Server(
      {
        name: SERVER_CONFIG.NAME,
        version: SERVER_CONFIG.VERSION,
      },
      {
        capabilities: {
          methods: this._methods,
          tools: Object.fromEntries(
            localToolDefinitions.map(tool => [
              tool.name, 
              { 
                description: tool.description,
                inputSchema: tool.inputSchema 
              }
            ])
          )
        },
      }
    );

    console.error("💥 INIT: Server capabilities configured with methods:", this._methods.join(", "));
    console.error("💥 INIT: Server capabilities object:", JSON.stringify((this.server as any).capabilities, null, 2));

    // Set up the initialization callback
    this.server.oninitialized = () => {
      console.error("💥 INIT: Server initialized with client");
      try {
        console.error("💥 INIT: Client capabilities:", this.server.getClientCapabilities());
        console.error("💥 INIT: Client version:", this.server.getClientVersion());
      } catch (error) {
        console.error("💥 INIT: Unable to get client info:", error);
      }
    };

    // Define a fallback handler which handles all methods
    console.error("💥 INIT: Setting up fallback request handler for all methods");
    this.server.fallbackRequestHandler = async (request: FallbackRequest) => {
      console.error(`🟥 HANDLER: Received request for method: "${request.method}"`);
      console.error(`🟥 HANDLER: Method type: ${typeof request.method}`);
      console.error(`🟥 HANDLER: Our registered methods: ${this._methods.join(', ')}`);
      console.error(`🟥 HANDLER: Full request:`, JSON.stringify(request, null, 2));
      
      try {
        // Log server capabilities and other debug info
        console.error(`🟥 HANDLER: Server capabilities:`, JSON.stringify((this.server as any).capabilities, null, 2));
        console.error(`🟥 HANDLER: Server self._methods:`, this._methods);
        // Look at all properties on the server object that might be relevant
        console.error(`🟥 HANDLER: Server available methods:`, Object.keys(this.server).filter(key => typeof (this.server as any)[key] === 'function'));
      } catch (e) {
        console.error(`🟥 HANDLER: Error getting server debug info:`, e);
      }
      
      // Check for exact equality with our registered methods
      if (this._methods.includes(request.method)) {
        console.error(`🟥 HANDLER: Method '${request.method}' is in our registered methods array`);
      } else {
        console.error(`🟥 HANDLER: Method '${request.method}' is NOT in our registered methods array`);
      }
      
      // Perform string equality checks
      console.error(`🟥 HANDLER: 'chat' === request.method: ${'chat' === request.method}`);
      console.error(`🟥 HANDLER: 'ping' === request.method: ${'ping' === request.method}`);
      
      // Check for ping method with exact equality
      if (request.method === 'ping') {
        console.error("🟦 PING: Handling ping request");
        return {};
      }
      
      // Check for chat method with exact equality
      if (request.method === 'chat') {
        console.error("🟩 CHAT: Processing chat request");
        
        // Extract parameters from the request
        const params = request.params || {};
        const message = params.message;
        const context = params.context;
        
        console.error(`🟩 CHAT: Message: "${message}"`);
        console.error(`🟩 CHAT: Context: ${JSON.stringify(context)}`);
        
        // Validate required parameters
        if (!message || typeof message !== 'string') {
          console.error("🟩 CHAT: Invalid message parameter:", message);
          throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'message' parameter");
        }
        
        console.error(`🟩 CHAT: Processing message: "${message.substring(0, 30)}..."`);
        
        try {
          // Use real API calls instead of mock responses
          console.error("🟩 CHAT: Calling Mercury API with message and context");
          const response = await this.mercuryApi.callWithToolHandling(
            message, 
            context, 
            getAvailableTools(),
            this.toolDispatcher,
            (progressMsg) => console.error(`🟩 CHAT PROGRESS: ${progressMsg}`)
          );
          
          console.error("🟩 CHAT: Mercury API call completed, returning response");
          return {
            result: response
          };
        } catch (error) {
          console.error("🟩 CHAT: Error processing chat request:", error);
          if (error instanceof McpError) {
            throw error;
          }
          throw new McpError(
            ErrorCode.InternalError, 
            `Chat handler failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
      
      // Add callTool method handler
      if (request.method === 'callTool') {
        console.error("🔧 TOOL: Processing tool call request");
        
        // Extract parameters from the request
        const params = request.params || {};
        const toolName = params.name;
        const toolArgs = params.arguments;
        
        console.error(`🔧 TOOL: Tool name: "${toolName}"`);
        console.error(`🔧 TOOL: Tool args: ${JSON.stringify(toolArgs)}`);
        
        if (!toolName || typeof toolName !== 'string') {
          console.error("🔧 TOOL: Invalid tool name parameter:", toolName);
          throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'name' parameter");
        }
        
        if (!toolArgs || typeof toolArgs !== 'object') {
          console.error("🔧 TOOL: Invalid tool arguments parameter:", toolArgs);
          throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'arguments' parameter");
        }
        
        try {
          // Create a tool call object to pass to the dispatcher
          const toolCall = {
            id: `tool-call-${Date.now()}`,
            type: "function" as const,  // Use const assertion to make this have the literal type "function"
            function: {
              name: toolName,
              arguments: JSON.stringify(toolArgs)
            }
          };
          
          console.error(`🔧 TOOL: Dispatching tool: ${toolName}`);
          const result = await this.toolDispatcher.dispatch(toolCall);
          console.error(`🔧 TOOL: Tool execution completed`);
          
          return {
            result: result
          };
        } catch (error) {
          console.error("🔧 TOOL: Error processing tool call:", error);
          if (error instanceof McpError) {
            throw error;
          }
          throw new McpError(
            ErrorCode.InternalError, 
            `Tool call handler failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
      
      // If we get here, the method is not recognized
      console.error(`🟥 HANDLER: Method '${request.method}' not found`);
      throw new McpError(ErrorCode.MethodNotFound, `Method '${request.method}' not found`);
    };

    // Error handling
    this.server.onerror = (error: Error) => console.error("💥 ERROR: [MCP Server Error]", error);
    
    // Handle SIGINT for graceful shutdown
    process.on("SIGINT", async () => {
      console.error("💥 SHUTDOWN: Received SIGINT, shutting down server");
      await this.server.close();
      process.exit(0);
    });

    console.error("💥 INIT: Mercury Coder Server initialization complete");
  }

  async run() {
    try {
      // Log environmental info before connecting
      console.error(`💥 RUN: Starting with process ID: ${process.pid}`);
      console.error(`💥 RUN: Running on Node.js: ${process.version}`);
      console.error(`💥 RUN: Platform: ${process.platform}`);
      
      // Connect to stdio transport
      const transport = new StdioServerTransport();
      console.error("💥 RUN: Connecting server to stdio transport...");
      await this.server.connect(transport);
      console.error(`💥 RUN: ${SERVER_CONFIG.NAME} v${SERVER_CONFIG.VERSION} MCP server running on stdio`);
      
      // Also log to stdout for better diagnostics
      console.log(`${SERVER_CONFIG.NAME} v${SERVER_CONFIG.VERSION} Mercury Coder MCP server running on stdio`);
    } catch (error) {
      console.error("💥 ERROR: Failed to connect to transport:", error);
      throw error;
    }
  }
}

// Start server
console.error("💥 MAIN: Creating server instance");
const server = new MercuryCoderServer();
console.error("💥 MAIN: Starting server");
server.run().catch((error) => {
  console.error("💥 ERROR: Server failed to run:", error);
  process.exit(1);
});

// Keep export if needed elsewhere, otherwise remove if entry point only
// export { MercuryCoderServer };

