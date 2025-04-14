// Simplified test for Mercury Coder Server
// Run with: node test/simple-test.js

import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to the server script
const serverPath = path.resolve(__dirname, '../build/index.js');

console.log("Starting minimal Mercury Coder Server test...");
console.log(`Server path: ${serverPath}`);

// Set API key for testing
process.env.MERCURY_API_KEY = 'test_api_key';

// Simple test using execFile
const serverProcess = execFile('node', [serverPath], {
  env: process.env,
  timeout: 10000, // 10 seconds timeout
}, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  console.log('Server stdout:');
  console.log(stdout);
  
  console.log('Server stderr:');
  console.log(stderr);
});

// Prepare a request
const request = JSON.stringify({
  jsonrpc: '2.0', 
  id: '1',
  method: 'ping' // Try a built-in method first
}) + '\n';

// Wait briefly for the server to start
setTimeout(() => {
  console.log("\nSending ping request to server...");
  if (serverProcess.stdin) {
    serverProcess.stdin.write(request);
  } else {
    console.error("stdin is not available");
  }
}, 1000);

// Exit after a timeout
setTimeout(() => {
  console.log("Test complete, terminating server");
  serverProcess.kill();
}, 5000); 