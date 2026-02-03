import { describe, it, expect, vi, beforeEach } from 'vitest';
import { staceanChat } from '../chat';

// Mock the KV client since we're in a test environment
vi.mock('../adapter', () => ({
  kv: {
    zadd: vi.fn(),
    zrange: vi.fn(),
    mget: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
  },
  KVAdapter: class {
    prefix: string;
    constructor({ prefix }: { prefix: string }) { this.prefix = prefix; }
    key(suffix: string) { return `${this.prefix}:${suffix}`; }
    set(id: string, val: any) { return (this as any).kv.set(this.key(id), val); }
    get(id: string) { return (this as any).kv.get(this.key(id)); }
    getPrefix() { return this.prefix; }
  },
}));

// Setup the kv property on the prototype since the mock class doesn't have it
import { kv, KVAdapter } from '../adapter';
(KVAdapter.prototype as any).kv = kv;

describe('ChatAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a message', async () => {
    const msg = {
      direction: 'outbound' as const,
      text: 'Hello',
      from: 'user'
    };

    (kv.set as any).mockResolvedValue('OK');
    (kv.zadd as any).mockResolvedValue(1);

    const result = await staceanChat.addMessage(msg);

    expect(result.text).toBe('Hello');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(kv.set).toHaveBeenCalled();
    expect(kv.zadd).toHaveBeenCalled();
  });

  it('should get latest messages', async () => {
    (kv.zrange as any).mockResolvedValue(['id1', 'id2']);
    (kv.mget as any).mockResolvedValue([
      { id: 'id1', text: 'hi', direction: 'inbound', createdAt: new Date().toISOString() },
      { id: 'id2', text: 'hello', direction: 'outbound', createdAt: new Date().toISOString() }
    ]);

    const messages = await staceanChat.getLatestMessages(10);

    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe('id1');
    expect(messages[1].id).toBe('id2');
  });
});
