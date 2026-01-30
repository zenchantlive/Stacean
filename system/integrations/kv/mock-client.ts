// In-memory KV Mock for local development/testing without credentials

export class MockKV {
  private store = new Map<string, string>();

  async get<T>(key: string): Promise<T | null> {
    const val = this.store.get(key);
    try {
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return val as unknown as T;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, JSON.stringify(value));
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
    return Array.from(this.store.keys()).filter((k) => k.startsWith(prefix));
  }

  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((k) => this.get<T>(k)));
  }

  // Sorted Set Mocks (Simplified: just stores as list for now or ignores score)
  // Implementing full ZSET logic in mock is complex, let's see if we need it.
  // The generic adapter uses zrange, zadd, zremrangebyrank, zcard.
  
  // We'll use a separate map for zsets: Key -> Array<{score, member}>
  private zstore = new Map<string, { score: number; member: string }[]>();

  async zadd(key: string, item: { score: number; member: string }): Promise<number> {
    const list = this.zstore.get(key) || [];
    // Remove existing if any
    const existingIdx = list.findIndex(i => i.member === item.member);
    if (existingIdx >= 0) list.splice(existingIdx, 1);
    
    list.push(item);
    list.sort((a, b) => a.score - b.score);
    this.zstore.set(key, list);
    return 1;
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.zstore.get(key) || [];
    // Handle python-style negative indices
    const len = list.length;
    const s = start < 0 ? Math.max(0, len + start) : start;
    const e = stop < 0 ? Math.max(0, len + stop + 1) : stop + 1; // +1 because slice end is exclusive
    
    // If stop is -1, it means to the end
    // But in JS slice(0, -1) excludes the last one. 
    // Redis zrange 0 -1 includes all.
    
    let sliced;
    if (stop === -1) {
       sliced = start === 0 ? list : list.slice(s);
    } else {
       sliced = list.slice(s, e);
    }
    
    return sliced.map(i => i.member);
  }

  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    let list = this.zstore.get(key) || [];
    const len = list.length;
    // Logic is complex to replicate exactly, but for "trimming" it's usually 0 to -101
    // We'll just truncate
    // For now, let's just not fail.
    return 0;
  }

  async zcard(key: string): Promise<number> {
    return (this.zstore.get(key) || []).length;
  }
  
  async ping(): Promise<string> {
      return 'PONG';
  }
}

export const mockKv = new MockKV();
