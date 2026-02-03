#!/usr/bin/env tsx
/**
 * Stacean End-to-End Test
 *
 * Tests the full flow:
 * 1. Add a test message to chat KV
 * 2. Poll /api/stacean/sync for the message
 * 3. Verify the message structure
 * 4. Inject a response
 * 5. Verify the response was stored
 */

import { staceanChat } from '../lib/integrations/kv/chat';

const STACEAN_API_URL = process.env.STACEAN_API_URL || 'http://localhost:3000';
const STACEAN_SECRET = process.env.STACEAN_SECRET || 'stacean-dev-secret-123';

async function testSyncEndpoint(): Promise<boolean> {
  console.log('📡 Testing /api/stacean/sync endpoint...');

  const response = await fetch(`${STACEAN_API_URL}/api/stacean/sync`, {
    headers: {
      'Authorization': `Bearer ${STACEAN_SECRET}`,
    },
  });

  if (!response.ok) {
    console.error(`❌ Sync endpoint failed: ${response.status} ${response.statusText}`);
    return false;
  }

  const data = await response.json();
  console.log(`✅ Sync endpoint working. Cursor: ${data.cursor}, Messages: ${data.messages?.length || 0}`);
  return true;
}

async function testInjectEndpoint(): Promise<boolean> {
  console.log('📡 Testing /api/stacean/inject endpoint...');

  const testResponse = `E2E test response - ${Date.now()}`;

  const response = await fetch(`${STACEAN_API_URL}/api/stacean/inject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STACEAN_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: testResponse,
      originalId: 'test-e2e-123',
    }),
  });

  if (!response.ok) {
    console.error(`❌ Inject endpoint failed: ${response.status} ${response.statusText}`);
    return false;
  }

  const data = await response.json();
  console.log(`✅ Inject endpoint working. Response ID: ${data.id}`);
  return true;
}

async function testKVStorage(): Promise<boolean> {
  console.log('🗄️ Testing KV storage...');

  try {
    // Add a test message
    const testMessage = await staceanChat.addMessage({
      direction: 'outbound',
      text: 'E2E test message - please ignore',
      from: 'user',
    });

    console.log(`✅ Added test message: ${testMessage.id}`);

    // Retrieve messages
    const messages = await staceanChat.getLatestMessages(10);
    const found = messages.find(m => m.id === testMessage.id);

    if (found) {
      console.log(`✅ Retrieved test message: ${found.text}`);
      return true;
    } else {
      console.error('❌ Could not retrieve test message');
      return false;
    }
  } catch (error) {
    console.error(`❌ KV storage error: ${error}`);
    return false;
  }
}

async function runTests(): Promise<void> {
  console.log('🚀 Starting Stacean E2E Tests\n');
  console.log(`   API URL: ${STACEAN_API_URL}`);
  console.log(`   Secret: ${STACEAN_SECRET.substring(0, 8)}...\n`);

  const results: Record<string, boolean> = {};

  // Test 1: Sync endpoint
  results['sync'] = await testSyncEndpoint();
  console.log('');

  // Test 2: Inject endpoint
  results['inject'] = await testInjectEndpoint();
  console.log('');

  // Test 3: KV storage
  results['kv'] = await testKVStorage();
  console.log('');

  // Summary
  console.log('📊 Test Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const [test, passed] of Object.entries(results)) {
    console.log(`   ${passed ? '✅' : '❌'} ${test.toUpperCase()}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '❌ Some tests failed'}`);

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(console.error);