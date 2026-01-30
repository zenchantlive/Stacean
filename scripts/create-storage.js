/**
 * Create Vercel KV and Blob stores via API
 */

const https = require('https');

const OIDC_TOKEN = process.env.VERCEL_OIDC_TOKEN;
const PROJECT_ID = 'prj_jnjKxgKw5u1MgooeBcMRHWnR8tzd';
const TEAM_ID = 'team_nAp7S3fymppH8H9RjsuXjXsA';

// API endpoint helper
function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(`https://api.vercel.com${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${OIDC_TOKEN}`,
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createKVStore() {
  console.log('Creating KV store...');
  try {
    const result = await apiRequest('/v2/kv/databases', 'POST', {
      name: 'blog-kv',
      projectId: PROJECT_ID,
      teamId: TEAM_ID,
      region: 'iad1',
    });
    console.log('KV Store created:', result);
    return result;
  } catch (error) {
    console.error('KV creation error:', error.message);
    return null;
  }
}

async function createBlobStore() {
  console.log('Creating Blob store...');
  try {
    const result = await apiRequest('/v2/blob/stores', 'POST', {
      name: 'blog-blob',
      projectId: PROJECT_ID,
      teamId: TEAM_ID,
    });
    console.log('Blob Store created:', result);
    return result;
  } catch (error) {
    console.error('Blob creation error:', error.message);
    return null;
  }
}

async function main() {
  console.log('=== Creating Vercel Storage Resources ===\n');
  
  await createKVStore();
  await createBlobStore();
  
  console.log('\nDone! Run `npx vercel env pull` to get the credentials.');
}

main();