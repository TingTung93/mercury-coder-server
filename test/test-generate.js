import { writeFileSync } from 'fs';

// Test request for generate_code tool
const request = {
  jsonrpc: "2.0",
  id: "1",
  method: "callTool", // Updated to match SDK's camelCase convention
  params: {
    name: "generate_code",
    arguments: {
      instructions: "Create a simple React component that displays a counter with increment and decrement buttons",
      language: "typescript",
      template: "functional component"
    }
  }
};

// Write request to stdin
writeFileSync(1, JSON.stringify(request) + "\n");