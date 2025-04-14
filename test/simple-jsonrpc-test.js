import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the server
function startServer(scriptPath) {
  console.log(`Starting test server: ${scriptPath}`);
  
  const env = {
    ...process.env,
    MERCURY_API_KEY: 'test_api_key',
    MCP_SDK_DEBUG: '1',
  };
  
  const serverProcess = spawn('node', [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`SERVER OUTPUT: ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.log(`SERVER ERROR: ${data.toString().trim()}`);
  });
  
  return serverProcess;
}

// Send a JSON-RPC request to the server
function sendRequest(serverProcess, request) {
  console.log(`Sending request: ${JSON.stringify(request)}`);
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
}

// Main test function
async function runTest() {
  // Start our test server
  const serverProcess = startServer(path.resolve(__dirname, 'test-methods.js'));
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send initialize request
  sendRequest(serverProcess, {
    jsonrpc: '2.0',
    id: '1',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    },
  });
  
  // Wait for server to process
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Send ping request
  sendRequest(serverProcess, {
    jsonrpc: '2.0',
    id: '2',
    method: 'ping',
    params: {},
  });
  
  // Wait for server to process
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Send chat request
  sendRequest(serverProcess, {
    jsonrpc: '2.0',
    id: '3',
    method: 'chat',
    params: {
      message: 'Hello, world!',
      context: {
        code: "function test() { return 'hello'; }",
      },
    },
  });
  
  // Wait for server to process
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Terminate the server
  console.log('Terminating server...');
  serverProcess.kill();
}

// Run the test
runTest().catch((err) => {
  console.error('Error in test:', err);
  process.exit(1);
}); 