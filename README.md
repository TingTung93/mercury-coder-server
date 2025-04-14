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

The server supports various code-related tools:

- `analyze_code`: Analyze code for potential improvements
- `refactor_code`: Refactor code according to best practices
- `debug_code`: Debug code and suggest fixes
- `generate_code`: Generate code from detailed instructions
- `format_code`: Format code according to language standards
- `convert_code`: Convert code between programming languages
- `document_code`: Generate code documentation

## License

Proprietary - All rights reserved.
