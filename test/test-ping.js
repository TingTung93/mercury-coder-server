// Simple test for Mercury Coder Server
// Run with: node test/test-ping.js

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to the server script
const serverScriptPath = path.resolve(__dirname, '../build/index.js');

async function runTest() {
  // Create transport that spawns the server
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverScriptPath],
    env: { ...process.env, MERCURY_API_KEY: 'test_api_key' }
  });

  const client = new Client(
    {
      name: "ping-test-client",
      version: "1.0.0"
    },
    {
      capabilities: {}
    }
  );

  try {
    // Connect to the server
    console.log('Connecting to server...');
    await client.connect(transport);
    console.log('Client connected to server.');

    // Call ping method
    console.log('Calling ping...');
    const response = await client.ping();

    console.log('Received response from ping:');
    console.log(JSON.stringify(response, null, 2));

    // Try a simple chat request
    console.log('\nTrying chat method...');
    try {
      const chatResponse = await client.request({
        method: 'chat',
        params: {
          message: 'Hello, world!'
        }
      });
      console.log('Chat response:');
      console.log(JSON.stringify(chatResponse, null, 2));
    } catch (chatError) {
      console.error('Chat method error:', chatError);
    }

    // Clean up
    await client.close();
    console.log('Client disconnected and server terminated.');
    process.exit(0);

  } catch (error) {
    console.error('Error during test:', error);
    try { await client.close(); } catch (closeError) { console.error('Error closing client:', closeError); }
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('Unhandled error in runTest:', error);
  process.exit(1);
}); 