/**
 * Context7 API Client - Test script
 */

import { searchLibrary, getContext, setApiKey } from './client.mjs';

const API_KEY = process.env.CONTEXT7_API_KEY || '';
if (!API_KEY) {
  console.log('Set CONTEXT7_API_KEY environment variable first');
  console.log('Sign up at https://context7.com for a free API key');
  process.exit(1);
}

setApiKey(API_KEY);

async function test() {
  console.log('=== Context7 API Test ===\n');
  
  // Step 1: Search for Next.js
  console.log('1. Searching for Next.js...');
  const libs = await searchLibrary('next.js', 'middleware');
  
  console.log('Response type:', typeof libs);
  console.log('Has results:', libs?.results?.length > 0);
  
  if (libs?.results?.[0]) {
    const best = libs.results[0];
    console.log('\nBest match:', best.title);
    console.log('  ID:', best.id);
    console.log('  Description:', best.description?.slice(0, 80) + '...');
    
    // Step 2: Get context
    console.log('\n2. Fetching documentation for:', best.id);
    const docs = await getContext(best.id, 'How to set up middleware?');
    console.log('Got', docs.length, 'snippets');
    docs.slice(0, 3).forEach((d, i) => {
      console.log(`  [${i+1}] ${d.title}`);
      console.log(`     ${d.source}`);
    });
  }
  
  console.log('\n=== Test passed! ===');
}

test().catch(e => console.error('Error:', e.message));
