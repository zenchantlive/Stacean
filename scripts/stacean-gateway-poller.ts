#!/usr/bin/env tsx
/**
 * Stacean Gateway Polling Script
 *
 * Polls /api/stacean/sync for outbound messages (User → Agent),
 * forwards them to OpenClaw agent session, and posts responses back
 * via /api/stacean/inject.
 *
 * Usage: npx tsx scripts/stacean-gateway-poller.ts
 */

import { spawn } from 'child_process';
import * as readline from 'readline';

// Configuration
const STACEAN_API_URL = process.env.STACEAN_API_URL || 'http://localhost:3000';
const STACEAN_SECRET = process.env.STACEAN_SECRET || 'stacean-dev-secret-123';
const POLL_INTERVAL_MS = 2000; // 2 seconds
const OPENCLAW_SESSION = 'main';

// State
let lastCursor: string | null = null;

/**
 * Poll /api/stacean/sync for new messages
 */
async function pollSync(): Promise<{ cursor: string | null; messages: any[] }> {
  const url = new URL(`${STACEAN_API_URL}/api/stacean/sync`);
  if (lastCursor) {
    url.searchParams.set('since', lastCursor);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${STACEAN_SECRET}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.error('❌ Unauthorized - check STACEAN_SECRET');
    } else {
      console.error(`❌ Sync error: ${response.status} ${response.statusText}`);
    }
    return { cursor: lastCursor, messages: [] };
  }

  const data = await response.json();
  return {
    cursor: data.cursor || lastCursor,
    messages: data.messages || [],
  };
}

/**
 * Forward message to OpenClaw agent session via sessions_send
 */
async function forwardToOpenClaw(message: any): Promise<boolean> {
  // Use the sessions_send tool to inject the message into OpenClaw
  const payload = JSON.stringify({
    channel: 'stacean',
    direction: 'outbound',
    text: message.text,
    from: message.from,
    originalId: message.id,
    timestamp: message.createdAt,
  });

  return new Promise((resolve) => {
    const proc = spawn('npx', [
      'openclaw',
      'message',
      'send',
      '--session', OPENCLAW_SESSION,
      '--text', payload,
    ], {
      cwd: '/home/clawdbot/clawd',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Forwarded message ${message.id} to OpenClaw`);
        resolve(true);
      } else {
        console.error(`❌ Failed to forward message ${message.id}: ${stderr}`);
        resolve(false);
      }
    });
  });
}

/**
 * Post response back to Stacean via /api/stacean/inject
 */
async function injectResponse(text: string, originalId?: string): Promise<boolean> {
  const response = await fetch(`${STACEAN_API_URL}/api/stacean/inject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STACEAN_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      originalId, // Optional: link to original message
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    console.error(`❌ Inject error: ${response.status} ${response.statusText}`);
    return false;
  }

  const data = await response.json();
  console.log(`✅ Injected response: ${data.id}`);
  return true;
}

/**
 * Main polling loop
 */
async function runPoller() {
  console.log('🚀 Stacean Gateway Poller starting...');
  console.log(`   API URL: ${STACEAN_API_URL}`);
  console.log(`   Poll Interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`   OpenClaw Session: ${OPENCLAW_SESSION}`);
  console.log('');

  let cycleCount = 0;

  while (true) {
    try {
      cycleCount++;
      const { cursor, messages } = await pollSync();

      if (cursor && cursor !== lastCursor) {
        lastCursor = cursor;
      }

      if (messages.length > 0) {
        console.log(`\n📬 Cycle ${cycleCount}: Found ${messages.length} new message(s)`);

        for (const msg of messages) {
          console.log(`   Processing: ${msg.id} | ${msg.text.substring(0, 50)}...`);

          // Forward to OpenClaw
          const forwarded = await forwardToOpenClaw(msg);

          if (forwarded) {
            // For now, we'll inject a placeholder response
            // In the full implementation, we'd wait for the agent response
            await injectResponse(
              `[ECHO] Received: "${msg.text}" - Agent response coming soon!`,
              msg.id
            );
          }
        }
      } else if (cycleCount % 10 === 0) {
        // Periodic heartbeat log
        process.stdout.write('.');
      }
    } catch (error) {
      console.error(`\n❌ Poll cycle error: ${error}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down poller...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down poller...');
  process.exit(0);
});

// Start the poller
runPoller().catch(console.error);