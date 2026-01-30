/**
 * KV Storage Adapter
 * Reusable abstraction layer for Vercel KV/Upstash Redis
 * 
 * Supports:
 * - Simple key-value storage
 * - Sorted sets (for ordered data like ledgers, lists)
 * - Counters (increment/decrement)
 * - Type-safe operations
 * 
 * Usage:
 *   import { KVAdapter } from './kv/adapter';
 *   const notes = new KVAdapter('command-center:notes');
 *   const notes = await notes.getList();
 */

import { kv as realKv } from '@vercel/kv';
import { mockKv } from './mock-client';

// Define the interface subset we use from VercelKV to satisfy both Real and Mock
interface KVClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number; nx?: boolean }): Promise<void | string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  mget<T>(...keys: string[]): Promise<(T | null)[]>;
  zadd(key: string, member: { score: number; member: string }): Promise<number | string>; // Vercel returns number | string
  zrange(key: string, start: number, stop: number): Promise<string[]>; // Simple string[] return for our usage
  zremrangebyrank(key: string, start: number, stop: number): Promise<number>;
  zcard(key: string): Promise<number>;
  ping(): Promise<string>;
}

const useMock = !process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN;
if (useMock) {
  console.warn('⚠️ KV Adapter running in MOCK mode (No credentials found)');
}

// Cast both to the compatible interface
const kv: KVClient = useMock ? (mockKv as unknown as KVClient) : (realKv as unknown as KVClient);

// Export kv for use in subclasses
export { kv };

// ============================================================================
// Types
// ============================================================================

export interface KVConfig {
  /** Key prefix for all operations (e.g., 'command-center' or 'app:tasks') */
  prefix: string;
  /** Default TTL in seconds (0 = no expiration) */
  defaultTTL?: number;
}

export interface ListItem {
  /** Unique ID for the item */
  id: string;
  /** Item data */
  [key: string]: unknown;
}

export interface PaginationOptions {
  /** Maximum items to return */
  limit?: number;
  /** Skip first N items */
  offset?: number;
}

// ============================================================================
// Adapter Class
// ============================================================================

export class KVAdapter {
  private prefix: string;
  private defaultTTL: number;

  constructor(config: KVConfig) {
    this.prefix = config.prefix;
    this.defaultTTL = config.defaultTTL || 0;
  }

  // --------------------------------------------------------------------------
  // Key Generation
  // --------------------------------------------------------------------------

  /** Generate a full key with prefix */
  protected key(suffix: string): string {
    return `${this.prefix}:${suffix}`;
  }

  /** Get the base prefix */
  getPrefix(): string {
    return this.prefix;
  }

  // --------------------------------------------------------------------------
  // Basic Operations (Key-Value)
  // --------------------------------------------------------------------------

  /**
   * Get a value by key
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      return await kv.get<T>(this.key(key));
    } catch (error) {
      console.error(`KV get(${key}) error:`, error);
      return null;
    }
  }

  /**
   * Set a value by key
   */
  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      if (ttl || this.defaultTTL > 0) {
        await kv.set(this.key(key), value, { ex: ttl || this.defaultTTL });
      } else {
        await kv.set(this.key(key), value);
      }
      return true;
    } catch (error) {
      console.error(`KV set(${key}) error:`, error);
      return false;
    }
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<boolean> {
    try {
      await kv.del(this.key(key));
      return true;
    } catch (error) {
      console.error(`KV delete(${key}) error:`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      return (await kv.get(this.key(key))) !== null;
    } catch (error) {
      console.error(`KV exists(${key}) error:`, error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Counter Operations
  // --------------------------------------------------------------------------

  /**
   * Increment a counter, returns new value
   */
  async incr(key: string): Promise<number> {
    try {
      return await kv.incr(this.key(key));
    } catch (error) {
      console.error(`KV incr(${key}) error:`, error);
      return 0;
    }
  }

  /**
   * Decrement a counter, returns new value
   */
  async decr(key: string): Promise<number> {
    try {
      return await kv.decr(this.key(key));
    } catch (error) {
      console.error(`KV decr(${key}) error:`, error);
      return 0;
    }
  }

  // --------------------------------------------------------------------------
  // List Operations (JSON Array in Single Key)
  // --------------------------------------------------------------------------

  /**
   * Get a list of items (stored as JSON array)
   */
  async getList<T extends ListItem>(
    key: string,
    options: PaginationOptions = {}
  ): Promise<T[]> {
    try {
      const { limit = 100, offset = 0 } = options;
      const raw = await kv.get<string[]>(this.key(key));
      if (!raw) return [];
      
      const items = raw.map(item => JSON.parse(item) as T);
      return items.slice(offset, offset + limit);
    } catch (error) {
      console.error(`KV getList(${key}) error:`, error);
      return [];
    }
  }

  /**
   * Add item to list (prepend, maintains max size)
   */
  async addToList<T extends ListItem>(
    key: string,
    item: T,
    maxSize: number = 100
  ): Promise<boolean> {
    try {
      const raw = await kv.get<string[]>(this.key(key)) || [];
      const newItem = JSON.stringify(item);
      const updated = [newItem, ...raw.slice(0, maxSize - 1)];
      await kv.set(this.key(key), updated);
      return true;
    } catch (error) {
      console.error(`KV addToList(${key}) error:`, error);
      return false;
    }
  }

  /**
   * Remove item from list by ID
   */
  async removeFromList(key: string, id: string): Promise<boolean> {
    try {
      const raw = await kv.get<string[]>(this.key(key));
      if (!raw) return false;
      
      const filtered = raw.filter(item => {
        const parsed = JSON.parse(item) as ListItem;
        return parsed.id !== id;
      });
      
      await kv.set(this.key(key), filtered);
      return true;
    } catch (error) {
      console.error(`KV removeFromList(${key}) error:`, error);
      return false;
    }
  }

  /**
   * Get single item from list by ID
   */
  async getListItem<T extends ListItem>(key: string, id: string): Promise<T | null> {
    try {
      const raw = await kv.get<string[]>(this.key(key));
      if (!raw) return null;
      
      for (const item of raw) {
        const parsed = JSON.parse(item) as T;
        if (parsed.id === id) return parsed;
      }
      return null;
    } catch (error) {
      console.error(`KV getListItem(${key}, ${id}) error:`, error);
      return null;
    }
  }

  /**
   * Clear entire list
   */
  async clearList(key: string): Promise<boolean> {
    return this.delete(key);
  }

  /**
   * Get list length
   */
  async listLength(key: string): Promise<number> {
    try {
      const raw = await kv.get<string[]>(this.key(key));
      return raw?.length || 0;
    } catch (error) {
      console.error(`KV listLength(${key}) error:`, error);
      return 0;
    }
  }

  // --------------------------------------------------------------------------
  // Sorted Set Operations (Timestamp-ordered data)
  // --------------------------------------------------------------------------

  /**
   * Get sorted set items (by score/timestamp)
   */
  async getSortedSet(
    key: string,
    limit: number = 20
  ): Promise<ListItem[]> {
    try {
      const raw = await kv.zrange(this.key(key), -limit, -1);
      return raw.map(item => {
        if (typeof item === 'string') {
          try {
            return JSON.parse(item) as ListItem;
          } catch {
            return { id: '', message: item } as ListItem;
          }
        }
        return item as ListItem;
      }).reverse();
    } catch (error) {
      console.error(`KV getSortedSet(${key}) error:`, error);
      return [];
    }
  }

  /**
   * Add to sorted set (score = timestamp for ordering)
   */
  async addToSortedSet(
    key: string,
    item: ListItem,
    score?: number
  ): Promise<boolean> {
    try {
      const entry = { ...item, timestamp: item.timestamp || new Date().toISOString() };
      await kv.zadd(this.key(key), {
        score: score || Date.now(),
        member: JSON.stringify(entry),
      });
      
      // Trim to last 100 items
      const all = await kv.zrange(this.key(key), 0, -1);
      if (all.length > 100) {
        await kv.zremrangebyrank(this.key(key), 0, all.length - 101);
      }
      
      return true;
    } catch (error) {
      console.error(`KV addToSortedSet(${key}) error:`, error);
      return false;
    }
  }

  /**
   * Get sorted set length
   */
  async sortedSetLength(key: string): Promise<number> {
    try {
      return await kv.zcard(this.key(key));
    } catch (error) {
      console.error(`KV sortedSetLength(${key}) error:`, error);
      return 0;
    }
  }

  // --------------------------------------------------------------------------
  // Utility
  // --------------------------------------------------------------------------

  /**
   * Health check - verify KV connection
   */
  async ping(): Promise<boolean> {
    try {
      const result = await kv.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Get adapter for specific sub-key
   * Useful for nested structures
   */
  subAdapter(suffix: string): KVAdapter {
    return new KVAdapter({
      prefix: this.key(suffix),
      defaultTTL: this.defaultTTL,
    });
  }
}

// ============================================================================
// Pre-configured Adapters
// ============================================================================

/** Blog Command Center adapter */
export const blogNotes = new KVAdapter({
  prefix: 'command-center:notes',
  defaultTTL: 0, // No expiration
});

/** Blog Ledger adapter (sorted set) */
export const blogLedger = new KVAdapter({
  prefix: 'command-center:ledger',
  defaultTTL: 0,
});

/** Blog State adapter */
export const blogState = new KVAdapter({
  prefix: 'command-center:state',
  defaultTTL: 0,
});

/** Blog Sessions adapter (counter) */
export const blogSessions = new KVAdapter({
  prefix: 'command-center:sessions',
  defaultTTL: 0,
});

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new KV adapter with custom prefix
 */
export function createKVAdapter(prefix: string, defaultTTL?: number): KVAdapter {
  return new KVAdapter({ prefix, defaultTTL });
}

