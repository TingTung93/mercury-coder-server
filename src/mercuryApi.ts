import axios, { AxiosError } from "axios";
import { McpError, ErrorCode } from "./types/index.js"; // Assuming types are in ./types
import { API_CONFIG, REQUEST_CONFIG } from "./config/index.js";
import { ToolDispatcher } from "./toolDispatcher.js"; // Added .js extension
import { LocalTool } from "./local_tools/index.js"; // Changed to local_tools and added .js extension
import { gzip } from "zlib";
import { promisify } from "util";
import OpenAI from "openai";
import dotenv from "dotenv";

// Initialize dotenv to load environment variables
dotenv.config();

const gzipAsync = promisify(gzip);

// Define structures based on typical OpenAI/Tool-Using API responses
// Adjust these based on the actual Mercury Coder API documentation
interface ApiMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string | null; // Content is null for tool_calls role
    tool_calls?: ApiToolCall[];
    tool_call_id?: string; // Used for role: "tool"
}

interface ApiToolCall {
    id: string;
    type: "function"; // Assuming 'function' type for tools
    function: {
        name: string;
        arguments: string; // Arguments are usually a JSON string
    };
}

interface ApiResponseChoice {
    message: ApiMessage;
    finish_reason: string; // e.g., "stop", "tool_calls"
}

interface ApiResponse {
    id: string;
    choices: ApiResponseChoice[];
    // other fields like usage...
}

interface MercuryClientOptions {
    apiKey?: string;
    baseURL?: string;
    defaultModel?: string;
    defaultMaxTokens?: number;
}

export class MercuryClient {
    private client: OpenAI;
    private defaultModel: string;
    private defaultMaxTokens: number;

    constructor(options: MercuryClientOptions = {}) {
        const apiKey = options.apiKey || process.env.MERCURY_API_KEY || API_CONFIG.KEY;
        
        if (!apiKey) {
            throw new Error('API key is required. Provide it in options or set MERCURY_API_KEY environment variable.');
        }

        this.client = new OpenAI({
            apiKey,
            baseURL: options.baseURL || process.env.MERCURY_API_URL || 'https://api.inceptionlabs.ai/v1'
        });

        this.defaultModel = options.defaultModel || process.env.MERCURY_MODEL || API_CONFIG.MODEL;
        this.defaultMaxTokens = options.defaultMaxTokens || API_CONFIG.MAX_TOKENS;
    }

    async generateCompletion(
        messages: OpenAI.Chat.ChatCompletionMessageParam[], 
        options: Partial<OpenAI.Chat.ChatCompletionCreateParams> = {}
    ) {
        try {
            const response = await this.client.chat.completions.create({
                model: options.model || this.defaultModel,
                messages,
                max_tokens: options.max_tokens || this.defaultMaxTokens,
                ...options
            });
            
            return response;
        } catch (error) {
            console.error('Error generating completion:', error);
            if (error instanceof OpenAI.APIError) {
                throw new McpError(
                    ErrorCode.InternalError,
                    `API request failed: ${error.message}`,
                    { status: error.status }
                );
            }
            throw error;
        }
    }
}

export class MercuryApi {
    private systemPrompt = "You are a helpful AI coding assistant. You can use tools to help the user."; // TODO: Make configurable?
    private maxToolIterations = 5; // Limit recursive tool calls
    private mercuryClient: MercuryClient;

    constructor() {
        this.mercuryClient = new MercuryClient();
    }

    /**
     * Primary method to interact with the Mercury API, handling the tool execution loop.
     */
    async callWithToolHandling(
        userMessage: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context: any, // TODO: Define a proper context type
        availableTools: LocalTool[],
        toolDispatcher: ToolDispatcher,
        reportProgress: (msg: string) => void
    ): Promise<{ content: string }> { // Returns only the final content for now

        reportProgress("Preparing request for AI...");

        // Construct initial messages
        const messages: ApiMessage[] = [
            { role: "system", content: this.systemPrompt },
            // TODO: Add more sophisticated context processing here
            // e.g., read file content if context.filePath is provided
            { role: "user", content: userMessage }
        ];

        // Prepare tool definitions for the API call - cast to proper OpenAI SDK type
        const toolDefinitions = availableTools.map(tool => ({
            type: "function" as const,  // Use const assertion to make this a literal type
            function: tool.getDefinition()
        })) as OpenAI.Chat.ChatCompletionTool[];

        let iteration = 0;
        while (iteration < this.maxToolIterations) {
            iteration++;
            reportProgress(`Sending request to AI (Iteration ${iteration})...`);

            try {
                // Convert our ApiMessage[] to OpenAI's expected format
                const openAIMessages = messages.map(msg => {
                    return {
                        role: msg.role,
                        content: msg.content,
                        ...(msg.tool_call_id ? { tool_call_id: msg.tool_call_id } : {}),
                        ...(msg.tool_calls ? { tool_calls: msg.tool_calls } : {})
                    } as OpenAI.Chat.ChatCompletionMessageParam;
                });

                // Use the OpenAI-compatible client
                const apiResponse = await this.mercuryClient.generateCompletion(
                    openAIMessages,
                    {
                        tools: toolDefinitions,
                        tool_choice: "auto"
                    }
                );

                // Add type assertion for apiResponse
                const chatCompletion = apiResponse as OpenAI.Chat.ChatCompletion;

                if (!chatCompletion.choices || chatCompletion.choices.length === 0) {
                    throw new Error("Invalid response from API: No choices found.");
                }

                const responseMessage = chatCompletion.choices[0].message;
                const finishReason = chatCompletion.choices[0].finish_reason;

                // Convert OpenAI message back to our internal format
                const adaptedMessage: ApiMessage = {
                    role: responseMessage.role as "assistant", // Type assertion for role
                    content: responseMessage.content !== null ? responseMessage.content : null,
                    tool_calls: responseMessage.tool_calls as unknown as ApiToolCall[] | undefined
                };

                // Add AI response to message history
                messages.push(adaptedMessage);

                if (finishReason === "stop" || !adaptedMessage.tool_calls || adaptedMessage.tool_calls.length === 0) {
                    reportProgress("AI finished generating response.");
                    // No tool calls, or explicit stop, return the content
                    if (adaptedMessage.content === null) {
                        // This can happen if the AI *only* decides to call tools and provides no text
                        // Might need a follow-up call asking for a summary, or handle this case differently.
                        console.warn("AI response finished with tool calls but no final text content.");
                        return { content: "" }; // Return empty or ask AI for final words?
                    }
                    return { content: adaptedMessage.content };
                }

                // --- Handle Tool Calls ---
                reportProgress("AI requested tool execution...");
                const toolCalls = adaptedMessage.tool_calls;
                const toolResults: ApiMessage[] = [];

                for (const toolCall of toolCalls) {
                     reportProgress(`Executing tool: ${toolCall.function.name}...`);
                    try {
                        const result = await toolDispatcher.dispatch(toolCall);
                        toolResults.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(result) // Tool results should be JSON stringified
                        });
                        reportProgress(`Tool ${toolCall.function.name} executed successfully.`);
                    } catch (error) {
                         reportProgress(`Error executing tool ${toolCall.function.name}: ${error instanceof Error ? error.message : String(error)}`);
                        console.error(`Tool execution error for ${toolCall.function.name} (ID: ${toolCall.id}):`, error);
                        // Send error back to the AI
                        toolResults.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify({ error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}` })
                        });
                    }
                }

                // Add tool results to messages and loop back for the next API call
                messages.push(...toolResults);
                reportProgress("Sending tool results back to AI...");

            } catch (error) {
                 console.error(`API call error during iteration ${iteration}:`, error);
                 if (error instanceof McpError) throw error; // Propagate specific MCP errors
                 if (error instanceof AxiosError) {
                    throw new McpError(
                        ErrorCode.InternalError,
                        `API request failed: ${error.response?.statusText || error.message}`,
                        error.response?.data // Include response data if available
                    );
                }
                throw new McpError(ErrorCode.InternalError, `API interaction failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Max iterations reached
        throw new McpError(ErrorCode.InternalError, `Maximum tool execution iterations (${this.maxToolIterations}) reached.`);
    }

    /**
     * Makes a single raw API request with retry logic and compression.
     * Reuses logic from the old BaseToolHandler.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async makeApiRequest(data: Record<string, any>, retryCount = 0): Promise<any> {
        try {
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_CONFIG.KEY}`,
            };

            // Compression logic (optional, check if needed/supported)
            // if (Buffer.byteLength(JSON.stringify(data), 'utf-8') > REQUEST_CONFIG.COMPRESSION_THRESHOLD) {
            //     const compressed = await gzipAsync(Buffer.from(JSON.stringify(data)));
            //     headers['Content-Encoding'] = 'gzip';
            //     data = compressed; // Be careful modifying data if it's Buffer vs string
            // }

            const response = await axios.post(API_CONFIG.URL, data, {
                headers,
                timeout: REQUEST_CONFIG.REQUEST_TIMEOUT,
            });

            return response.data;
        } catch (error) {
             if (retryCount < REQUEST_CONFIG.MAX_RETRIES && this.shouldRetry(error)) {
                const delay = Math.min(
                    REQUEST_CONFIG.INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
                    REQUEST_CONFIG.MAX_RETRY_DELAY
                );
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeApiRequest(data, retryCount + 1);
            }
            // Re-throw original error if retries exhausted or error is not retryable
            throw error;
        }
    }

    /**
     * Determines if a request should be retried based on the error.
     */
    private shouldRetry(error: unknown): boolean {
        if (!axios.isAxiosError(error)) return false;

        const status = error.response?.status;
        return (
            !status || // Network errors
            status === 429 || // Rate limiting
            status >= 500 // Server errors (5xx)
        );
    }
} 