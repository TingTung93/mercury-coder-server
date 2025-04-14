import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from 'url';
import path from 'path';
import { z } from 'zod';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to the server script
const serverScriptPath = path.resolve(__dirname, '../build/index.js');

// Define a schema for the chat response
const ChatResponseSchema = z.object({
  content: z.string()
});

async function runTest() {
  console.log('Starting test for Mercury Coder Server...');
  
  // Create transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverScriptPath],
    env: { 
      ...process.env, 
      MERCURY_API_KEY: 'test_api_key'
    }
  });

  // Create client
  const client = new Client(
    {
      name: "final-test-client",
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

    // Test ping method first
    console.log('Calling ping...');
    try {
      const pingResponse = await client.ping();
      console.log('Ping response:', pingResponse);
    } catch (pingError) {
      console.error('Ping method error:', pingError);
    }

    // Try the chat method with the response schema
    console.log('\nTrying chat method...');
    try {
      const chatResponse = await client.request(
        {
          method: 'chat',
          params: {
            message: 'Hello, Mercury Coder!',
            context: {
              code: 'function test() { return "hello"; }'
            }
          }
        },
        ChatResponseSchema // Pass the response schema
      );
      
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

// Run the test
runTest().catch(error => {
  console.error('Unhandled error in runTest:', error);
  process.exit(1);
}); 