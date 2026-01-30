/**
 * Agent Session Adapter
 * Manages agent sessions with code names (Neon-Hawk, Solar-Bear, etc.)
 *
 * KV Structure:
 * - `agent:session:active` → Sorted set of agent IDs (score = heartbeat)
 * - `agent:session:{id}` → Session data (heartbeat, current action, status)
 * - `agent:session:code:{name}` → Code name mapping (for reverse lookup)
 */

import { KVAdapter, kv } from './adapter';
import { generateCodeName } from '../../utils/code-names';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type AgentStatus = 'idle' | 'working' | 'error' | 'done';

export interface AgentContext {
  currentTaskId?: string;
  spawnedBy?: string;
  logs: string[];
}

export interface AgentSession {
  id: string;
  codeName: string;
  initials: string;
  currentTaskId?: string;
  status: AgentStatus;
  currentAction?: string;
  context: AgentContext;
  heartbeat: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateAgentInput {
  id?: string;
  codeName?: string;
  initials?: string;
  spawnedBy?: string;
}

export interface UpdateAgentInput {
  status?: AgentStatus;
  currentAction?: string;
  currentTaskId?: string;
  logs?: string[];
}

// ============================================================================
// Adapter Class
// ============================================================================

export class AgentAdapter extends KVAdapter {
  constructor() {
    super({ prefix: 'agent:session' });
  }

  /**
   * Create a new agent session
   */
  async createAgent(input: CreateAgentInput): Promise<AgentSession> {
    const id = input.id || randomUUID();
    const now = Date.now();

    // Generate code name if not provided
    const codeNameData = input.codeName
      ? { name: input.codeName, initials: input.initials || extractInitials(input.codeName) }
      : generateCodeName();

    const agent: AgentSession = {
      id,
      codeName: codeNameData.name,
      initials: codeNameData.initials,
      status: 'idle',
      context: {
        spawnedBy: input.spawnedBy,
        logs: [],
      },
      heartbeat: now,
      createdAt: now,
      updatedAt: now,
    };

    // Store agent data
    await this.set(id, agent);

    // Add to active sorted set (score = heartbeat for sorting)
    await this.addToActive(id, now);

    // Store code name reverse lookup
    await this.setCodeNameLookup(id, codeNameData.name);

    return agent;
  }

  /**
   * Get an agent session by ID
   */
  async getAgent(id: string): Promise<AgentSession | null> {
    return this.get<AgentSession>(id);
  }

  /**
   * Get an agent session by code name
   */
  async getAgentByCodeName(codeName: string): Promise<AgentSession | null> {
    const id = await this.getCodeNameLookup(codeName);
    if (!id) return null;
    return this.get<AgentSession>(id);
  }

  /**
   * Update an agent session
   */
  async updateAgent(id: string, updates: UpdateAgentInput): Promise<AgentSession | null> {
    const existing = await this.getAgent(id);
    if (!existing) return null;

    const updated: AgentSession = {
      ...existing,
      ...updates,
      context: {
        ...existing.context,
        ...updates,
      },
      heartbeat: Date.now(),
      updatedAt: Date.now(),
    };

    await this.set(id, updated);

    // Update heartbeat in active set (re-sort)
    await this.updateActive(id, updated.heartbeat);

    // If status changed, log it
    if (updates.status && updates.status !== existing.status) {
      await this.addLog(id, `Status changed: ${existing.status} → ${updates.status}`);
    }

    return updated;
  }

  /**
   * Update heartbeat (for keepalive)
   */
  async heartbeat(id: string, action?: string): Promise<boolean> {
    return this.updateAgent(id, {
      currentAction: action,
    }) !== null;
  }

  /**
   * Get all active agents (sorted by heartbeat, most recent first)
   */
  async getActiveAgents(): Promise<AgentSession[]> {
    const ids = await this.getActiveIds();
    if (ids.length === 0) return [];

    // Fetch all agents in parallel
    const agents = await Promise.all(
      ids.map(id => this.get<AgentSession>(id))
    );

    // Filter out nulls and sort by heartbeat (most recent first)
    const validAgents = agents.filter(a => a !== null) as AgentSession[];
    return validAgents.sort((a, b) => b.heartbeat - a.heartbeat);
  }

  /**
   * Get agent count by status
   */
  async getStatusCounts(): Promise<Record<AgentStatus, number>> {
    const agents = await this.getActiveAgents();
    const counts: Record<AgentStatus, number> = {
      idle: 0,
      working: 0,
      error: 0,
      done: 0,
    };

    for (const agent of agents) {
      counts[agent.status]++;
    }

    return counts;
  }

  /**
   * Add log entry to agent context
   */
  async addLog(id: string, message: string): Promise<boolean> {
    const existing = await this.getAgent(id);
    if (!existing) return false;

    const logEntry = `[${new Date().toISOString()}] ${message}`;
    const logs = [...existing.context.logs.slice(-50), logEntry]; // Keep last 50 logs

    await this.updateAgent(id, { logs });
    return true;
  }

  /**
   * Remove agent from active set (keep session data)
   */
  async deactivate(id: string): Promise<boolean> {
    try {
      const activeKey = this.key('active');
      // Use zremrangebyrank to remove from sorted set
      // This requires us to find the rank first
      const ids = await this.getActiveIds();
      const index = ids.indexOf(id);

      if (index !== -1) {
        await kv.zremrangebyrank(activeKey, index, index);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to deactivate agent ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete agent session completely
   */
  async deleteAgent(id: string): Promise<boolean> {
    try {
      await this.delete(id);

      // Remove from active set
      await this.deactivate(id);

      // Remove code name lookup
      const agent = await this.getAgent(id);
      if (agent) {
        await this.removeCodeNameLookup(agent.codeName);
      }

      return true;
    } catch (error) {
      console.error(`Failed to delete agent ${id}:`, error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Get active agent IDs from Redis ZRANGE (sorted by heartbeat score)
   */
  private async getActiveIds(): Promise<string[]> {
    const activeKey = this.key('active');
    try {
      // Get all IDs, sorted by score (most recent first)
      const ids = await kv.zrange(activeKey, -100, -1);
      return (ids || []).reverse(); // Reverse to get most recent first
    } catch (error) {
      console.error('Failed to get active IDs:', error);
      return [];
    }
  }

  /**
   * Add agent ID to active sorted set
   */
  private async addToActive(id: string, timestamp: number): Promise<void> {
    const activeKey = this.key('active');
    await kv.zadd(activeKey, {
      score: timestamp,
      member: id,
    });
  }

  /**
   * Update heartbeat score in active set (re-sorts to top)
   */
  private async updateActive(id: string, timestamp: number): Promise<void> {
    const activeKey = this.key('active');
    // Remove and re-add to update score (ZADD updates if member exists)
    await kv.zadd(activeKey, {
      score: timestamp,
      member: id,
    });
  }

  /**
   * Set code name reverse lookup (agent:session:code:{name} → id)
   */
  private async setCodeNameLookup(id: string, codeName: string): Promise<void> {
    const lookupKey = this.key(`code:${codeName}`);
    await kv.set(lookupKey, id);
  }

  /**
   * Get code name reverse lookup
   */
  private async getCodeNameLookup(codeName: string): Promise<string | null> {
    const lookupKey = this.key(`code:${codeName}`);
    return await kv.get<string>(lookupKey);
  }

  /**
   * Remove code name lookup
   */
  private async removeCodeNameLookup(codeName: string): Promise<void> {
    const lookupKey = this.key(`code:${codeName}`);
    await kv.del(lookupKey);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract initials from code name (e.g., "Neon-Hawk" → "NH")
 */
function extractInitials(codeName: string): string {
  const parts = codeName.split('-');
  const adjective = parts[0];
  const animal = parts[1];

  const firstInitial = adjective.charAt(0).toUpperCase();
  const secondInitial = animal.charAt(0).toUpperCase();

  return `${firstInitial}${secondInitial}`;
}

// ============================================================================
// Export Singleton
// ============================================================================

export const agentAdapter = new AgentAdapter();
