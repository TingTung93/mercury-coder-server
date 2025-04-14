// Manual test for Mercury Coder Server
// Run with: node test/manual-test-simplified.js

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to the server script
const serverPath = path.resolve(__dirname, '../build/index.js');

console.log("Starting Mercury Coder Server test...");
console.log(`Server path: ${serverPath}`);

// Set API key for testing
process.env.MERCURY_API_KEY = process.env.MERCURY_API_KEY || 'test_api_key';

// Start the server
const server = spawn('node', [serverPath], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server output
server.stdout.on('data', (data) => {
  console.log(`Server stdout: ${data}`);
});

server.stderr.on('data', (data) => {
  console.log(`Server stderr: ${data.toString()}`);
});

// Handle server errors/exit
server.on('error', (error) => {
  console.error(`Server error: ${error.message}`);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code || 0);
});

// Send a simple request to the server
const request = {
  jsonrpc: "2.0",
  id: "1",
  method: "chat",
  params: {
    message: "Hello, world!",
    context: {
      code: "function test() { return 'hello'; }"
    }
  }
};

// Wait for server to start
setTimeout(() => {
  console.log("Sending request to server:");
  console.log(JSON.stringify(request, null, 2));
  
  // Send the request to the server's stdin
  server.stdin.write(JSON.stringify(request) + "\n");
  
  // Wait for response then exit
  setTimeout(() => {
    console.log("Test complete, terminating server.");
    server.kill();
    process.exit(0);
  }, 3000);
}, 1000); 