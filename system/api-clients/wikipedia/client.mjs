/**
 * Wikipedia API Client
 * https://www.mediawiki.org/wiki/API
 * 
 * 100% Free, no API key required
 */

import https from 'https';

const WIKI_API_BASE = 'en.wikipedia.org';
const USER_AGENT = 'AtlasAgent/1.0 (research project)';

export async function search(query, limit = 5) {
  // Step 1: Search for pages
  const searchParams = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(limit),
    format: 'json',
    origin: '*'
  });

  const searchResults = await new Promise((resolve, reject) => {
    const url = `https://${WIKI_API_BASE}/w/api.php?${searchParams.toString()}`;
    
    const req = https.get(url, {
      headers: { 'User-Agent': USER_AGENT }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${data.slice(0, 100)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });

  const pages = searchResults.query?.search || [];
  
  // Step 2: Get summaries for each page
  const results = [];
  for (const page of pages.slice(0, limit)) {
    const summaryParams = new URLSearchParams({
      action: 'query',
      prop: 'extracts|pageimages',
      exintro: '1',
      explaintext: '1',
      pithumbsize: '100',
      pageids: String(page.pageid),
      format: 'json',
      origin: '*'
    });

    const summary = await new Promise((resolve, reject) => {
      const url = `https://${WIKI_API_BASE}/w/api.php?${summaryParams.toString()}`;
      const req = https.get(url, {
        headers: { 'User-Agent': USER_AGENT }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
      req.end();
    });

    const pageData = summary.query?.pages?.[page.pageid];
    if (pageData) {
      results.push({
        title: pageData.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageData.title.replace(/ /g, '_'))}`,
        description: pageData.extract?.slice(0, 300) || ''
      });
    }
  }

  return results;
}

/**
 * Get random article
 */
export async function randomArticle() {
  return new Promise((resolve, reject) => {
    const url = `https://${WIKI_API_BASE}/w/api.php?action=query&generator=random&grnnamespace=0&prop=extracts|pageimages&exintro=1&explaintext=1&pithumbsize=100&format=json&origin=*`;
    
    const req = https.get(url, {
      headers: { 'User-Agent': USER_AGENT }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query?.pages || {};
          const page = Object.values(pages)[0];
          resolve({
            title: page.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            description: page.extract?.slice(0, 500)
          });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

export default { search, randomArticle };
