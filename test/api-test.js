import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverScriptPath = path.resolve(__dirname, '../build/index.js');

// Set environment variables
process.env.MERCURY_API_KEY = 'test_api_key';
process.env.MCP_SDK_DEBUG = '1'; // Enable debug logging for MCP SDK

console.log('Starting test...');
console.log(`Server path: ${serverScriptPath}`);

// Spawn the server process
const serverProcess = spawn('node', [serverScriptPath], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Server logging
serverProcess.stdout.on('data', (data) => {
  console.log(`Server stdout: ${data}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`Server stderr: ${data.toString()}`);
});

// Create transport and client
const transport = new StdioClientTransport({
  process: serverProcess,
  commandName: 'node',
  args: [serverScriptPath],
});

const client = new Client({
  name: "test-client",
  version: "1.0.0",
  capabilities: {
    methods: ["chat", "ping"],
    tools: {}
  }
});

// Test sequence
const runTests = async () => {
  try {
    console.log('Connecting to server...');
    await client.connect(transport);
    console.log('Client connected');

    // Test 1: Ping
    console.log('Testing ping method...');
    const pingResponse = await client.request({ method: 'ping' });
    console.log('Ping response:', pingResponse);

    // Test 2: Chat
    console.log('Testing chat method...');
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

    console.log('Tests completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up
    console.log('Closing client and server...');
    await client.close();
    serverProcess.kill();
    console.log('Test finished');
  }
};

// Start the test sequence after a short delay to let the server initialize
setTimeout(runTests, 1000);

// Handle clean shutdown
process.on('SIGINT', async () => {
  console.log('Cleaning up...');
  try {
    await client.close();
  } catch (e) {
    // Ignore errors during cleanup
  }
  serverProcess.kill();
  process.exit(0);
}); 