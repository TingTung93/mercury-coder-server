import { z } from "zod";
import { ToolDefinition } from "../index.js";
import { BaseCodeTool } from "./baseCodeTool.js";
import { TOOL_SCHEMAS } from "../../config/index.js";
import { RefactorCodeArgs } from "../../types/index.js";

/**
 * Tool for refactoring code according to best practices
 */
export class RefactorCodeTool extends BaseCodeTool<z.ZodObject<{
    code: z.ZodString;
    language: z.ZodString;
    instructions: z.ZodString | z.ZodOptional<z.ZodString>;
}>> {
    definition: ToolDefinition = {
        name: TOOL_SCHEMAS.REFACTOR.name,
        description: TOOL_SCHEMAS.REFACTOR.description,
        inputSchema: z.object({
            code: z.string().describe("The code to process"),
            language: z.string().describe("Programming language of the code"),
            instructions: z.string().optional().describe("Specific refactoring instructions")
        })
    };

    protected formatPrompt(args: RefactorCodeArgs): string {
        let prompt = TOOL_SCHEMAS.REFACTOR.promptTemplate
            .replace("{code}", args.code)
            .replace("{language}", args.language);
        
        // Replace instructions if provided, otherwise remove the placeholder
        if (args.instructions) {
            prompt = prompt.replace("{instructions}", `Instructions: ${args.instructions}`);
        } else {
            prompt = prompt.replace("{instructions}", "");
        }
        
        return prompt;
    }

    /**
     * Implements the 'refactor_code' tool functionality
     */
    protected async implement(args: RefactorCodeArgs): Promise<string> {
        console.log(`Refactoring ${args.language} code...`);
        
        // Validate code length
        if (args.code.length > 50000) {
            throw new Error("Code too large to refactor (max 50,000 characters)");
        }

        // Format the prompt based on the template
        const prompt = this.formatPrompt(args);
        
        // Call the API with the formatted prompt
        return await this.callMercuryApi(prompt);
    }
} 