import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Construct the absolute path to the server script
const serverScriptPath = path.resolve(__dirname, '../build/index.js');

async function runTest() {
  // Command to spawn the server
  const serverCommand = `node`;
  const serverArgs = [serverScriptPath];
  // Ensure the API key is passed to the spawned server environment
  const serverEnv = { ...process.env, MERCURY_API_KEY: process.env.MERCURY_API_KEY || "sk_fe21b3e6b44911e40338c55c9a009924" }; // Use existing env var or default

  // Create transport that spawns the server
  const transport = new StdioClientTransport({
      command: serverCommand,
      args: serverArgs,
      env: serverEnv
  });

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
    // Connect to the server (this will spawn the server process)
    console.error('Connecting to server and spawning process...');
    await client.connect(transport);
    console.error('Client connected to server.');

    // Call the analyze_code tool
    console.error('Calling analyze_code tool...');
    const response = await client.callTool("analyze_code", { // Changed tool and arguments
      code: "function hello() { console.log('world'); }",
      language: "javascript"
    });

    console.error('Received response from analyze_code:');
    // Log the actual response content to stdout for verification
    console.log(JSON.stringify(response, null, 2));

    // Clean up
    await client.close(); // This should also terminate the server process
    console.error('Client disconnected and server terminated.');
    process.exit(0);

  } catch (error) {
    console.error('Error during test:', error);
    // Attempt to close connection even if error occurred
    try { await client.close(); } catch (closeError) { console.error('Error closing client:', closeError); }
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('Unhandled error in runTest:', error);
  process.exit(1);
});