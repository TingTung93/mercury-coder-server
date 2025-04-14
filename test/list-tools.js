import { writeFileSync } from 'fs';

// List tools request
const request = {
  jsonrpc: "2.0",
  id: "1",
  method: "list_tools" // Using underscore format as per MCP spec
};

// Write request to stdin
writeFileSync(1, JSON.stringify(request) + "\n");