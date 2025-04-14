import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SocketClientTransport } from '@modelcontextprotocol/sdk/client/socket.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SocketServerTransport } from '@modelcontextprotocol/sdk/server/socket.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { setTimeout } from 'timers/promises';

// Path to the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test server implementation
async function runTestServer() {
  const PORT = 9876;
  const server = new Server(
    { name: 'test-server', version: '1.0.0' },
    { capabilities: { methods: ['chat'] } }
  );

  // Add a simple chat handler that returns a fixed response
  server.fallbackRequestHandler = async (request) => {
    console.log('Server received request:', request);
    
    if (request.method === 'chat') {
      const params = request.params || {};
      console.log('Chat params:', params);
      
      if (!params.message || typeof params.message !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'message' parameter");
      }
      
      return {
        content: `Server response to: ${params.message}`
      };
    }
    
    throw new McpError(ErrorCode.MethodNotFound, `Method '${request.method}' not found`);
  };

  // Start the server
  const transport = new SocketServerTransport();
  await transport.listen(PORT);
  await server.connect(transport);
  console.log(`Test server running on port ${PORT}`);
  
  return { server, transport };
}

// Test client implementation
async function runTestClient() {
  const PORT = 9876;
  const client = new Client('test-client', '1.0.0');
  
  // Connect to the server
  const transport = new SocketClientTransport('localhost', PORT);
  await client.connect(transport);
  console.log('Client connected successfully');
  
  // Test ping
  const pingResult = await client.ping();
  console.log('Ping response:', pingResult);
  
  // Test initialize
  const initResult = await client.initialize();
  console.log('Initialize response:', JSON.stringify(initResult, null, 2));
  
  // Test chat
  try {
    console.log('Sending chat request...');
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
  
  await client.close();
  return client;
}

// Main function
async function main() {
  console.log('Starting socket transport test...');
  
  let server, transport;
  try {
    // Start server
    ({ server, transport } = await runTestServer());
    
    // Give server time to start listening
    await setTimeout(1000);
    
    // Run client tests
    await runTestClient();
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Clean up
    if (server) {
      console.log('Shutting down server...');
      await server.close();
    }
    if (transport) {
      await transport.close();
    }
  }
}

// Run the test
main().catch(console.error); 