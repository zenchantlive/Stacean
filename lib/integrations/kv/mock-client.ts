// In-memory KV Mock for local development/testing without credentials

export class MockKV {
  private store = new Map<string, string>();

  async get<T>(key: string): Promise<T | null> {
    const val = this.store.get(key);
    if (!val) return null;

    // If T expects string, return raw value
    // Otherwise try JSON.parse for objects/arrays
    try {
      const parsed = JSON.parse(val);
      
      // If parse succeeds but T expects string, return raw
      // (HACK: check if val is wrapped in quotes = string in JSON)
      if (typeof parsed !== 'object' && !val.startsWith('{') && !val.startsWith('[')) {
        return val as T;
      }
      
      return parsed as T;
    } catch {
      // Not JSON or invalid, return raw
      return val as unknown as T;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    // Store as JSON if object/array, otherwise as string
    const storedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    this.store.set(key, storedValue);
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const val = parseInt(this.store.get(key) || '0', 10);
    const newVal = val + 1;
    this.store.set(key, newVal.toString());
    return newVal;
  }

  async decr(key: string): Promise<number> {
    const val = parseInt(this.store.get(key) || '0', 10);
    const newVal = val - 1;
    this.store.set(key, newVal.toString());
    return newVal;
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple prefix matching for "prefix:*"
    const prefix = pattern.replace('*', '');
    return Array.from(this.store.keys()).filter(k => k.startsWith(prefix));
  }

  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(k => this.get<T>(k)));
  }

  // Sorted Set Implementation
  // Key -> Array<{score: number, member: string}> sorted by score (ascending)
  private zstore = new Map<string, Array<{ score: number; member: string }>>();

  async zadd(key: string, item: { score: number; member: string }): Promise<number> {
    const list = [...(this.zstore.get(key) || [])];
    
    // Remove existing member if any
    const existingIdx = list.findIndex(i => i.member === item.member);
    if (existingIdx >= 0) {
      list.splice(existingIdx, 1);
    }

    list.push(item);
    list.sort((a, b) => a.score - b.score);
    
    this.zstore.set(key, list);
    return 1;
  }

  async zrange(
    key: string,
    start: number | string,
    stop: number | string,
    opts?: { byScore?: boolean; rev?: boolean; offset?: number; count?: number }
  ): Promise<string[]> {
    let list = [...(this.zstore.get(key) || [])];
    const len = list.length;
    if (len === 0) return [];

    if (opts?.byScore) {
      // Handle numeric bounds for byScore
      const min = start === '-inf' ? -Infinity : Number(start);
      const max = stop === '+inf' ? Infinity : Number(stop);
      list = list.filter(item => item.score >= min && item.score <= max);
    }

    if (opts?.rev) {
      list.reverse();
    }

    if (!opts?.byScore) {
      // Handle rank-based slicing (Redis 0-based indices)
      let s = typeof start === 'number' ? (start >= 0 ? start : len + start) : 0;
      let e = typeof stop === 'number' ? (stop >= 0 ? stop : len + stop) : len - 1;
      
      s = Math.max(0, s);
      e = Math.min(len - 1, e);
      
      if (s > e) return [];
      list = list.slice(s, e + 1);
    }

    if (opts?.offset !== undefined || opts?.count !== undefined) {
      const offset = opts.offset || 0;
      const count = opts.count || list.length;
      list = list.slice(offset, offset + count);
    }
    
    return list.map(i => i.member);
  }

  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    const list = this.zstore.get(key);
    if (!list || list.length === 0) return 0;

    const len = list.length;
    let s = start >= 0 ? start : Math.max(0, len + start);
    let e = stop >= 0 ? stop : Math.max(0, len + stop);

    s = Math.max(0, s);
    e = Math.min(len - 1, e);

    if (s > e) return 0;

    const removed = list.splice(s, e - s + 1);
    this.zstore.set(key, list);
    return removed.length;
  }

  async zcard(key: string): Promise<number> {
    return (this.zstore.get(key) || []).length;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}

const globalForMock = global as unknown as { mockKv: MockKV };

export const mockKv = globalForMock.mockKv || new MockKV();

if (process.env.NODE_ENV !== 'production') {
  globalForMock.mockKv = mockKv;
}
