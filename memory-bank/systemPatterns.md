# System Patterns

## 1. Architectural Overview

The server implements the Model Context Protocol using the `@modelcontextprotocol/sdk`. It acts as a JSON-RPC server over stdio (`StdioServerTransport`). It does **not** use a traditional web framework like Express. The core architecture revolves around defining server capabilities (a fixed set of tools) and handling `listTools` and `callTool` requests.

## 2. Key Components

- **`@modelcontextprotocol/sdk` (`Server`, `StdioServerTransport`):** Provides the core MCP server implementation and transport layer.
- **`src/index.ts` (`MercuryCoderServer`):** Main application class. Initializes the SDK `Server`, defines tool capabilities based on config, and registers request handlers. Contains potentially fragile manual parameter validation for `callTool`.
- **`src/config/index.ts`:** Central configuration for API details, server info, request limits, caching, and **tool schemas including prompt templates**.
- **`src/tools/handlers.ts`:** Defines specific handler instances using the factory.
- **`src/tools/handlerFactory.ts` (`ToolHandlerFactory`):** Creates tool handlers. Each handler wraps `BaseToolHandler` logic. Includes basic input sanitization.
- **`src/tools/base.ts` (`BaseToolHandler`):** Contains the logic for interacting with the external Mercury API (`callMercuryAPI` using `axios`). Implements prompt formatting, retries, caching, basic chunking, and context file reading. **Crucially, it does *not* contain logic to execute arbitrary local tools based on API instructions.**
- **`src/tools/cache.ts` (`ResponseCache`):** Simple time-based and size-limited cache for API responses.
- **`zod`:** Used for schema definition and validation (though bypassed for `callTool` params in `index.ts`).

## 3. Communication Flow (Current)

1.  **Client (e.g., IDE Extension) -> Stdio Transport -> MCP Server (`index.ts`)**
2.  Server receives JSON-RPC request (`listTools` or `callTool`).
3.  **`listTools`:** Server returns the list of tools defined in `config/index.ts`.
4.  **`callTool`:**
    a. `index.ts` handler validates parameters *manually* using `CallToolParamsSchema`.
    b. If valid, identifies the handler (e.g., `AnalyzeCodeHandler`) based on `params.name`.
    c. Calls `handler.handle(params.arguments)`.
    d. `handlerFactory.ts` / `base.ts` validates arguments again, formats a prompt using the template from `config/index.ts` and the provided arguments.
    e. `base.ts` calls the external Mercury API (`API_CONFIG.URL`) via `axios.post` with the formatted prompt.
    f. Mercury API processes the prompt (e.g., analyzes code) and returns a result.
    g. `base.ts` receives the response.
    h. Response is returned through the layers back to the client via stdio.

**Note:** The flow *lacks* a step where the Mercury API could instruct the MCP server to use *other* tools (like file system edits, terminal commands).

## 4. Design Decisions (Existing)

- **Protocol Choice:** Relies entirely on `@modelcontextprotocol/sdk` and stdio transport.
- **Tool Definition:** Tools are defined statically in `config/index.ts` with fixed prompt templates. They represent specific Mercury API functionalities, not general capabilities the server can execute locally.
- **Parameter Validation:** Mixed approach - SDK schema for `listTools`, manual Zod validation for `callTool` params in `index.ts`. Internal argument validation within handlers.
- **API Interaction:** Uses `axios` with custom retry, caching, and basic chunking logic in `BaseToolHandler`.
- **Error Handling:** Uses `McpError` from SDK/types, but wrapping in handlers might obscure details. Basic `console.error` logging.
- **Configuration:** Centralized in `config/index.ts`. Requires `MERCURY_API_KEY` environment variable.

## 5. Design Decisions (Proposed - Refactoring)

*(To be developed in the Planning Phase. Key areas: Aligning with true tool-use paradigm, robust parameter handling via SDK, safer API interaction, proper local tool execution engine.)* 