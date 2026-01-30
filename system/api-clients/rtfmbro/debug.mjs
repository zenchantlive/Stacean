import https from 'https';

const MCP_URL = 'https://rtfmbro.smolosoft.dev/mcp/';

async function debugSSE() {
  console.log('=== Debugging rtfmbro SSE ===\n');

  const req = https.request(MCP_URL, {
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream',
      'Connection': 'keep-alive'
    }
  }, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));

    let buffer = '';
    res.on('data', (chunk) => {
      buffer += chunk.toString();
      console.log('\n--- Received chunk ---');
      console.log(buffer.slice(-500));
      buffer = buffer.slice(-1000); // Keep last 1000 chars
    });

    res.on('end', () => {
      console.log('\n--- Connection ended ---');
    });

    res.on('error', (err) => {
      console.error('Res error:', err);
    });
  });

  req.on('error', (err) => {
    console.error('Req error:', err);
  });

  req.setTimeout(10000, () => {
    console.log('\n--- Timeout, closing ---');
    req.destroy();
  });

  req.end();

  // Wait a bit then make a POST
  setTimeout(async () => {
    console.log('\n--- Making POST request ---');

    const postReq = https.request(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      }
    }, (res) => {
      let postBuffer = '';
      res.on('data', (chunk) => {
        postBuffer += chunk.toString();
        console.log('\n--- POST chunk ---');
        console.log(postBuffer.slice(-500));
      });
      res.on('end', () => {
        console.log('\n--- POST ended ---');
      });
    });

    postReq.on('error', console.error);
    postReq.write(JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'get_readme',
      params: { package: 'flask', version: '3.1.1', ecosystem: 'pypi' }
    }));
    postReq.end();

  }, 3000);
}

debugSSE();
