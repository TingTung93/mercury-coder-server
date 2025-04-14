import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import { fileURLToPath } from 'url';
import path from 'path';
import { fork } from 'child_process';
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to the server script
const serverPath = path.resolve(__dirname, '../../build/index.js');

describe('Mercury Coder Server Integration Tests', () => {
  let client: any;  // Using any here until we can properly import the types
  let transport: any;

  beforeAll(async () => {
    // Setup environment
    process.env.MERCURY_API_KEY = process.env.MERCURY_API_KEY || 'test_api_key';
    
    // Dynamically import the MCP SDK
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
    
    // Create transport that spawns the server
    transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: Object.fromEntries(
        Object.entries(process.env)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, v as string])
      ) // Filter out undefined values
    });

    // Create and connect client
    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    // Connect to the server
    await client.connect(transport);
  }, 15000); // Increased timeout for server startup

  afterAll(async () => {
    // Cleanup
    if (client) {
      await client.close();
    }
  });

  it('should initialize successfully', async () => {
    // This test passes if beforeAll succeeds in connecting
    expect(client).toBeDefined();
  });

  it('should handle a chat request', async () => {
    // This will use the mocked Mercury API
    
    // Send a test message
    const response = await client.request({
      method: 'chat',
      params: {
        message: 'Hello, world!'
      }
    });

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(typeof response.content).toBe('string');
  });
}); 