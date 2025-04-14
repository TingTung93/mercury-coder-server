import { z } from "zod";
import { McpError, ErrorCode } from "../types/index.js";

// Define the structure for a tool definition compatible with OpenAI/Mercury API
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: z.ZodObject<any>; // Using Zod for schema definition and validation
}

// Interface for a local tool implementation
export interface LocalTool {
    getDefinition(): ToolDefinition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute(args: any): Promise<any>; // Executes the tool, should handle validation internally
}

// Utility base class for tools using Zod for validation
export abstract class ZodValidatedTool<TInputSchema extends z.ZodObject<any>> implements LocalTool {
    abstract definition: ToolDefinition;

    getDefinition(): ToolDefinition {
        return this.definition;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute(rawArgs: any): Promise<any> {
        try {
            // Validate input arguments using the Zod schema
            const validatedArgs = this.definition.inputSchema.parse(rawArgs);
            // Call the type-safe implementation method
            return await this.implement(validatedArgs);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error(`Invalid arguments for tool ${this.definition.name}:`, error.errors);
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `Invalid arguments for tool ${this.definition.name}: ${error.errors.map(e => `${e.path.join('.')} (${e.message})`).join(', ')}`
                );
            } else {
                // Re-throw other errors (e.g., McpError from implement or unexpected errors)
                throw error;
            }
        }
    }

    /**
     * Abstract method to be implemented by concrete tool classes.
     * Receives validated arguments according to the tool's inputSchema.
     */
    protected abstract implement(validatedArgs: z.infer<TInputSchema>): Promise<any>;
}