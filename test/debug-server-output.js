#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { setTimeout } from 'timers/promises';

// Server path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.resolve(__dirname, '../build/index.js');

console.log('Starting debug session for Mercury Coder Server with full output capture');
console.log('Server path:', serverPath);

// Environment setup
process.env.MERCURY_API_KEY = 'test_api_key';
process.env.DEBUG = 'mcp:*';

// Spawn server process
const server = spawn('node', [serverPath], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe'] // Capture stdout and stderr
});

console.log('Server spawned with PID:', server.pid);

// Capture server output
server.stdout.on('data', (data) => {
  console.log(`[SERVER OUT]: ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.log(`[SERVER ERR]: ${data.toString().trim()}`);
});

// Prepare JSON-RPC requests
const requests = [
  // Initialize
  {
    jsonrpc: '2.0',
    id: '1',
    method: 'initialize',
    params: {
      protocolVersion: '0.1.0',
      clientInfo: {
        name: 'Test Client',
        version: '1.0.0'
      },
      capabilities: {
        methods: ['ping', 'chat']
      }
    }
  },
  // Ping
  {
    jsonrpc: '2.0',
    id: '2',
    method: 'ping',
    params: {}
  },
  // Chat
  {
    jsonrpc: '2.0',
    id: '3',
    method: 'chat',
    params: {
      message: 'Hello, world!',
      context: {
        code: 'function test() { return "hello"; }'
      }
    }
  }
];

// Function to send requests with delay
async function sendRequests() {
  try {
    // Wait for server to start
    await setTimeout(1000);
    
    for (const request of requests) {
      console.log(`\n[CLIENT]: Sending request: ${JSON.stringify(request, null, 2)}`);
      
      server.stdin.write(JSON.stringify(request) + '\n');
      
      // Wait for response to be processed
      await setTimeout(500);
    }
    
    // Wait for final response and terminate
    await setTimeout(1000);
    console.log('\nTest completed, terminating server...');
    server.kill('SIGINT');
    
  } catch (error) {
    console.error('[ERROR]: Error during test:', error);
    server.kill('SIGINT');
  }
}

// Start test sequence
sendRequests();

// Handle server exit
server.on('exit', (code, signal) => {
  console.log(`[DONE]: Server exited with code: ${code}, signal: ${signal}`);
  process.exit(0);
}); 