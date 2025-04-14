#!/usr/bin/env node

/**
 * Simple test script for Mercury Coder Server code tools
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Start the server in a child process
const server = spawn('node', ['build/index.js'], {
  env: { ...process.env }
});

// Create interface to read/write to server's stdio
const rl = readline.createInterface({
  input: server.stdout,
  output: server.stdin,
  terminal: false
});

// Enable debug logging
let debugMode = true;

// Tracking state
let requestCount = 0;
let responseCount = 0;
let requests = {};

// Log server stderr for debugging
server.stderr.on('data', (data) => {
  if (debugMode) console.error(`SERVER LOG: ${data.toString().trim()}`);
});

// Handle responses from the server
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    responseCount++;
    
    console.log(`\n===== RESPONSE ${responseCount} =====`);
    
    if (response.error) {
      console.log(`ERROR: ${response.error.code} - ${response.error.message}`);
    } else if (response.result) {
      console.log(`SUCCESS for request ID: ${response.id}`);
      if (debugMode) {
        console.log("Result:", response.result);
      }
    } else if (response.method === "$/progress") {
      console.log(`PROGRESS: ${response.params.value.message}`);
      return; // Don't count progress notifications in our test completion logic
    }
    
    // Check if we should exit after all responses received
    if (responseCount >= requestCount) {
      console.log("\nAll requests completed. Exiting...");
      server.kill();
      process.exit(0);
    }
  } catch (error) {
    console.error(`Error parsing server response: ${error.message}`);
    console.error(`Raw response: ${line}`);
  }
});

// Function to send a request to the server
function sendRequest(method, params) {
  const id = (++requestCount).toString();
  const request = {
    jsonrpc: "2.0",
    id,
    method,
    params
  };
  
  requests[id] = request;
  
  console.log(`\n===== REQUEST ${id}: ${method} =====`);
  if (debugMode) console.log(JSON.stringify(request, null, 2));
  
  rl.output.write(JSON.stringify(request) + '\n');
  return id;
}

// Start with a ping
console.log("Testing Mercury Coder Server with code tools...");
sendRequest("ping", {});

// Test the analyze_code tool
setTimeout(() => {
  sendRequest("chat", {
    message: "Analyze this code for improvements",
    context: {
      code: `
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
      `,
      language: "javascript"
    },
    _meta: {
      progressToken: "analyze-progress"
    }
  });
}, 1000);

// Test another code tool
setTimeout(() => {
  sendRequest("chat", {
    message: "Document this function",
    context: {
      code: `
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[0];
  const left = [];
  const right = [];
  
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < pivot) left.push(arr[i]);
    else right.push(arr[i]);
  }
  
  return [...quickSort(left), pivot, ...quickSort(right)];
}
      `,
      language: "javascript"
    },
    _meta: {
      progressToken: "document-progress"
    }
  });
}, 3000);

// Handle exit cleanly
process.on('SIGINT', () => {
  console.log("\nInterrupted. Shutting down...");
  server.kill();
  process.exit(0);
}); 