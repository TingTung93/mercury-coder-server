import { z } from "zod";
import { ToolDefinition } from "../index.js";
import { BaseCodeTool } from "./baseCodeTool.js";
import { TOOL_SCHEMAS } from "../../config/index.js";
import { DebugCodeArgs } from "../../types/index.js";

/**
 * Tool for debugging code and suggesting fixes
 */
export class DebugCodeTool extends BaseCodeTool<z.ZodObject<{
    code: z.ZodString;
    language: z.ZodString;
    error: z.ZodString | z.ZodOptional<z.ZodString>;
}>> {
    definition: ToolDefinition = {
        name: TOOL_SCHEMAS.DEBUG.name,
        description: TOOL_SCHEMAS.DEBUG.description,
        inputSchema: z.object({
            code: z.string().describe("The code to process"),
            language: z.string().describe("Programming language of the code"),
            error: z.string().optional().describe("Error message or description of the issue")
        })
    };

    protected formatPrompt(args: DebugCodeArgs): string {
        let prompt = TOOL_SCHEMAS.DEBUG.promptTemplate
            .replace("{code}", args.code)
            .replace("{language}", args.language);
        
        // Replace error if provided, otherwise remove the placeholder
        if (args.error) {
            prompt = prompt.replace("{error}", `Error: ${args.error}`);
        } else {
            prompt = prompt.replace("{error}", "");
        }
        
        return prompt;
    }

    /**
     * Implements the 'debug_code' tool functionality
     */
    protected async implement(args: DebugCodeArgs): Promise<string> {
        console.log(`Debugging ${args.language} code...`);
        
        // Validate code length
        if (args.code.length > 50000) {
            throw new Error("Code too large to debug (max 50,000 characters)");
        }

        // Format the prompt based on the template
        const prompt = this.formatPrompt(args);
        
        // Call the API with the formatted prompt
        return await this.callMercuryApi(prompt);
    }
} 