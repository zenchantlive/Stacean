/**
 * Brave Search API Client - Test
 */

import { search } from './client.mjs';

async function testSearch() {
  console.log('=== Brave Search Test ===\n');
  
  try {
    console.log('Searching for "AI agents MCP 2026"...');
    const results = await search('AI agents MCP 2026', 5);
    
    console.log(`\nFound ${results.length} results:\n`);
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   URL: ${r.url}`);
      console.log(`   ${r.description?.slice(0, 150)}...\n`);
    });
    
    console.log('=== Test passed! ===');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSearch();
