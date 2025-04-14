import { z } from "zod";
import { McpError, ErrorCode } from "../../types/index.js";
import { ZodValidatedTool } from "../index.js";
import { API_CONFIG, REQUEST_CONFIG } from "../../config/index.js";
import axios from "axios";

/**
 * Base class for all code-related tools to extend
 */
export abstract class BaseCodeTool<TInputSchema extends z.ZodObject<any>> extends ZodValidatedTool<TInputSchema> {
    /**
     * Sends the formatted prompt to the Mercury API
     * @param prompt The complete, formatted prompt to send to the API
     * @returns The API response content
     */
    protected async callMercuryApi(prompt: string): Promise<string> {
        try {
            const response = await axios.post(
                API_CONFIG.URL,
                {
                    model: API_CONFIG.MODEL,
                    messages: [
                        { role: "system", content: "You are a helpful code assistant focusing on the specific task requested." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: API_CONFIG.MAX_TOKENS,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${API_CONFIG.KEY}`,
                    },
                    timeout: REQUEST_CONFIG.REQUEST_TIMEOUT,
                }
            );

            // Extract the response content
            const content = response.data?.choices?.[0]?.message?.content;
            
            if (!content) {
                throw new Error("Invalid or empty response from API");
            }
            
            return content;
        } catch (error) {
            console.error(`API call error:`, error);
            if (error instanceof axios.AxiosError) {
                throw new McpError(
                    ErrorCode.InternalError,
                    `API request failed: ${error.response?.statusText || error.message}`,
                    error.response?.data // Include response data if available
                );
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