import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import * as readline from 'readline';

// Path to the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the minimal server script
const serverPath = path.join(__dirname, 'test-fallback.js');
console.log(`Test server path: ${serverPath}`);

// Spawn the server process
const serverProcess = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Set up readline to read stdout line by line
const stdoutReader = readline.createInterface({
  input: serverProcess.stdout,
  crlfDelay: Infinity
});

// Process server responses from stdout
stdoutReader.on('line', (line) => {
  if (line.trim()) {
    console.log('🟢 Server stdout:', line);
    try {
      const parsed = JSON.parse(line);
      console.log('📊 Parsed JSON-RPC:', JSON.stringify(parsed, null, 2));
    } catch (error) {
      // Not JSON data - just standard output
    }
  }
});

// Process stderr for debug info
const stderrReader = readline.createInterface({
  input: serverProcess.stderr,
  crlfDelay: Infinity
});

stderrReader.on('line', (line) => {
  if (line.trim()) {
    console.log('🔴 Server stderr:', line);
  }
});

// Handle process events
serverProcess.on('error', (error) => {
  console.error('❌ Server process error:', error);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`🏁 Server process exited with code ${code}`);
  process.exit(0);
});

// Function to wrap writing to stdin with error handling
function writeJsonRpc(request) {
  console.log(`📤 Sending: ${JSON.stringify(request)}`);
  try {
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  } catch (error) {
    console.error('❌ Error sending request:', error);
  }
}

// Give the server time to start up
setTimeout(() => {
  console.log('🚀 Sending initialize request...');
  const initRequest = {
    jsonrpc: '2.0',
    id: '1',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      },
      capabilities: {}
    }
  };
  
  writeJsonRpc(initRequest);
  
  // Wait for response before sending chat request
  setTimeout(() => {
    console.log('💬 Sending chat request...');
    const chatRequest = {
      jsonrpc: '2.0',
      id: '3',
      method: 'chat',
      params: {
        message: 'Hello, world!',
        context: {
          code: 'function test() { return "hello"; }'
        }
      }
    };
    
    writeJsonRpc(chatRequest);
    
    // Give server time to respond before exiting
    setTimeout(() => {
      console.log('🏁 Test completed, terminating server...');
      serverProcess.kill();
    }, 5000);
  }, 1000);
}, 1000); 