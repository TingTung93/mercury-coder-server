# Mercury Coder Server

[![License: Fair Use](https://img.shields.io/badge/License-Fair%20Use-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)

The Mercury Coder Server provides code analysis, refactoring, and generation services through the Model Context Protocol (MCP). It offers a powerful set of tools for code improvement, analysis, and transformation through a standardized JSON-RPC interface.

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

## Running the Server

To run the primary server implementation:
```bash
node build/index.js
```

To run the simplified server implementation:
```bash
node build/src/simple-server.js
```

The server accepts requests over standard input and provides responses over standard output, following the JSON-RPC 2.0 protocol.

## Testing

You can test the server functionality using the provided test scripts:

```bash
# Run all tests
npm test

# Test the simple server implementation
node test/simple-direct-test.js

# Test with detailed output
node test/debug-server-output.js

# Test the code tools
node test/code-tools-test.js
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

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

## License

Fair Use Non-Commercial - This software may be used for non-commercial purposes only.