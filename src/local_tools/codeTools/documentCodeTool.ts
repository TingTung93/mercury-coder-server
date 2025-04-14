import { z } from "zod";
import { ToolDefinition } from "../index.js";
import { BaseCodeTool } from "./baseCodeTool.js";
import { TOOL_SCHEMAS } from "../../config/index.js";
import { DocumentCodeArgs } from "../../types/index.js";

/**
 * Tool for generating code documentation
 */
export class DocumentCodeTool extends BaseCodeTool<z.ZodObject<{
    code: z.ZodString;
    language: z.ZodString;
    style: z.ZodString | z.ZodOptional<z.ZodString>;
    format: z.ZodEnum<["markdown", "jsdoc", "javadoc"]> | z.ZodOptional<z.ZodEnum<["markdown", "jsdoc", "javadoc"]>>;
}>> {
    definition: ToolDefinition = {
        name: TOOL_SCHEMAS.DOCUMENT.name,
        description: TOOL_SCHEMAS.DOCUMENT.description,
        inputSchema: z.object({
            code: z.string().describe("The code to process"),
            language: z.string().describe("Programming language of the code"),
            style: z.string().optional().describe("Optional documentation style (e.g., 'jsdoc', 'google')"),
            format: z.enum(["markdown", "jsdoc", "javadoc"]).optional().describe("Output format")
        })
    };

    protected formatPrompt(args: DocumentCodeArgs): string {
        let prompt = TOOL_SCHEMAS.DOCUMENT.promptTemplate
            .replace("{code}", args.code)
            .replace("{language}", args.language);
        
        // Replace format if provided, otherwise use markdown as default
        const format = args.format || "markdown";
        prompt = prompt.replace("{format}", format);
        
        // Replace style if provided, otherwise remove the placeholder
        if (args.style) {
            prompt = prompt.replace("{style}", args.style);
        } else {
            prompt = prompt.replace("{style}", "standard");
        }
        
        return prompt;
    }

    /**
     * Implements the 'document_code' tool functionality
     */
    protected async implement(args: DocumentCodeArgs): Promise<string> {
        console.log(`Generating documentation for ${args.language} code in ${args.format || "markdown"} format...`);
        
        // Validate code length
        if (args.code.length > 50000) {
            throw new Error("Code too large to document (max 50,000 characters)");
        }

        // Format the prompt based on the template
        const prompt = this.formatPrompt(args);
        
        // Call the API with the formatted prompt
        return await this.callMercuryApi(prompt);
    }
} 