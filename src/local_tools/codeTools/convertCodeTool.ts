import { z } from "zod";
import { ToolDefinition } from "../index.js";
import { BaseCodeTool } from "./baseCodeTool.js";
import { TOOL_SCHEMAS } from "../../config/index.js";
import { ConvertCodeArgs } from "../../types/index.js";

/**
 * Tool for converting code between programming languages
 */
export class ConvertCodeTool extends BaseCodeTool<z.ZodObject<{
    code: z.ZodString;
    language: z.ZodString;
    targetLanguage: z.ZodString;
}>> {
    definition: ToolDefinition = {
        name: TOOL_SCHEMAS.CONVERT.name,
        description: TOOL_SCHEMAS.CONVERT.description,
        inputSchema: z.object({
            code: z.string().describe("The code to process"),
            language: z.string().describe("Programming language of the code"),
            targetLanguage: z.string().describe("The target programming language")
        })
    };

    protected formatPrompt(args: ConvertCodeArgs): string {
        return TOOL_SCHEMAS.CONVERT.promptTemplate
            .replace("{code}", args.code)
            .replace("{language}", args.language)
            .replace("{targetLanguage}", args.targetLanguage);
    }

    /**
     * Implements the 'convert_code' tool functionality
     */
    protected async implement(args: ConvertCodeArgs): Promise<string> {
        console.log(`Converting code from ${args.language} to ${args.targetLanguage}...`);
        
        // Validate code length
        if (args.code.length > 50000) {
            throw new Error("Code too large to convert (max 50,000 characters)");
        }

        // Format the prompt based on the template
        const prompt = this.formatPrompt(args);
        
        // Call the API with the formatted prompt
        return await this.callMercuryApi(prompt);
    }
} 