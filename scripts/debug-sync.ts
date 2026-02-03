#!/usr/bin/env tsx
/**
 * Debug script to check sync behavior
 */

import { staceanChat } from '../lib/integrations/kv/chat';

async function debugSync() {
  console.log('🔍 Debugging sync behavior...\n');

  // Get latest messages
  const latest = await staceanChat.getLatestMessages(10);
  console.log('Latest 10 messages:');
  latest.forEach((m, i) => {
    console.log(`  ${i}. [${m.direction}] ${m.id.substring(0, 8)}: "${m.text.substring(0, 30)}..."`);
  });

  // Test getMessages with no since
  const all = await staceanChat.getMessages();
  console.log(`\ngetMessages() returned ${all.length} messages`);

  // Test getMessages with since
  if (latest.length > 1) {
    const sinceId = latest[0].id;
    const after = await staceanChat.getMessages(sinceId);
    console.log(`getMessages("${sinceId.substring(0, 8)}...") returned ${after.length} messages`);
  }

  // Check if messages have correct direction
  const outbound = all.filter(m => m.direction === 'outbound');
  const inbound = all.filter(m => m.direction === 'inbound');
  console.log(`\nOutbound: ${outbound.length}, Inbound: ${inbound.length}`);
}

debugSync().catch(console.error);