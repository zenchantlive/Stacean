import { NextRequest, NextResponse } from 'next/server';
import { staceanChat, ChatMessage } from '@/lib/integrations/kv/chat';

const STACEAN_SECRET = process.env.STACEAN_SECRET || 'stacean-dev-secret-123';

/**
 * GET /api/stacean/sync
 * Used by the Gateway to pull pending messages from User -> Agent.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${STACEAN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since');

    // Fetch recent history and apply since filtering here for dev/mock compatibility
    const recentMessages = await staceanChat.getLatestMessages(200);
    let allMessages = recentMessages;

    if (since) {
      const sinceIndex = recentMessages.findIndex(m => m.id === since);
      if (sinceIndex >= 0) {
        allMessages = recentMessages.slice(sinceIndex + 1);
      } else {
        const sinceTs = Date.parse(since);
        if (!isNaN(sinceTs)) {
          allMessages = recentMessages.filter(m => Date.parse(m.createdAt) > sinceTs);
        }
      }
    }

    // Filter only outbound (User -> Agent) messages for the gateway to process
    const outboundMessages = allMessages.filter(m => m.direction === 'outbound');

    const lastMsg = recentMessages[recentMessages.length - 1];

    return NextResponse.json({
      cursor: lastMsg ? lastMsg.id : since,
      messages: outboundMessages,
    });
  } catch (error) {
    console.error('Sync GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
