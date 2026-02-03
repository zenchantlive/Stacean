import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getMessages, POST as postMessages } from '../app/api/stacean/messages/route';
import { GET as getSync } from '../app/api/stacean/sync/route';
import { POST as postInject } from '../app/api/stacean/inject/route';

const SECRET = 'stacean-dev-secret-123';

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init));
}

describe('Stacean API routes', () => {
  it('creates outbound message via /messages and returns it', async () => {
    const req = makeRequest('http://localhost/api/stacean/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello from test' }),
    });
    const res = await postMessages(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.text).toBe('Hello from test');
    expect(data.direction).toBe('outbound');
  });

  it('rejects sync without auth', async () => {
    const req = makeRequest('http://localhost/api/stacean/sync');
    const res = await getSync(req);
    expect(res.status).toBe(401);
  });

  it('returns outbound messages for sync with auth', async () => {
    const sendReq = makeRequest('http://localhost/api/stacean/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Outbound for sync' }),
    });
    await postMessages(sendReq);

    const syncReq = makeRequest('http://localhost/api/stacean/sync', {
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    const res = await getSync(syncReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.messages)).toBe(true);
    expect(data.messages.some((m: { text: string }) => m.text === 'Outbound for sync')).toBe(true);
  });

  it('injects inbound message with auth', async () => {
    const req = makeRequest('http://localhost/api/stacean/inject', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Inbound test' }),
    });
    const res = await postInject(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('lists messages via /messages GET', async () => {
    const req = makeRequest('http://localhost/api/stacean/messages?limit=10');
    const res = await getMessages(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
