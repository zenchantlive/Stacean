import { NextRequest, NextResponse } from 'next/server';
import { staceanChat } from '@/lib/integrations/kv/chat';

/**
 * GET /api/stacean/messages
 * Used by the UI to fetch the message history.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const messages = await staceanChat.getLatestMessages(limit);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/stacean/messages
 * Used by the UI to send a message (User -> Agent).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const message = await staceanChat.addMessage({
      direction: 'outbound',
      text,
      from: 'user',
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
