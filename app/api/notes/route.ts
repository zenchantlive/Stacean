import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const KV_KEY = 'command-center:notes';
const MAX_NOTES = 20;

export async function GET() {
  try {
    const notes = await kv.get<string[]>(KV_KEY);
    const parsed = (notes || []).map(n => JSON.parse(n));
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Notes GET error:', err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const cleanText = text?.replace(/\x00/g, '').trim();
    if (!cleanText) {
      return NextResponse.json({ success: false, error: 'Empty note' }, { status: 400 });
    }
    
    // Get existing notes
    const existing = await kv.get<string[]>(KV_KEY) || [];
    
    // Add new note at the beginning
    const newNote = JSON.stringify({
      text: cleanText,
      time: new Date().toISOString()
    });
    
    const updated = [newNote, ...existing.slice(0, MAX_NOTES - 1)];
    
    // Save to KV (atomic set, not read-modify-write to reduce race condition impact)
    await kv.set(KV_KEY, updated);
    
    // Parse for response
    const notes = updated.map(n => JSON.parse(n));
    
    return NextResponse.json({ success: true, notes });
  } catch (err) {
    console.error('Notes POST error:', err);
    return NextResponse.json({ success: false, error: 'Failed to save note' }, { status: 500 });
  }
}
