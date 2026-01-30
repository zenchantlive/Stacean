/**
 * rtfmbro MCP Client - Full SSE streaming
 */

import https from 'https';

const MCP_URL = 'https://rtfmbro.smolosoft.dev/mcp/';

let sessionId = null;
let sseRes = null;
let sseBuffer = '';
const pending = new Map();

function httpsGet() {
  return new Promise((resolve, reject) => {
    const req = https.get(MCP_URL, {
      headers: { 'Accept': 'text/event-stream' }
    }, (res) => {
      sseRes = res;
      sessionId = res.headers['mcp-session-id'];

      // Process SSE stream
      res.on('data', (chunk) => {
        sseBuffer += chunk.toString();
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              console.log('SSE:', JSON.stringify(json).slice(0, 150));
              if (json.id && pending.has(json.id)) {
                const { resolve: resFn, reject: rejFn } = pending.get(json.id);
                pending.delete(json.id);
                if (json.error) rejFn(new Error(json.error.message));
                else resFn(json);
              }
            } catch (e) {}
          }
        }
      });

      resolve();
    });

    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('GET timeout')); });
    req.end();
  });
}

function httpsPost(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = String(Date.now());
    const body = JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id
    });

    pending.set(id, { resolve, reject });

    const req = https.request(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mcp-session-id': sessionId,
        'Accept': 'text/event-stream'
      }
    }, (res) => {
      // Response comes via SSE
      resolve({ status: res.statusCode });
    });

    req.on('error', (e) => {
      pending.delete(id);
      reject(e);
    });

    req.setTimeout(15000, () => {
      pending.delete(id);
      req.destroy();
      reject(new Error('POST timeout'));
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== rtfmbro - Full SSE Stream ===\n');

  try {
    // Open SSE connection
    console.log('1. Opening SSE connection...');
    await httpsGet();
    console.log('   Session:', sessionId?.slice(0, 8));

    // Wait for SSE to be ready
    await new Promise(r => setTimeout(r, 500));

    // Initialize
    console.log('\n2. Initialize...');
    const init = await httpsPost('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' }
    });
    console.log('   Init sent');

    // Wait for response
    await new Promise(r => setTimeout(r, 1000));

    // Try get_readme
    console.log('\n3. get_readme...');
    const readme = await httpsPost('get_readme', {
      package: 'flask',
      version: '*',
      ecosystem: 'pypi'
    });
    console.log('   Response received');

    // Wait for response
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n=== Done ===');
  } catch (error) {
    console.error('\nError:', error.message);
  }
}

main();
