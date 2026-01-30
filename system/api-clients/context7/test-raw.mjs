const KEY = process.env.CONTEXT7_API_KEY || '';
console.log('Key length:', KEY.length, 'Prefix:', KEY.slice(0, 8));

// Direct fetch test
const url = 'https://context7.com/api/v2/libs/search?libraryName=next.js&query=middleware';
fetch(url, {
  headers: { 'Authorization': `Bearer ${KEY}`, 'User-Agent': 'NodeTest/1.0' }
}).then(r => {
  console.log('Status:', r.status, r.statusText);
  return r.text();
}).then(t => {
  console.log('Response type:', typeof t);
  console.log('First 200 chars:', t.slice(0, 200));
}).catch(e => console.error('Error:', e.message));
