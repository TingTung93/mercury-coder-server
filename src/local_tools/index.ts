import { LocalTool, ToolDefinition, ZodValidatedTool } from "./baseTool.js";

// --- Concrete Tool Implementations ---
// (Import them here and add to the array below)
import { ReadFileTool } from "./readFileTool.js";
import { getAllCodeTools } from "./codeTools/index.js";
import { McpCompleteClientTool } from "./mcpCompleteClientTool.js";
import { McpApiClientTool } from "./mcpApiClientTool.js";

// Function to get all available tools
// This is imported by index.ts and toolDispatcher.ts
export function getAvailableTools(): LocalTool[] {
    // Add instances of your implemented tools here
    const tools: LocalTool[] = [
        new ReadFileTool(),
        // Add all code-related tools
        ...getAllCodeTools(),
        // Add the MCP-specific tools for direct Mercury API access
        new McpCompleteClientTool(),
        new McpApiClientTool()
    ];

    return tools;
}

// Re-export the types and classes
export { ZodValidatedTool };
export type { LocalTool, ToolDefinition };