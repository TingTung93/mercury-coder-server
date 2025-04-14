import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the server script
const serverScriptPath = path.resolve(__dirname, './debug-handler.js');

async function runTest() {
  console.log("Starting test for debug-handler.js...");
  
  // Create transport that spawns the server
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverScriptPath],
    env: process.env
  });

  const client = new Client(
    {
      name: "debug-test-client",
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

    // Call ping method to test basic connectivity
    console.log('Calling ping...');
    const pingResponse = await client.ping();
    console.log('Ping response:', pingResponse);

    // Try the chat request
    console.log('\nSending chat request...');
    try {
      const chatResponse = await client.request({
        method: 'chat',
        params: {
          message: 'Hello, world!',
          context: {
            code: 'console.log("test");'
          }
        }
      });
      console.log('Chat response successful:');
      console.log(JSON.stringify(chatResponse, null, 2));
    } catch (chatError) {
      console.error('Chat method error:', chatError);
    }

    // Clean up
    console.log('\nCleaning up...');
    await client.close();
    console.log('Test completed.');

  } catch (error) {
    console.error('Error during test:', error);
    try { 
      await client.close();
    } catch (closeError) { 
      console.error('Error closing client:', closeError);
    }
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('Unhandled error in runTest:', error);
  process.exit(1);
}); 