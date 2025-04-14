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

// --- Concrete Tool Implementations ---
// (Import them here and add to the array below)
import { ReadFileTool } from "./readFileTool.js";

// Function to get all available tools
// This is imported by index.ts and toolDispatcher.ts
export function getAvailableTools(): LocalTool[] {
    // Add instances of your implemented tools here
    const tools: LocalTool[] = [
        new ReadFileTool(),
        // TODO: Add other tools like EditFileTool, RunCommandTool etc.
    ];

    // Return the mock tools for now until real ones are implemented
    // if (tools.length === 0) {
    //      console.warn("Using MOCK local tool definitions in getAvailableTools!");
    //      return [
    //         {
    //             getDefinition: () => ({
    //                 name: "read_file",
    //                 description: "Reads content of a file (MOCK)",
    //                 inputSchema: z.object({ path: z.string().describe("Path to the file") })
    //             }),
    //              execute: async (args: { path: string }) => {
    //                 console.log(`Mock execute read_file for: ${args.path}`);
    //                 return `Mock content of ${args.path}`;
    //              }
    //         },
    //         {
    //             getDefinition: () => ({
    //                 name: "edit_file",
    //                 description: "Edits a file (MOCK)",
    //                 inputSchema: z.object({ path: z.string().describe("Path to the file"), content: z.string().describe("New content") })
    //             }),
    //              execute: async (args: { path: string, content: string }) => {
    //                 console.log(`Mock execute edit_file for: ${args.path}`);
    //                 return `Mock edit successful for ${args.path}`;
    //              }
    //         }
    //      ] as LocalTool[]; // Cast needed because mocks don't fully match interface if methods differ
    // }

    return tools;
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