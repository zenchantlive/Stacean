import { NextResponse } from 'next/server';
import { staceanChat } from '@/lib/integrations/kv/chat';

/**
 * GET /api/stacean/sync
 * Gateway polls this to get new messages from User to Agent
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since') || undefined;
  const secret = request.headers.get('Authorization')?.replace('Bearer ', '');

  // Auth check
  if (secret !== process.env.STACEAN_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allMessages = await staceanChat.getMessages(since);
    
    // Gateway only cares about 'outbound' (User -> Agent) messages for sync
    // But we might want to send everything to keep history in sync if needed.
    // However, the PRD says sync retrieves "pending messages from the User to the Agent".
    const userMessages = allMessages.filter(m => m.direction === 'outbound');

    return NextResponse.json({
      cursor: allMessages.length > 0 ? allMessages[allMessages.length - 1].id : since,
      messages: userMessages.map(m => ({
        id: m.id,
        from: 'user',
        text: m.text,
        createdAt: m.createdAt,
        media: m.media || []
      }))
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/stacean/sync
 * Gateway calls this to push Agent -> User messages (Inject)
 */
export async function POST(request: Request) {
  const secret = request.headers.get('Authorization')?.replace('Bearer ', '');

  // Auth check
  if (secret !== process.env.STACEAN_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { text, media } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const message = await staceanChat.addMessage({
      direction: 'inbound', // Agent -> User
      text,
      from: 'agent',
      media: media || []
    });

    return NextResponse.json({
      success: true,
      id: message.id
    });
  } catch (error) {
    console.error('Injection error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
