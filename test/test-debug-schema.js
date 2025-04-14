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
  console.log('Starting debug test for method schema handling...');
  
  // Create transport with debug logs enabled
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverScriptPath],
    env: { 
      ...process.env, 
      MERCURY_API_KEY: 'test_api_key',
      MCP_LOG_LEVEL: 'debug', // Enable debug logging
      DEBUG: '*'               // Verbose output
    }
  });

  // Create client with capabilities
  const client = new Client(
    {
      name: "debug-schema-test-client",
      version: "1.0.0"
    },
    {
      capabilities: {} // Empty capabilities object
    }
  );

  try {
    // Connect to the server
    console.log('Connecting to server...');
    await client.connect(transport);
    console.log('Client connected to server.');

    // Test ping method first
    console.log('Calling ping...');
    try {
      const pingResponse = await client.ping();
      console.log('Ping response:', pingResponse);
    } catch (pingError) {
      console.error('Ping method error:', pingError);
    }

    // Try the chat method with explicit JSON-RPC format
    console.log('\nTrying chat method with explicit JSON-RPC...');
    try {
      const chatResponse = await client.request({
        method: 'chat',
        params: {
          message: 'Hello, debug test!',
          context: {
            code: 'console.log("test");'
          }
        }
      });
      console.log('Chat response successfully received:');
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

// Run the test
runTest().catch(error => {
  console.error('Unhandled error in runTest:', error);
  process.exit(1);
}); 