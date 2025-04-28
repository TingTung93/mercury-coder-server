import { z } from "zod";
import { ZodValidatedTool, ToolDefinition } from "./baseTool.js";
import { MercuryClient } from "../mercuryApi.js";
import OpenAI from "openai";

// Define the Zod schema for the input
const McpCompleteClientInputSchema = z.object({
    prompt: z.string().describe("The prompt to send to the Mercury API"),
    model: z.optional(z.string()).describe("The Mercury model to use (defaults to mercury-coder-small)"),
    max_tokens: z.optional(z.number().int().positive()).describe("Maximum number of tokens to generate"),
    temperature: z.optional(z.number().min(0).max(2)).describe("Temperature for sampling (0-2, lower is more deterministic)"),
    system_prompt: z.optional(z.string()).describe("Optional system prompt to prepend")
});

type McpCompleteClientArgs = z.infer<typeof McpCompleteClientInputSchema>;

/**
 * Tool for making direct completion requests to the Mercury API through the OpenAI-compatible client
 * This provides MCP clients direct access to the Mercury API
 */
export class McpCompleteClientTool extends ZodValidatedTool<typeof McpCompleteClientInputSchema> {
    definition: ToolDefinition = {
        name: "mcp_complete",
        description: "Make a direct completion request to the Mercury API using the OpenAI-compatible client",
        inputSchema: McpCompleteClientInputSchema
    };

    protected async implement(args: McpCompleteClientArgs): Promise<string> {
        console.log(`Making completion request with prompt: ${args.prompt.substring(0, 30)}...`);
        
        const client = new MercuryClient({
            defaultModel: args.model,
            defaultMaxTokens: args.max_tokens
        });

        try {
            // Prepare messages array
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
            
            // Add system prompt if provided
            if (args.system_prompt) {
                messages.push({ role: "system", content: args.system_prompt });
            }
            
            // Add user prompt
            messages.push({ role: "user", content: args.prompt });
            
            // Make the API call
            const response = await client.generateCompletion(messages, {
                max_tokens: args.max_tokens,
                temperature: args.temperature
            });
            
            // Extract the response content
            const chatCompletion = response as OpenAI.Chat.ChatCompletion;
            const content = chatCompletion.choices?.[0]?.message?.content;
            
            if (!content) {
                throw new Error("Invalid or empty response from API");
            }
            
            return content;
        } catch (error) {
            console.error("Error making completion request:", error);
            throw error;
        }
    }
} 