import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { ZodValidatedTool, ToolDefinition } from "./baseTool.js";
import { McpError, ErrorCode } from "../types/index.js";
import { REQUEST_CONFIG } from "../config/index.js"; // For MAX_FILE_SIZE

// Define the Zod schema for the input
const ReadFileInputSchema = z.object({
    target_file: z.string().describe("The path of the file to read relative to the workspace root."),
    start_line_one_indexed: z.optional(z.number().int().positive()).describe("The 1-indexed line number to start reading from (inclusive). Defaults to reading from the beginning."),
    end_line_one_indexed_inclusive: z.optional(z.number().int().positive()).describe("The 1-indexed line number to end reading at (inclusive). Defaults to reading until the end.")
});

type ReadFileArgs = z.infer<typeof ReadFileInputSchema>;

export class ReadFileTool extends ZodValidatedTool<typeof ReadFileInputSchema> {
    definition: ToolDefinition = {
        name: "read_file",
        description: "Reads the contents of a file within the workspace. Can read the entire file or a specific line range.",
        inputSchema: ReadFileInputSchema
    };

    protected async implement(args: ReadFileArgs): Promise<string> {
        const { target_file, start_line_one_indexed, end_line_one_indexed_inclusive } = args;

        // Basic path sanitization (prevent absolute paths, directory traversal)
        // More robust sanitization might be needed depending on security requirements
        const workspaceRoot = process.cwd(); // Assuming server runs from workspace root
        const absolutePath = path.resolve(workspaceRoot, target_file);

        if (!absolutePath.startsWith(workspaceRoot + path.sep) && absolutePath !== workspaceRoot) {
            throw new McpError(ErrorCode.InvalidParams, "File path must be within the workspace.");
        }
        if (target_file.includes("..")) {
             throw new McpError(ErrorCode.InvalidParams, "Invalid file path: Directory traversal is not allowed.");
        }

        try {
            // Check file size before reading
            const stats = await fs.stat(absolutePath);
            if (stats.size > REQUEST_CONFIG.MAX_FILE_SIZE) { // Reuse config value
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `File size (${stats.size} bytes) exceeds maximum allowed (${REQUEST_CONFIG.MAX_FILE_SIZE} bytes)`
                );
            }
            if (!stats.isFile()) {
                throw new McpError(ErrorCode.InvalidParams, `Target path is not a file: ${target_file}`);
            }

            const content = await fs.readFile(absolutePath, 'utf-8');

            // Handle line range selection
            if (start_line_one_indexed || end_line_one_indexed_inclusive) {
                const lines = content.split(/\r?\n/);
                const start = (start_line_one_indexed ?? 1) - 1; // Convert to 0-indexed
                const end = (end_line_one_indexed_inclusive ?? lines.length); // Default to end

                if (start < 0 || start >= lines.length) {
                     throw new McpError(ErrorCode.InvalidParams, `Invalid start line: ${start_line_one_indexed}. File has ${lines.length} lines.`);
                }
                if (end < start || end > lines.length) {
                     throw new McpError(ErrorCode.InvalidParams, `Invalid end line: ${end_line_one_indexed_inclusive}. File has ${lines.length} lines.`);
                }

                return lines.slice(start, end).join('\n');
            }

            return content;

        } catch (error) {
            if (error instanceof McpError) throw error;
            if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new McpError(ErrorCode.InvalidParams, `File not found: ${target_file}`);
            }
            console.error(`Error reading file ${target_file}:`, error);
            throw new McpError(ErrorCode.InternalError, `Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}