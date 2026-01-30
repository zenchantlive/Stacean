/**
 * Context7 API Client - Test script
 * Docs: https://context7.com/docs/api-guide
 * 
 * Run: CONTEXT7_API_KEY=your_key node test.mjs
 */

const API_KEY = process.env.CONTEXT7_API_KEY || '';
if (!API_KEY) {
  console.log('Set CONTEXT7_API_KEY environment variable first');
  console.log('Sign up at https://context7.com for a free API key');
  process.exit(1);
}

const BASE_URL = 'https://context7.com/api/v2';

async function searchLibrary(libraryName, query = '') {
  const url = `${BASE_URL}/libs/search?libraryName=${encodeURIComponent(libraryName)}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'User-Agent': 'Context7-Test/1.0' }
  });
  return res.json();
}

async function getContext(libraryId, query) {
  const url = `${BASE_URL}/context?libraryId=${encodeURIComponent(libraryId)}&query=${encodeURIComponent(query)}&type=json`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'User-Agent': 'Context7-Test/1.0' }
  });
  const data = await res.json();
  
  // Normalize codeSnippets format
  if (data?.codeSnippets) {
    return data.codeSnippets.map(s => ({
      title: s.codeTitle,
      content: s.codeDescription,
      source: s.codeId,
      language: s.codeLanguage
    }));
  }
  return data;
}

async function test() {
  console.log('=== Context7 API Test ===\n');
  
  // Step 1: Search for library
  console.log('1. Searching for Next.js...');
  const libs = await searchLibrary('next.js', 'middleware');
  console.log('Found', libs.results?.length, 'libraries');
  
  if (libs.results?.[0]) {
    const best = libs.results[0];
    console.log('Best match:', best.title);
    console.log('  ID:', best.id);
    console.log('  Description:', best.description?.slice(0, 60) + '...');
    
    // Step 2: Get documentation context
    console.log('\n2. Fetching documentation...');
    const docs = await getContext(best.id, 'How to set up middleware?');
    console.log('Got', docs.length, 'snippets:');
    docs.slice(0, 3).forEach((d, i) => {
      console.log('  [' + (i+1) + ']', d.title);
      console.log('     Source:', d.source);
      console.log('     Lang:', d.language);
    });
  }
  
  console.log('\n=== Test passed! ===');
}

test().catch(e => console.error('Error:', e.message));
