#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { setTimeout } from 'timers/promises';

// Server path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.resolve(__dirname, '../build/src/simple-server.js');

console.log('==============================================');
console.log('Mercury Coder Server Demo');
console.log('==============================================');
console.log('Server path:', serverPath);

// Environment setup
process.env.MERCURY_API_KEY = 'test_api_key';
process.env.DEBUG = 'mcp:*';

// Spawn server process
const server = spawn('node', [serverPath], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe'] // Capture stdout and stderr
});

console.log(`Server started with PID: ${server.pid}`);

// Capture server output
server.stdout.on('data', (data) => {
  const response = data.toString().trim();
  try {
    // Try to parse as JSON for better formatting
    const jsonResponse = JSON.parse(response);
    console.log(`\n[SERVER RESPONSE]:`);
    console.log(JSON.stringify(jsonResponse, null, 2));
  } catch (e) {
    // Fall back to plain text if not JSON
    console.log(`\n[SERVER OUTPUT]: ${response}`);
  }
});

server.stderr.on('data', (data) => {
  console.log(`\n[SERVER LOG]: ${data.toString().trim()}`);
});

// Prepare JSON-RPC requests
const requests = [
  // Initialize connection
  {
    jsonrpc: '2.0',
    id: '1',
    method: 'initialize',
    params: {
      protocolVersion: '0.1.0',
      clientInfo: {
        name: 'Mercury Coder Demo Client',
        version: '1.0.0'
      },
      capabilities: {
        methods: ['ping', 'chat']
      }
    }
  },
  
  // Ping to check server health
  {
    jsonrpc: '2.0',
    id: '2',
    method: 'ping',
    params: {}
  },
  
  // Chat with simple text
  {
    jsonrpc: '2.0',
    id: '3',
    method: 'chat',
    params: {
      message: 'Hello, I need help with some code.',
      context: {}
    }
  },
  
  // Chat with code context
  {
    jsonrpc: '2.0',
    id: '4',
    method: 'chat',
    params: {
      message: 'What does this code do?',
      context: {
        code: `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}
        `
      }
    }
  }
];

// Function to send requests with delay
async function sendRequests() {
  try {
    // Wait for server to start
    await setTimeout(1000);
    
    for (const [index, request] of requests.entries()) {
      console.log(`\n==============================================`);
      console.log(`Demo Request #${index + 1}: ${request.method}`);
      console.log(`==============================================`);
      console.log(JSON.stringify(request, null, 2));
      
      server.stdin.write(JSON.stringify(request) + '\n');
      
      // Wait for response to be processed
      await setTimeout(1000);
    }
    
    // Wait for final response and terminate
    await setTimeout(1000);
    console.log('\n==============================================');
    console.log('Demo completed, shutting down server...');
    console.log('==============================================');
    server.kill('SIGINT');
    
  } catch (error) {
    console.error('Error during demo:', error);
    server.kill('SIGINT');
  }
}

// Start demo sequence
sendRequests();

// Handle server exit
server.on('exit', (code, signal) => {
  console.log(`\nServer exited with code: ${code}, signal: ${signal}`);
  console.log('==============================================');
  process.exit(0);
}); 