import { z } from "zod";
import { ToolDefinition } from "../index.js";
import { BaseCodeTool } from "./baseCodeTool.js";
import { TOOL_SCHEMAS } from "../../config/index.js";
import { GenerateCodeArgs } from "../../types/index.js";

/**
 * Tool for generating code from detailed instructions
 */
export class GenerateCodeTool extends BaseCodeTool<z.ZodObject<{
    instructions: z.ZodString;
    language: z.ZodString;
    template: z.ZodString | z.ZodOptional<z.ZodString>;
}>> {
    definition: ToolDefinition = {
        name: TOOL_SCHEMAS.GENERATE.name,
        description: TOOL_SCHEMAS.GENERATE.description,
        inputSchema: z.object({
            instructions: z.string().describe("Detailed instructions for code generation"),
            language: z.string().describe("Target programming language"),
            template: z.string().optional().describe("Optional template or starting code")
        })
    };

    protected formatPrompt(args: GenerateCodeArgs): string {
        let prompt = TOOL_SCHEMAS.GENERATE.promptTemplate
            .replace("{instructions}", args.instructions)
            .replace("{language}", args.language);
        
        // Replace template if provided, otherwise remove the placeholder
        if (args.template) {
            prompt = prompt.replace("{template}", `Starting from this template:\n${args.template}`);
        } else {
            prompt = prompt.replace("{template}", "");
        }
        
        return prompt;
    }

    /**
     * Implements the 'generate_code' tool functionality
     */
    protected async implement(args: GenerateCodeArgs): Promise<string> {
        console.log(`Generating ${args.language} code from instructions...`);
        
        // Validate instructions length
        if (args.instructions.length > 10000) {
            throw new Error("Instructions too large (max 10,000 characters)");
        }

        // Validate template length if provided
        if (args.template && args.template.length > 50000) {
            throw new Error("Template too large (max 50,000 characters)");
        }

        // Format the prompt based on the template
        const prompt = this.formatPrompt(args);
        
        // Call the API with the formatted prompt
        return await this.callMercuryApi(prompt);
    }
} 