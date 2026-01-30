/**
 * Vercel KV Integration for Command Center
 * Replaces local state.json with real-time Redis-backed state
 */

import { kv } from '@vercel/kv';

export interface CommandCenterState {
  // Atlas Status
  atlasOnline: boolean;
  lastHeartbeat: string;
  currentActivity: string;
  
  // Widget States
  activeWidget: string;
  pulseIntensity: number;
  
  // System Metrics
  cpuLoad: number;
  memoryUsage: number;
  
  // Session Data
  sessionCount: number;
  lastSessionAt: string;
  
  // UI State
  theme: 'warm-industrial' | 'deep-zinc' | 'light-mode';
  dockPosition: number;
  
  // KV Connection Status (internal)
  _connected?: boolean;
}

export const DEFAULT_STATE: CommandCenterState = {
  atlasOnline: true,
  lastHeartbeat: new Date().toISOString(),
  currentActivity: 'Initializing',
  activeWidget: 'pulse',
  pulseIntensity: 1.0,
  cpuLoad: 0,
  memoryUsage: 0,
  sessionCount: 0,
  lastSessionAt: new Date().toISOString(),
  theme: 'warm-industrial',
  dockPosition: 0,
  _connected: false,
};

// KV key prefix for the blog project
const KV_KEYS = {
  STATE: 'command-center:state',
  SESSIONS: 'command-center:sessions',
  LEDGER: 'command-center:ledger',
  METRICS: 'command-center:metrics',
};

/**
 * Get current state from KV
 */
export async function getState(): Promise<CommandCenterState> {
  try {
    const state = await kv.get<Partial<CommandCenterState>>(KV_KEYS.STATE);
    if (state) {
      // Always merge with DEFAULT_STATE to ensure all fields exist
      return { ...DEFAULT_STATE, ...state, _connected: true };
    }
    return { ...DEFAULT_STATE, _connected: true };
  } catch (error) {
    console.error('KV getState error:', error);
    return DEFAULT_STATE;
  }
}

/**
 * Save state to KV
 */
export async function saveState(state: Partial<CommandCenterState>): Promise<void> {
  try {
    const current = await getState();
    // Always merge with DEFAULT_STATE to preserve all fields
    await kv.set(KV_KEYS.STATE, { ...DEFAULT_STATE, ...current, ...state });
  } catch (error) {
    console.error('KV saveState error:', error);
  }
}

/**
 * Increment session counter
 */
export async function incrementSession(): Promise<number> {
  try {
    const newCount = await kv.incr(KV_KEYS.SESSIONS);
    // Also update sessionCount in state for consistency
    await kv.set(KV_KEYS.STATE, { sessionCount: newCount });
    return newCount;
  } catch (error) {
    console.error('KV incr error:', error);
    return 0;
  }
}

/**
 * Record a ledger entry
 */
export async function addLedgerEntry(entry: {
  type: 'pulse' | 'session' | 'widget' | 'system';
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const entryWithTimestamp = {
      ...entry,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };
    
    // Store in sorted set with timestamp as score
    await kv.zadd(KV_KEYS.LEDGER, {
      score: Date.now(),
      member: JSON.stringify(entryWithTimestamp),
    });
    
    // Keep only last 100 entries (delete oldest by rank)
    const entries = await kv.zrange(KV_KEYS.LEDGER, 0, -1);
    if (entries.length > 100) {
      await kv.zremrangebyrank(KV_KEYS.LEDGER, 0, entries.length - 101);
    }
  } catch (error) {
    console.error('KV ledger error:', error);
  }
}

/**
 * Get ledger entries
 */
export async function getLedgerEntries(limit = 20): Promise<unknown[]> {
  try {
    const entries = await kv.zrange(KV_KEYS.LEDGER, -limit, -1);
    return entries.map(e => {
      // Handle both string and already-parsed object returns from @vercel/kv
      if (typeof e === 'string') {
        try {
          return JSON.parse(e);
        } catch {
          return { message: e };
        }
      }
      return e;
    }).reverse();
  } catch (error) {
    console.error('KV getLedger error:', error);
    return [];
  }
}

/**
 * Update heartbeat
 */
export async function heartbeat(activity: string): Promise<void> {
  await saveState({
    atlasOnline: true,
    lastHeartbeat: new Date().toISOString(),
    currentActivity: activity,
  });
}