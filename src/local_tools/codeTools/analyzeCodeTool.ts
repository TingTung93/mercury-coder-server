import { z } from "zod";
import { ToolDefinition } from "../index.js";
import { BaseCodeTool } from "./baseCodeTool.js";
import { TOOL_SCHEMAS } from "../../config/index.js";
import { AnalyzeCodeArgs } from "../../types/index.js";

/**
 * Tool for analyzing code and suggesting improvements
 */
export class AnalyzeCodeTool extends BaseCodeTool<z.ZodObject<{
    code: z.ZodString;
    language: z.ZodString;
}>> {
    definition: ToolDefinition = {
        name: TOOL_SCHEMAS.ANALYZE.name,
        description: TOOL_SCHEMAS.ANALYZE.description,
        inputSchema: z.object({
            code: z.string().describe("The code to process"),
            language: z.string().describe("Programming language of the code")
        })
    };

    protected formatPrompt(args: AnalyzeCodeArgs): string {
        return TOOL_SCHEMAS.ANALYZE.promptTemplate
            .replace("{code}", args.code)
            .replace("{language}", args.language);
    }

    /**
     * Implements the 'analyze_code' tool functionality
     */
    protected async implement(args: AnalyzeCodeArgs): Promise<string> {
        console.log(`Analyzing ${args.language} code...`);
        
        // Validate code length
        if (args.code.length > 50000) {
            throw new Error("Code too large to analyze (max 50,000 characters)");
        }

        // Format the prompt based on the template
        const prompt = this.formatPrompt(args);
        
        // Call the API with the formatted prompt
        return await this.callMercuryApi(prompt);
    }
} 