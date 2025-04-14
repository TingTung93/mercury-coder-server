import { z } from "zod";
import { ToolDefinition } from "../index.js";
import { BaseCodeTool } from "./baseCodeTool.js";
import { TOOL_SCHEMAS } from "../../config/index.js";
import { FormatCodeArgs } from "../../types/index.js";

/**
 * Tool for formatting code according to language standards
 */
export class FormatCodeTool extends BaseCodeTool<z.ZodObject<{
    code: z.ZodString;
    language: z.ZodString;
    style: z.ZodString | z.ZodOptional<z.ZodString>;
}>> {
    definition: ToolDefinition = {
        name: TOOL_SCHEMAS.FORMAT.name,
        description: TOOL_SCHEMAS.FORMAT.description,
        inputSchema: z.object({
            code: z.string().describe("The code to process"),
            language: z.string().describe("Programming language of the code"),
            style: z.string().optional().describe("Optional formatting style guide (e.g., 'prettier', 'google')")
        })
    };

    protected formatPrompt(args: FormatCodeArgs): string {
        let prompt = TOOL_SCHEMAS.FORMAT.promptTemplate
            .replace("{code}", args.code)
            .replace("{language}", args.language);
        
        // Replace style if provided, otherwise remove the placeholder
        if (args.style) {
            prompt = prompt.replace("{style}", args.style);
        } else {
            prompt = prompt.replace("{style}", "standard");
        }
        
        return prompt;
    }

    /**
     * Implements the 'format_code' tool functionality
     */
    protected async implement(args: FormatCodeArgs): Promise<string> {
        console.log(`Formatting ${args.language} code...`);
        
        // Validate code length
        if (args.code.length > 50000) {
            throw new Error("Code too large to format (max 50,000 characters)");
        }

        // Format the prompt based on the template
        const prompt = this.formatPrompt(args);
        
        // Call the API with the formatted prompt
        return await this.callMercuryApi(prompt);
    }
} 