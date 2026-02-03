import { NextResponse } from 'next/server';
import { staceanChat } from '@/lib/integrations/kv/chat';

/**
 * GET /api/stacean/messages
 * UI calls this to get chat history
 */
export async function GET() {
  try {
    const messages = await staceanChat.getLatestMessages(50);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/stacean/send
 * UI calls this to send a message from User -> Agent
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const message = await staceanChat.addMessage({
      direction: 'outbound', // User -> Agent
      text,
      from: 'user'
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
