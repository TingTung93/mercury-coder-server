import { McpError, ErrorCode } from "./types/index.js";
import { LocalTool, getAvailableTools } from "./local_tools/index.js";

// Reuse or adapt the ApiToolCall interface from mercuryApi.ts if needed
// Or define it here if preferred
interface ApiToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string; // JSON string
    };
}

export class ToolDispatcher {
    private localTools: Map<string, LocalTool>;

    constructor() {
        // Load available local tools into a map for quick lookup
        this.localTools = new Map();
        const tools = getAvailableTools(); // Assuming this returns an array of LocalTool instances
        for (const tool of tools) {
            this.localTools.set(tool.getDefinition().name, tool);
        }
        console.log(`ToolDispatcher initialized with tools: ${Array.from(this.localTools.keys()).join(', ')}`);
    }

    /**
     * Dispatches a tool call received from the AI to the appropriate local tool implementation.
     * @param toolCall The tool call object from the AI API response.
     * @returns The result of the tool execution.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async dispatch(toolCall: ApiToolCall): Promise<any> {
        if (toolCall.type !== 'function') {
            throw new McpError(ErrorCode.InvalidRequest, `Unsupported tool type: ${toolCall.type}`);
        }

        const toolName = toolCall.function.name;
        const tool = this.localTools.get(toolName);

        if (!tool) {
            console.error(`Attempted to call unknown tool: ${toolName}`);
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool requested by AI: ${toolName}`);
        }

        let parsedArgs: unknown;
        try {
            parsedArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch (error) {
            console.error(`Failed to parse arguments for tool ${toolName}:`, toolCall.function.arguments, error);
            throw new McpError(
                ErrorCode.InvalidParams,
                `Invalid JSON arguments received for tool ${toolName}: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        console.log(`Dispatching tool: ${toolName} with args:`, parsedArgs);

        try {
            // Validate arguments against the tool's input schema (implementation within the tool's execute method is recommended)
            // const validationResult = tool.validate(parsedArgs);
            // if (!validationResult.valid) { ... }

            // Execute the tool
            const result = await tool.execute(parsedArgs); // Assuming execute handles validation internally
            console.log(`Tool ${toolName} executed successfully, result:`, result);
            // Ensure the result is serializable (e.g., string, object, number, boolean)
            return result;
        } catch (error) {
            console.error(`Error during execution of tool ${toolName}:`, error);
            // Propagate McpErrors, wrap others
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(
                ErrorCode.InternalError,
                `Tool execution failed for ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error.stack : undefined
            );
        }
    }
} 