import { KVAdapter, kv } from './adapter';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type ChatDirection = 'inbound' | 'outbound';

export interface ChatMessage {
  id: string;
  direction: ChatDirection; // inbound: Agent -> User, outbound: User -> Agent
  text: string;
  from: string; // 'agent' or 'user'
  createdAt: string; // ISO string
  media?: string[];
}

// ============================================================================
// Adapter Class
// ============================================================================

export class ChatAdapter extends KVAdapter {
  constructor() {
    super({ prefix: 'stacean:chat' });
  }

  /**
   * Add a message to the chat
   */
  async addMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const message: ChatMessage = {
      ...msg,
      id,
      createdAt,
    };

    // Store the message by ID
    await this.set(id, message);

    // Add to sorted list (timeline)
    // We use a separate key for the list of message IDs
    const timelineKey = 'timeline';
    const score = new Date(createdAt).getTime();
    
    // Vercel KV uses zadd for sorted sets
    await kv.zadd(this.key(timelineKey), { score, member: id });

    return message;
  }

  /**
   * Get messages since a certain timestamp/ID
   */
  async getMessages(since?: string): Promise<ChatMessage[]> {
    const timelineKey = this.key('timeline');
    let minScore = 0;

    if (since) {
      // If 'since' is provided, we try to parse it as a timestamp
      // or find the message with that ID and get its timestamp
      const sinceMsg = await this.get<ChatMessage>(since);
      if (sinceMsg) {
        minScore = new Date(sinceMsg.createdAt).getTime() + 1; // +1 to exclude the message itself
      } else {
        // Try parsing as timestamp
        const ts = Date.parse(since);
        if (!isNaN(ts)) {
          minScore = ts + 1;
        }
      }
    }

    // Get message IDs from sorted set (chronological order, oldest first)
    // Note: Using Number.MAX_SAFE_INTEGER instead of '+inf' for compatibility
    const ids = await kv.zrange(this.key(timelineKey), minScore, Number.MAX_SAFE_INTEGER, { byScore: true }) as string[];
    
    if (!ids || ids.length === 0) return [];

    // Fetch message objects
    const keys = ids.map(id => this.key(id));
    const messages = await kv.mget<ChatMessage>(...keys);

    return messages.filter((m): m is ChatMessage => m !== null);
  }

  /**
   * Get the latest X messages
   */
  async getLatestMessages(limit: number = 50): Promise<ChatMessage[]> {
    const timelineKey = this.key('timeline');
    
    // Get latest IDs
    const ids = await kv.zrange(timelineKey, 0, -1, { rev: true, count: limit, offset: 0 }) as string[];
    
    if (!ids || ids.length === 0) return [];

    // Fetch and return in chronological order
    const keys = ids.reverse().map(id => this.key(id));
    const messages = await kv.mget<ChatMessage>(...keys);

    return messages.filter((m): m is ChatMessage => m !== null);
  }
}

// Export singleton
export const staceanChat = new ChatAdapter();
