const https = require('https');
const net = require('net');
const tls = require('tls');

const MCP_HOST = 'rtfmbro.smolosoft.dev';
const MCP_PORT = 443;

async function testRaw() {
  console.log('=== Raw TCP Test ===\n');

  // Create raw socket
  const socket = new net.Socket();

  const sslSocket = tls.connect({
    host: MCP_HOST,
    port: MCP_PORT,
    rejectUnauthorized: false
  }, () => {
    console.log('Connected');

    // Step 1: GET request to establish session
    const getReq = `GET /mcp/ HTTP/2\r\nHost: ${MCP_HOST}\r\nAccept: text/event-stream\r\n\r\n`;
    console.log('Sending GET...');
    sslSocket.write(getReq);
  });

  let sessionId = null;
  let buffer = '';

  sslSocket.on('data', (data) => {
    buffer += data.toString();
    console.log('Received:', buffer.slice(0, 300));

    // Extract session ID
    const match = buffer.match(/mcp-session-id:\s*([^\r\n]+)/i);
    if (match && !sessionId) {
      sessionId = match[1].trim();
      console.log('\nSession ID:', sessionId.slice(0, 8) + '...');

      // Step 2: POST initialize
      setTimeout(() => {
        const postReq = [
          `POST /mcp/ HTTP/2`,
          `Host: ${MCP_HOST}`,
          `Content-Type: application/json`,
          `Accept: application/json, text/event-stream`,
          `mcp-session-id: ${sessionId}`,
          `Content-Length: 158`,
          ``,
          `{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}`
        ].join('\r\n') + '\r\n';

        console.log('\nSending initialize...');
        sslSocket.write(postReq);
      }, 100);
    }
  });

  sslSocket.on('end', () => console.log('Connection closed'));
  sslSocket.on('error', (e) => console.error('Error:', e.message));

  await new Promise(r => setTimeout(r, 5000));
  sslSocket.end();
}

testRaw();
