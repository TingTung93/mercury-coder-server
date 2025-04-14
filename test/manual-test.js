// Manual test script for the Mercury Coder server
// Run with: node test/manual-test.js

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Construct the absolute path to the server script
const serverScriptPath = path.resolve(__dirname, '../build/index.js');

console.log("Starting manual test of Mercury Coder server...");
console.log(`Server script: ${serverScriptPath}`);

// Ensure API key is set
if (!process.env.MERCURY_API_KEY) {
  console.log("Setting mock MERCURY_API_KEY for testing");
  process.env.MERCURY_API_KEY = "test_api_key";
}

async function runTest() {
  console.log("Creating StdioClientTransport...");
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverScriptPath],
    env: { ...process.env }
  });

  console.log("Creating MCP client...");
  const client = new Client(
    {
      name: "mercury-coder-test-client",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  try {
    console.log("Connecting to server...");
    await client.connect(transport);
    console.log("✅ Connected to server successfully");

    console.log("Sending chat request...");
    const response = await client.request({
      method: 'chat',
      params: {
        message: 'Hello, world!',
        context: { code: "function test() { return 'hello'; }" }
      }
    });

    console.log("✅ Received response from server:");
    console.log(JSON.stringify(response, null, 2));

    // Clean up
    console.log("Closing client connection...");
    await client.close();
    console.log("✅ Test completed successfully");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    try { 
      if (client) await client.close(); 
    } catch (closeError) { 
      console.error("Error closing client:", closeError); 
    }
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error("❌ Unhandled error in runTest:", error);
  process.exit(1);
}); 