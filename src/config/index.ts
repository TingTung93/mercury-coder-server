// API Configuration
export const API_CONFIG = {
  URL: process.env.MERCURY_API_URL || "https://api.inceptionlabs.ai/v1/chat/completions",
  MODEL: process.env.MERCURY_MODEL || "mercury-coder-small",
  KEY: process.env.MERCURY_API_KEY,
  MAX_TOKENS: 2000,
} as const;

// Request Configuration
export const REQUEST_CONFIG = {
  MAX_CODE_SIZE: 2_000_000, // Increased to 2MB
  MAX_REQUEST_SIZE: 4_000_000, // Increased to 4MB
  COMPRESSION_THRESHOLD: 10_000,
  CHUNK_SIZE: 100_000, // Increased chunk size
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 10000,
  REQUEST_TIMEOUT: 60000, // Increased timeout
  MAX_FILE_SIZE: 5_000_000, // New: Max file size (5MB)
  MAX_CONTEXT_LENGTH: 10_000, // New: Max context tokens
} as const;

// Server Configuration
export const SERVER_CONFIG = {
  NAME: "mercury-coder-server",
  VERSION: "0.1.0"
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  ENABLED: true,
  TTL: 1800, // 30 minutes in seconds
  MAX_SIZE: 100 // Maximum number of cached responses
} as const;

// Common properties for code-based tools
const codeBaseProperties = {
  code: { type: "string", description: "The code to process" },
  language: { type: "string", description: "Programming language of the code" }
};
const codeBaseRequired = ["code", "language"];

// Tool Schemas
export const TOOL_SCHEMAS = {
  ANALYZE: {
    name: "analyze_code",
    description: "Analyze code for potential improvements and suggest refactoring",
    inputSchema: {
      type: "object",
      properties: codeBaseProperties,
      required: codeBaseRequired,
    },
    promptTemplate: `Analyze this {language} code and suggest improvements:
{code}

Focus on:
1. Code quality and best practices
2. Performance optimizations
3. Potential bugs
4. Architecture improvements`
  },
  REFACTOR: {
    name: "refactor_code",
    description: "Refactor code according to best practices",
    inputSchema: {
      type: "object",
      properties: {
        ...codeBaseProperties,
        instructions: { type: "string", description: "Specific refactoring instructions" }
      },
      required: codeBaseRequired,
    },
    promptTemplate: `Refactor this {language} code:
{code}

Provide:
1. Refactored code
2. Explanation of changes
3. Benefits of the refactoring
{instructions}`
  },
  DEBUG: {
    name: "debug_code",
    description: "Debug code and suggest fixes",
    inputSchema: {
      type: "object",
      properties: {
        ...codeBaseProperties,
        error: { type: "string", description: "Error message or description of the issue" }
      },
      required: codeBaseRequired,
    },
    promptTemplate: `Debug this {language} code:
{code}
{error}

Provide:
1. Analysis of the issue
2. Suggested fixes
3. Explanation of the solution`
  },
  GENERATE: {
    name: "generate_code",
    description: "Generate code from detailed instructions",
    inputSchema: {
      type: "object",
      properties: {
        instructions: { type: "string", description: "Detailed instructions for code generation" },
        language: { type: "string", description: "Target programming language" },
        template: { type: "string", description: "Optional template or starting code" }
      },
      required: ["instructions", "language"],
    },
    promptTemplate: `Generate {language} code based on these instructions:
{instructions}

{template}

Provide:
1. Generated code
2. Usage examples
3. Implementation notes`
  },
  FORMAT: {
    name: "format_code",
    description: "Format code according to language standards",
    inputSchema: {
      type: "object",
      properties: {
        ...codeBaseProperties,
        style: { type: "string", description: "Optional formatting style guide (e.g., 'prettier', 'google')" }
      },
      required: codeBaseRequired,
    },
    promptTemplate: `Format this {language} code:
{code}

Style guide: {style}

Provide:
1. Formatted code
2. Applied formatting rules`
  },
  CONVERT: {
    name: "convert_code",
    description: "Convert code between programming languages",
    inputSchema: {
      type: "object",
      properties: {
        ...codeBaseProperties,
        targetLanguage: { type: "string", description: "The target programming language" }
      },
      required: [...codeBaseRequired, "targetLanguage"],
    },
    promptTemplate: `Convert this {language} code to {targetLanguage}:
{code}

Provide:
1. Converted code
2. Implementation notes
3. Any language-specific adaptations`
  },
  DOCUMENT: {
    name: "document_code",
    description: "Generate code documentation",
    inputSchema: {
      type: "object",
      properties: {
        ...codeBaseProperties,
        style: { type: "string", description: "Optional documentation style (e.g., 'jsdoc', 'google')" },
        format: { type: "string", enum: ['markdown', 'jsdoc', 'javadoc'], description: "Output format" }
      },
      required: codeBaseRequired,
    },
    promptTemplate: `Generate {format} documentation for this {language} code:
{code}

Style: {style}

Provide:
1. Generated documentation
2. Usage examples
3. Important notes and considerations`
  }
} as const;