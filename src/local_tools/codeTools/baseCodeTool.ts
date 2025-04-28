import { z } from "zod";
import { McpError, ErrorCode } from "../../types/index.js";
import { ZodValidatedTool } from "../index.js";
import { API_CONFIG } from "../../config/index.js";
import { MercuryClient } from "../../mercuryApi.js";
import OpenAI from "openai";

/**
 * Base class for all code-related tools to extend
 */
export abstract class BaseCodeTool<TInputSchema extends z.ZodObject<any>> extends ZodValidatedTool<TInputSchema> {
    protected mercuryClient: MercuryClient;

    constructor() {
        super();
        this.mercuryClient = new MercuryClient();
    }

    /**
     * Sends the formatted prompt to the Mercury API
     * @param prompt The complete, formatted prompt to send to the API
     * @returns The API response content
     */
    protected async callMercuryApi(prompt: string): Promise<string> {
        try {
            const response = await this.mercuryClient.generateCompletion([
                { role: "system", content: "You are a helpful code assistant focusing on the specific task requested." },
                { role: "user", content: prompt }
            ]);

            // Add type assertion to ensure we can access the choices property
            const chatCompletion = response as OpenAI.Chat.ChatCompletion;
            
            // Extract the response content
            const content = chatCompletion.choices?.[0]?.message?.content;
            
            if (!content) {
                throw new Error("Invalid or empty response from API");
            }
            
            return content;
        } catch (error) {
            console.error(`API call error:`, error);
            if (error instanceof McpError) {
                throw error; // Propagate McpErrors
            }
            
            throw new McpError(
                ErrorCode.InternalError, 
                `API interaction failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * This method should be implemented by each tool to create their specific formatted prompt
     */
    protected abstract formatPrompt(validatedArgs: z.infer<TInputSchema>): string;
} 