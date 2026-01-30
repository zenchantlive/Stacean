/**
 * Wikipedia API Test
 */

import { search, randomArticle } from './client.mjs';

async function test() {
  console.log('=== Wikipedia API Test ===\n');
  
  try {
    console.log('Searching for "Artificial Intelligence"...');
    const results = await search('Artificial Intelligence', 3);
    
    console.log(`\nFound ${results.length} results:\n`);
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   ${r.url}`);
      console.log(`   ${r.description?.slice(0, 200)}...\n`);
    });

    console.log('--- Random Article ---');
    const random = await randomArticle();
    console.log(random.title);
    console.log(random.description?.slice(0, 300) + '...');
    
    console.log('\n=== Test passed! ===');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
