/**
 * DuckDuckGo Instant Answer API
 * https://duckduckgo.com/api
 * 
 * 100% Free, no API key required
 */

import https from 'https';

const DDG_API_BASE = 'api.duckduckgo.com';

export async function search(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    no_html: '1',
    skip_disambig: '1'
  });

  return new Promise((resolve, reject) => {
    const url = `https://${DDG_API_BASE}/?${params.toString()}`;
    
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const results = (json.RelatedTopics || [])
            .filter(t => t.FirstURL)
            .slice(0, 10)
            .map(t => ({
              title: t.Text.split(' - ')[0] || t.Text,
              url: t.FirstURL,
              description: t.Text
            }));
          resolve({
            results,
            answer: json.Answer
          });
        } catch (e) {
          reject(new Error(`Parse error: ${data.slice(0, 100)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

/**
 * Example usage
 */
async function example() {
  console.log('=== DuckDuckGo Search ===\n');
  
  const results = await search('TypeScript best practices');
  
  console.log(`Found ${results.results.length} results:\n`);
  results.results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   ${r.url}\n`);
  });
}

// example();

export default { search };
