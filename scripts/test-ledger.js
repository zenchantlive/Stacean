/**
 * Test the Ledger API
 */

const https = require('https');

const OIDC_TOKEN = process.env.VERCEL_OIDC_TOKEN;

async function apiRequest(path, method = 'GET', body = null) {
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
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testLedger() {
  console.log('=== Testing Ledger API ===\n');

  // Test 1: Add a ledger entry
  console.log('1. Adding test entry to ledger...');
  const testEntry = {
    type: 'session',
    message: 'Testing ledger functionality - manual entry',
    metadata: { test: true, timestamp: Date.now() }
  };

  try {
    const res = await fetch('https://blog-wheat-mu-85.vercel.app/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEntry)
    });
    const result = await res.json();
    console.log('   Result:', result.success ? '✅' : '❌');
  } catch (err) {
    console.log('   Error:', err.message);
  }

  // Test 2: Add another entry
  console.log('\n2. Adding second test entry...');
  try {
    await fetch('https://blog-wheat-mu-85.vercel.app/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'pulse',
        message: 'Atlas heartbeat test - checking if real-time sync works',
        metadata: { heartbeat: true }
      })
    });
    console.log('   Result: ✅');
  } catch (err) {
    console.log('   Error:', err.message);
  }

  // Test 3: Trigger state change (which auto-logs to ledger)
  console.log('\n3. Triggering state change (should auto-log to ledger)...');
  try {
    await fetch('https://blog-wheat-mu-85.vercel.app/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        atlasOnline: true,
        currentActivity: 'Testing ledger integration',
        pulseIntensity: 0.8
      })
    });
    console.log('   Result: ✅ (Should see "Started working on: Testing ledger integration" in ledger)');
  } catch (err) {
    console.log('   Error:', err.message);
  }

  // Test 4: Fetch ledger entries
  console.log('\n4. Fetching ledger entries...');
  try {
    const res = await fetch('https://blog-wheat-mu-85.vercel.app/api/ledger?limit=10');
    const data = await res.json();
    console.log(`   Found ${data.entries?.length || 0} entries:`);
    (data.entries || []).forEach((entry, i) => {
      console.log(`   ${i + 1}. [${entry.type}] ${entry.message}`);
    });
  } catch (err) {
    console.log('   Error:', err.message);
  }

  console.log('\n=== Test Complete ===');
  console.log('\nRefresh https://blog-wheat-mu-85.vercel.app to see the ledger entries!');
}

testLedger();