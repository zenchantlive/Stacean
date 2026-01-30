/**
 * DuckDuckGo Search Test
 */

import { search } from './client.mjs';

async function test() {
  console.log('=== DuckDuckGo Search Test ===\n');
  
  try {
    console.log('Searching for "AI agents MCP"...');
    const results = await search('AI agents MCP 2024');
    
    console.log(`\nFound ${results.results.length} results:\n`);
    results.results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   ${r.url}\n`);
    });
    
    console.log('=== Test passed! ===');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
