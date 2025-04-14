import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the server script
const serverScriptPath = path.join(__dirname, '../build/index.js');

console.log('Starting direct test with Mercury Coder Server...');

// Set test API key as environment variable
process.env.MERCURY_API_KEY = 'test_api_key';

// Enable debug logging from MCP SDK
process.env.DEBUG = 'mcp*';

async function runTest() {
  try {
    // Create transport that spawns the server process directly
    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverScriptPath],
      env: {
        ...process.env,
        MERCURY_API_KEY: 'test_api_key'
      }
    });
    
    // Initialize the client
    const client = new Client('test-client', '1.0.0');
    
    console.log('Connecting client to server...');
    await client.connect(transport);
    console.log('Client connected successfully.');
    
    // Test ping first
    console.log('Sending ping request...');
    const pingResult = await client.ping();
    console.log('Ping response:', pingResult);
    
    // Test init
    console.log('Sending initialize request...');
    const initResult = await client.initialize();
    console.log('Initialize response capabilities:', JSON.stringify(initResult.capabilities, null, 2));
    
    // Send a raw JSON-RPC request directly
    console.log('Sending direct chat request...');
    try {
      const chatResponse = await client.request({
        method: 'chat',
        params: {
          message: 'Hello, world!',
          context: {
            code: 'function test() { return "hello"; }'
          }
        }
      });
      console.log('Chat response:', chatResponse);
    } catch (error) {
      console.error('Chat request error:', error);
    }
    
    // Clean up
    console.log('Closing client...');
    await client.close();
    console.log('Test completed');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
runTest().catch(console.error); 