import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('Testing MCP methods...');
  
  // Path to our test server script
  const serverPath = join(__dirname, 'test-methods.js');
  console.log(`Starting test server: ${serverPath}`);
  
  // Create a transport that spawns the test server
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DEBUG: 'mcp*'
    }
  });
  
  // Initialize the client with required capabilities configuration
  const client = new Client({
    clientInfo: {
      name: 'test-methods-client',
      version: '1.0.0'
    },
    transport,
    capabilities: {
      methods: ['ping', 'chat']
    }
  });
  
  try {
    // Connect to the server
    console.log('Connecting to server...');
    await client.connect();
    console.log('Connected to server');
    
    // Test ping method
    console.log('\nTesting ping method:');
    const pingResponse = await client.callMethod('ping', {});
    console.log('Ping response:', pingResponse);
    
    // Test chat method
    console.log('\nTesting chat method:');
    const chatResponse = await client.callMethod('chat', { 
      message: 'Hello from the test client!',
      context: {
        code: "function test() { return 'hello'; }"
      }
    });
    console.log('Chat response:', chatResponse);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    // Clean up
    console.log('\nClosing client...');
    await client.close();
    console.log('Client closed');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 