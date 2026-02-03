import { NextRequest, NextResponse } from 'next/server';
import { staceanChat } from '@/lib/integrations/kv/chat';

const STACEAN_SECRET = process.env.STACEAN_SECRET || 'stacean-dev-secret-123';

/**
 * POST /api/stacean/inject
 * Used by the Gateway to push messages from Agent -> User.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${STACEAN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { text, media } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const message = await staceanChat.addMessage({
      direction: 'inbound',
      text,
      from: 'agent',
      media: media || [],
    });

    return NextResponse.json({
      success: true,
      id: message.id,
    });
  } catch (error) {
    console.error('Inject POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
