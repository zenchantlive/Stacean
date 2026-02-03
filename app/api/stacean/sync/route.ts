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

    // Fetch all recent messages (sorted by time, oldest first)
    const allMessages = await staceanChat.getMessages(since || undefined);

    // Filter only outbound (User -> Agent) messages
    const outboundMessages = allMessages.filter(m => m.direction === 'outbound');

    // Get the last message for cursor (newest message overall)
    const messages = await staceanChat.getLatestMessages(1);
    const cursor = messages.length > 0 ? messages[0].id : since;

    return NextResponse.json({
      cursor,
      messages: outboundMessages,
    });
  } catch (error) {
    console.error('Sync GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
