/**
 * Ledger API Route - KV-backed activity feed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLedgerEntries, addLedgerEntry } from '@/lib/vercel-kv';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const entries = await getLedgerEntries(limit);
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ entries: [], error: 'Failed to fetch ledger' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await addLedgerEntry({
      type: body.type || 'system',
      message: body.message,
      metadata: body.metadata,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add entry' }, { status: 500 });
  }
}