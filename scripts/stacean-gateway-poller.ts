#!/usr/bin/env tsx
/**
 * Stacean Gateway Polling Script
 *
 * Polls /api/stacean/sync for outbound messages (User → Agent),
 * forwards them to OpenClaw Gateway via HTTP API, and posts responses
 * back via /api/stacean/inject.
 *
 * Usage:
 *   npx tsx scripts/stacean-gateway-poller.ts
 *
 * Environment Variables:
 *   STACEAN_API_URL   - Stacean app URL (default: http://localhost:3002)
 *   STACEAN_SECRET    - Secret for Stacean API auth
 *   OPENCLAW_URL      - OpenClaw Gateway URL (default: http://localhost:18789)
 *   OPENCLAW_TOKEN    - OpenClaw Gateway auth token
 *   POLL_INTERVAL_MS  - Poll interval in ms (default: 2000)
 */

import { randomUUID } from 'crypto';

// Configuration from environment
const STACEAN_API_URL = process.env.STACEAN_API_URL || 'http://localhost:3002';
const STACEAN_SECRET = process.env.STACEAN_SECRET || 'stacean-dev-secret-123';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '2000', 10);

// OpenClaw Gateway configuration
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

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

  try {
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
  } catch (error) {
    console.error(`❌ Sync fetch error: ${error}`);
    return { cursor: lastCursor, messages: [] };
  }
}

/**
 * Forward message to OpenClaw Gateway via HTTP API
 * POST /api/message with JSON body containing text and channel
 */
async function forwardToOpenClaw(message: any): Promise<boolean> {
  const payload = {
    channel: 'stacean',
    direction: 'outbound',
    text: message.text,
    from: message.from,
    originalId: message.id,
    timestamp: message.createdAt,
  };

  try {
    const response = await fetch(`${OPENCLAW_URL}/api/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OPENCLAW_TOKEN && { 'Authorization': `Bearer ${OPENCLAW_TOKEN}` }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ OpenClaw API error: ${response.status} ${error}`);
      return false;
    }

    console.log(`✅ Forwarded message ${message.id} to OpenClaw`);
    return true;
  } catch (error) {
    console.error(`❌ OpenClaw fetch error: ${error}`);
    return false;
  }
}

/**
 * Post response back to Stacean via /api/stacean/inject
 */
async function injectResponse(text: string, originalId?: string): Promise<boolean> {
  try {
    const response = await fetch(`${STACEAN_API_URL}/api/stacean/inject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STACEAN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        originalId,
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
  } catch (error) {
    console.error(`❌ Inject fetch error: ${error}`);
    return false;
  }
}

/**
 * Main polling loop
 */
async function runPoller() {
  console.log('🚀 Stacean Gateway Poller starting...');
  console.log(`   Stacean URL: ${STACEAN_API_URL}`);
  console.log(`   OpenClaw URL: ${OPENCLAW_URL}`);
  console.log(`   Poll Interval: ${POLL_INTERVAL_MS}ms`);
  console.log('');

  let cycleCount = 0;
  let lastActivity = Date.now();

  while (true) {
    try {
      cycleCount++;
      const { cursor, messages } = await pollSync();

      if (cursor && cursor !== lastCursor) {
        lastCursor = cursor;
      }

      if (messages.length > 0) {
        lastActivity = Date.now();
        console.log(`\n📬 Cycle ${cycleCount}: Found ${messages.length} new message(s)`);

        for (const msg of messages) {
          console.log(`   Processing: ${msg.id} | ${msg.text.substring(0, 50)}...`);

          // Forward to OpenClaw
          const forwarded = await forwardToOpenClaw(msg);

          if (forwarded) {
            // For now, inject a placeholder response
            // In the full implementation, we'd wait for the agent response
            await injectResponse(
              `[ECHO] Received: "${msg.text.substring(0, 100)}" - Agent response coming soon!`,
              msg.id
            );
          }
        }
      } else if (cycleCount % 10 === 0) {
        // Periodic heartbeat log
        const idleSeconds = Math.floor((Date.now() - lastActivity) / 1000);
        process.stdout.write(`. (idle: ${idleSeconds}s)`);
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