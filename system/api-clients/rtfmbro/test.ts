/**
 * rtfmbro MCP Client - Using official MCP SDK
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHttpClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_URL = 'https://rtfmbro.smolosoft.dev/mcp/';

async function main() {
  console.log('=== rtfmbro MCP Client (SDK) ===\n');

  try {
    // Create client
    const client = new Client({
      name: 'test-client',
      version: '1.0.0'
    });

    // Create transport
    const transport = new StreamableHttpClientTransport({
      url: new URL(MCP_URL),
      requestInit: {
        headers: {
          'Accept': 'text/event-stream, application/json'
        }
      }
    });

    // Connect
    console.log('1. Connecting...');
    await client.connect(transport);
    console.log('   Connected');

    // List tools
    console.log('\n2. Listing tools...');
    const tools = await client.listTools();
    console.log('   Tools:', tools.tools.map(t => t.name).join(', '));

    // Call get_readme
    console.log('\n3. Calling get_readme...');
    const readme = await client.callTool('get_readme', {
      package: 'flask',
      version: '*',
      ecosystem: 'pypi'
    });
    console.log('   Result:', readme);

    console.log('\n=== Done ===');
  } catch (error) {
    console.error('\nError:', error.message);
    console.error(error.stack);
  }
}

main();
