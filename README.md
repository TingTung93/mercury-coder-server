# Mercury Coder Server

The Mercury Coder Server provides code analysis, refactoring, and generation services through the Model Context Protocol (MCP).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the server:
   ```bash
   npm run build
   ```

3. Set up your Mercury API key:
   ```bash
   export MERCURY_API_KEY=your_api_key  # Unix/macOS
   set MERCURY_API_KEY=your_api_key  # Windows cmd
   $env:MERCURY_API_KEY="your_api_key"  # Windows PowerShell
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

## License

Proprietary - All rights reserved.
