# Mercury Coder Server

[![License: Fair Use](https://img.shields.io/badge/License-Fair%20Use-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)

The Mercury Coder Server provides code analysis, refactoring, and generation services through the Model Context Protocol (MCP). It offers a powerful set of tools for code improvement, analysis, and transformation through a standardized JSON-RPC interface.

## Features

- OpenAI-compatible client interface
- Support for Mercury's AI coding capabilities
- Tool-handling for interactive coding assistance
- Flexible configuration through environment variables or client options

## Prerequisites

- Node.js (v18.x or higher)
- npm (v8.x or higher)
- A Mercury API key (sign up at https://api.inceptionlabs.ai)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mercury-coder-server.git
   cd mercury-coder-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Mercury API key.

4. Build the server:
   ```bash
   npm run build
   ```

## Environment Variables

Configure these environment variables or pass them as client options:

```
MERCURY_API_KEY=your_api_key_here
MERCURY_API_URL=https://api.inceptionlabs.ai/v1
MERCURY_MODEL=mercury-coder-small
```

## Usage

### Basic OpenAI-compatible Client

```typescript
import { MercuryClient } from './src/mercuryApi.js';

// Configure client
const mercury = new MercuryClient({
  apiKey: 'your-api-key', // Optional: Defaults to MERCURY_API_KEY env variable
  baseURL: 'https://api.inceptionlabs.ai/v1', // Optional: Custom API endpoint
  defaultModel: 'mercury-coder-small', // Optional: Model to use
  defaultMaxTokens: 1000 // Optional: Default token limit
});

// Generate completions
async function main() {
  try {
    const response = await mercury.generateCompletion([
      { role: 'user', content: 'What is a diffusion model?' }
    ], {
      max_tokens: 100,
      // Additional OpenAI parameters can be passed here
    });
    
    console.log(response.choices[0]?.message.content);
  } catch (error) {
    console.error('Failed to get response:', error);
  }
}

main();
```

### Helper Function (Alternative)

```typescript
import { createMercuryClient } from './src/index.js';

const mercury = createMercuryClient({
  apiKey: 'your-api-key',
  model: 'mercury-coder-small'
});

// Use the client as in the previous example
```

## Server Mode

The Mercury Coder Server also supports running as a standalone MCP (Model Context Protocol) server:

```bash
npm start
```

This starts the server in standard stdio mode suitable for integration with MCP clients.

## Development

```bash
# Build the project
npm run build

# Run tests
npm test

# Run in development mode with auto-restart
npm run dev
```

## Available Methods

The server provides the following methods:

- `ping`: Simple ping/pong to check if the server is alive
- `chat`: Send a chat message with optional code context and receive a response

## Example Request

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "chat",
  "params": {
    "message": "What does this code do?",
    "context": {
      "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }"
    }
  }
}
```

## Available Tools

The server supports various code-related tools that can be invoked through the Mercury API:

### Code Analysis and Improvement

- **analyze_code**: Analyzes code for potential improvements and issues
  ```javascript
  {
    "code": "your code here",
    "language": "javascript"
  }
  ```

- **refactor_code**: Refactors code according to best practices
  ```javascript
  {
    "code": "your code here",
    "language": "javascript",
    "instructions": "Optional specific refactoring instructions"
  }
  ```

- **debug_code**: Debugs code and suggests fixes
  ```javascript
  {
    "code": "your code here",
    "language": "javascript",
    "error": "Optional error message or issue description"
  }
  ```

### Code Generation and Transformation

- **generate_code**: Generates code from detailed instructions
  ```javascript
  {
    "instructions": "Detailed code generation instructions",
    "language": "javascript",
    "template": "Optional starting point template"
  }
  ```

- **format_code**: Formats code according to language standards
  ```javascript
  {
    "code": "your code here",
    "language": "javascript",
    "style": "Optional formatting style (e.g., 'prettier', 'google')"
  }
  ```

- **convert_code**: Converts code between programming languages
  ```javascript
  {
    "code": "your code here",
    "language": "javascript",
    "targetLanguage": "python"
  }
  ```

- **document_code**: Generates code documentation
  ```javascript
  {
    "code": "your code here",
    "language": "javascript",
    "style": "Optional documentation style (e.g., 'jsdoc', 'google')",
    "format": "markdown" // Optional: 'markdown', 'jsdoc', or 'javadoc'
  }
  ```

## MCP-Specific Tools

The MCP server provides additional special tools for directly interacting with the Mercury API:

### mcp_complete

A simple tool for making direct completion requests:

```javascript
{
  "prompt": "What is a diffusion model?",
  "model": "mercury-coder-small", // Optional
  "max_tokens": 100, // Optional
  "temperature": 0.7, // Optional (0-2)
  "system_prompt": "You are a helpful AI assistant" // Optional
}
```

### mcp_api_client

A more advanced tool that provides full control over chat history and supports multi-turn conversations:

```javascript
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What is a diffusion model?" },
    { "role": "assistant", "content": "A diffusion model is..." },
    { "role": "user", "content": "Can you elaborate more?" }
  ],
  "model": "mercury-coder-small", // Optional
  "max_tokens": 150, // Optional
  "temperature": 0.7, // Optional
  "full_response": true // Optional: Returns the full API response instead of just content
}
```

### Using the MCP Tools in Claude

Example of using the tools in Claude Desktop:

1. Invoke the `mcp_complete` tool:
```
I need to understand diffusion models.
```

2. Use the `mcp_api_client` tool for a multi-turn conversation:
```
Let's continue our previous conversation about diffusion models.
```

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

## License

Fair Use Non-Commercial - This software may be used for non-commercial purposes only.