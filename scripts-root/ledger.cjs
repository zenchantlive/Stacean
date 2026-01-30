#!/usr/bin/env node
/**
 * Atlas Ledger CLI
 * Pushes updates to the Dashboard Ledger
 * 
 * Usage:
 *   node scripts/ledger.cjs "Message" [type]
 *   node scripts/ledger.cjs "Working on X" "session"
 */

const https = require('https');

const API_URL = 'https://blog-wheat-mu-85.vercel.app/api/ledger';

function pushToLedger(message, type = 'system') {
  const data = JSON.stringify({
    message,
    type,
    timestamp: new Date().toISOString()
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(API_URL, options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`✅ Ledger updated: "[${type}] ${message}"`);
      } else {
        console.error(`❌ Failed: ${res.statusCode} ${body}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
  });

  req.write(data);
  req.end();
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node scripts/ledger.cjs <message> [type]');
  process.exit(1);
}

pushToLedger(args[0], args[1]);
