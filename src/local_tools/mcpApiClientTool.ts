import { z } from "zod";
import { ZodValidatedTool, ToolDefinition } from "./baseTool.js";
import { MercuryClient } from "../mercuryApi.js";
import OpenAI from "openai";

// Define the Zod schema for the message object
const MessageSchema = z.object({
    role: z.enum(["system", "user", "assistant", "tool"]),
    content: z.string().nullable(),
    name: z.optional(z.string()),
    tool_call_id: z.optional(z.string())
});

// Define the Zod schema for the input
const McpApiClientInputSchema = z.object({
    messages: z.array(MessageSchema).describe("Array of messages for the conversation"),
    model: z.optional(z.string()).describe("The Mercury model to use (defaults to mercury-coder-small)"),
    max_tokens: z.optional(z.number().int().positive()).describe("Maximum number of tokens to generate"),
    temperature: z.optional(z.number().min(0).max(2)).describe("Temperature for sampling (0-2, lower is more deterministic)"),
    stream: z.optional(z.boolean()).describe("Whether to stream the response (not supported yet)"),
    full_response: z.optional(z.boolean()).describe("Whether to return the full API response (default: false, returns only content)")
});

type McpApiClientArgs = z.infer<typeof McpApiClientInputSchema>;

/**
 * Tool for making direct chat completion requests to the Mercury API through the OpenAI-compatible client
 * This provides MCP clients with more control over the API request
 */
export class McpApiClientTool extends ZodValidatedTool<typeof McpApiClientInputSchema> {
    definition: ToolDefinition = {
        name: "mcp_api_client",
        description: "Make direct chat completion requests to the Mercury API with full message history support",
        inputSchema: McpApiClientInputSchema
    };

    protected async implement(args: McpApiClientArgs): Promise<unknown> {
        console.log(`Making chat completion request with ${args.messages.length} messages`);
        
        // Create client with options
        const client = new MercuryClient({
            defaultModel: args.model,
            defaultMaxTokens: args.max_tokens
        });

        try {
            // Convert messages to OpenAI format
            const messages = args.messages.map(msg => {
                return {
                    role: msg.role,
                    content: msg.content,
                    ...(msg.name ? { name: msg.name } : {}),
                    ...(msg.tool_call_id ? { tool_call_id: msg.tool_call_id } : {})
                } as OpenAI.Chat.ChatCompletionMessageParam;
            });
            
            // Make the API call
            const response = await client.generateCompletion(messages, {
                max_tokens: args.max_tokens,
                temperature: args.temperature,
                stream: false // Streaming not supported yet
            });
            
            // Return the full response or just the content
            const chatCompletion = response as OpenAI.Chat.ChatCompletion;
            
            if (args.full_response) {
                // Return a simplified version of the response (can't return the full OpenAI response object)
                return {
                    id: chatCompletion.id,
                    created: chatCompletion.created,
                    model: chatCompletion.model,
                    choices: chatCompletion.choices.map(choice => ({
                        index: choice.index,
                        message: {
                            role: choice.message.role,
                            content: choice.message.content
                        },
                        finish_reason: choice.finish_reason
                    })),
                    usage: chatCompletion.usage
                };
            } else {
                // Just return the content
                return chatCompletion.choices?.[0]?.message?.content || "";
            }
            
        } catch (error) {
            console.error("Error making API client request:", error);
            throw error;
        }
    }
} 