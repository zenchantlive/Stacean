/**
 * Brave Search API Client
 * https://api.search.brave.com/docs/introduction
 * 
 * Free tier: 1,000 queries/month
 * No API key needed for basic search
 */

import https from 'https';

const BRAVE_API_BASE = 'api.search.brave.com';

export async function search(query, count = 10) {
  return new Promise((resolve, reject) => {
    const url = `https://${BRAVE_API_BASE}/search?q=${encodeURIComponent(query)}&count=${count}`;
    
    const req = https.get(url, {
      headers: {
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.web?.results) {
            resolve(json.web.results.map(r => ({
              title: r.title,
              url: r.url,
              description: r.description
            })));
          } else {
            resolve([]);
          }
        } catch (e) {
          reject(new Error(`Failed to parse: ${data.slice(0, 100)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

export default { search };
