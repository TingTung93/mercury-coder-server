import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverScriptPath = path.resolve(__dirname, '../build/index.js');

// Set environment variables
process.env.MERCURY_API_KEY = 'test_api_key';

console.log('Starting test...');
console.log(`Server path: ${serverScriptPath}`);

// Spawn the server process
const server = spawn('node', [serverScriptPath], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Log server output
server.stdout.on('data', (data) => {
  console.log(`Server stdout: ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.error(`Server stderr: ${data.toString().trim()}`);
});

// Test function to send JSON-RPC requests to the server
const sendRequest = (request) => {
  return new Promise((resolve, reject) => {
    const requestStr = JSON.stringify(request) + '\n';
    console.log(`Sending request: ${requestStr.trim()}`);
    
    // Listen for response
    const responseHandler = (data) => {
      try {
        const response = JSON.parse(data.toString());
        console.log(`Received response: ${JSON.stringify(response, null, 2)}`);
        resolve(response);
      } catch (error) {
        console.error('Error parsing response:', error);
        reject(error);
      }
    };
    
    // Add one-time listener for the response
    server.stdout.once('data', responseHandler);
    
    // Send the request
    server.stdin.write(requestStr, (err) => {
      if (err) {
        console.error('Error writing to stdin:', err);
        server.stdout.removeListener('data', responseHandler);
        reject(err);
      }
    });
  });
};

// Wait for server to start
setTimeout(async () => {
  try {
    // Initialize request
    await sendRequest({
      jsonrpc: "2.0",
      id: "init",
      method: "initialize",
      params: {
        protocolVersion: "0.1.0",
        clientInfo: {
          name: "test-client",
          version: "1.0.0"
        },
        capabilities: {
          methods: ["chat", "ping"],
          tools: {}
        }
      }
    });

    // Ping request
    await sendRequest({
      jsonrpc: "2.0",
      id: "ping-1",
      method: "ping"
    });

    // Chat request
    await sendRequest({
      jsonrpc: "2.0",
      id: "chat-1",
      method: "chat",
      params: {
        message: "Hello, world!",
        context: {
          code: "function test() { return 'hello'; }"
        }
      }
    });
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Kill the server after tests
    console.log('Shutting down server...');
    server.kill();
    process.exit(0);
  }
}, 2000);

// Clean shutdown on SIGINT
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.kill();
  process.exit(0);
}); 