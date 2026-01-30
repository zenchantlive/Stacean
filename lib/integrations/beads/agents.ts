/**
 * Agent Session Adapter - Beads Integration with File Locking
 * Manages agent sessions using Beads issues with type 'agent'
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { FileLock } from '../../utils/file-lock';
import { generateCodeName } from '../../utils/code-names';

const execAsync = promisify(exec);

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
  agentState?: 'idle' | 'working' | 'stuck' | 'stopped'; // Beads native states
  lastActivity?: string; // From Beads last_activity
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
// Configuration
// ============================================================================

const AGENTS_FILE = process.env.AGENTS_FILE || '/home/clawdbot/clawd/.agents.json';
const BEADS_EXEC = 'bd';
const TIMEOUT_MS = 30000;
const AGENT_LOCK = new FileLock(AGENTS_FILE);

// ============================================================================
// Storage Functions with File Locking
// ============================================================================

/**
 * Load all agents from file with lock
 */
async function loadAgentsLocked(): Promise<AgentSession[]> {
  await AGENT_LOCK.acquire();
  try {
    const fs = await import('fs/promises');
    const data = await fs.readFile(AGENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist yet
    return [];
  } finally {
    await AGENT_LOCK.release();
  }
}

/**
 * Save all agents to file with lock
 */
async function saveAgentsLocked(agents: AgentSession[]): Promise<void> {
  await AGENT_LOCK.acquire();
  try {
    const fs = await import('fs/promises');
    await fs.writeFile(AGENTS_FILE, JSON.stringify(agents, null, 2), 'utf-8');
  } finally {
    await AGENT_LOCK.release();
  }
}

/**
 * Execute `bd` command
 */
async function execBeads(args: string[]): Promise<any> {
  try {
    const { stdout, stderr } = await execAsync(
      `${BEADS_EXEC} ${args.join(' ')}`,
      {
        timeout: TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.env.BEADS_DIR || '/home/clawdbot/clawd',
      }
    );

    if (stderr && !stderr.includes('Warning:')) {
      console.warn(`Beads warning: ${stderr}`);
    }

    return JSON.parse(stdout);
  } catch (error) {
    const execError = error as Error | { message?: string };
    throw new Error(execError?.message || 'Beads error');
  }
}

// ============================================================================
// Adapter Class
// ============================================================================

export class AgentAdapter {
  /**
   * Create a new agent session
   */
  async createAgent(input: CreateAgentInput): Promise<AgentSession> {
    const id = input.id || crypto.randomUUID();
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
      agentState: 'idle', // Beads native state
      lastActivity: new Date().toISOString(),
      context: {
        spawnedBy: input.spawnedBy,
        logs: [],
      },
      heartbeat: now,
      createdAt: now,
      updatedAt: now,
    };

    // Save to file with lock
    const agents = await loadAgentsLocked();
    agents.push(agent);
    await saveAgentsLocked(agents);

    // Create Beads issue for agent (for multi-agent visibility)
    try {
      await execBeads([
        'create',
        `"Agent: ${codeNameData.name}"`,
        '--type', 'agent',
        '--label', `agent:${codeNameData.name}`,
        '--json'
      ]);
    } catch (error) {
      console.warn(`Failed to create Beads issue for agent ${codeNameData.name}:`, error);
    }

    return agent;
  }

  /**
   * Get an agent session by ID
   */
  async getAgent(id: string): Promise<AgentSession | null> {
    const agents = await loadAgentsLocked();
    return agents.find(a => a.id === id) || null;
  }

  /**
   * Get an agent session by code name
   */
  async getAgentByCodeName(codeName: string): Promise<AgentSession | null> {
    const agents = await loadAgentsLocked();
    return agents.find(a => a.codeName === codeName) || null;
  }

  /**
   * Update an agent session
   */
  async updateAgent(id: string, updates: UpdateAgentInput): Promise<AgentSession | null> {
    const agents = await loadAgentsLocked();
    const index = agents.findIndex(a => a.id === id);

    if (index === -1) return null;

    const updated: AgentSession = {
      ...agents[index],
      ...updates,
      context: {
        ...agents[index].context,
        ...updates,
      },
      heartbeat: Date.now(),
      updatedAt: Date.now(),
      lastActivity: new Date().toISOString(),
    };

    agents[index] = updated;
    await saveAgentsLocked(agents);

    // Update Beads issue for agent
    try {
      // Find Beads issue ID for this agent
      const beadsIssues = await execBeads(['list', '--json', '--label', `agent:${updated.codeName}`]);
      if (Array.isArray(beadsIssues) && beadsIssues.length > 0) {
        const beadId = beadsIssues[0].id;

        // Map agent state to Beads agent_state
        const agentStateMap: Record<AgentStatus, string> = {
          'idle': 'idle',
          'working': 'working',
          'error': 'stuck',
          'done': 'done',
        };

        await execBeads([
          'update', beadId,
          '--agent-state', agentStateMap[updated.status] || 'idle',
          '--json'
        ]);
      }
    } catch (error) {
      console.warn(`Failed to update Beads issue for agent ${updated.codeName}:`, error);
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
    const agents = await loadAgentsLocked();
    return agents.sort((a, b) => b.heartbeat - a.heartbeat);
  }

  /**
   * Get agent count by status
   */
  async getStatusCounts(): Promise<Record<AgentStatus, number>> {
    const agents = await loadAgentsLocked();
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
    const agents = await loadAgentsLocked();
    const index = agents.findIndex(a => a.id === id);

    if (index === -1) return false;

    const logEntry = `[${new Date().toISOString()}] ${message}`;
    const logs = [...agents[index].context.logs.slice(-50), logEntry]; // Keep last 50 logs

    agents[index].context.logs = logs;
    await saveAgentsLocked(agents);

    return true;
  }

  /**
   * Remove agent from active (keep session data)
   */
  async deactivate(id: string): Promise<boolean> {
    const agents = await loadAgentsLocked();
    const index = agents.findIndex(a => a.id === id);

    if (index === -1) return false;

    agents[index].status = 'idle';
    agents[index].currentTaskId = undefined;
    agents[index].lastActivity = new Date().toISOString();
    await saveAgentsLocked(agents);

    return true;
  }

  /**
   * Delete agent session completely
   */
  async deleteAgent(id: string): Promise<boolean> {
    try {
      const agents = await loadAgentsLocked();
      const index = agents.findIndex(a => a.id === id);

      if (index === -1) return false;

      const agent = agents[index];
      agents.splice(index, 1);
      await saveAgentsLocked(agents);

      // Close Beads issue for agent
      try {
        const beadsIssues = await execBeads(['list', '--json', '--label', `agent:${agent.codeName}`]);
        if (Array.isArray(beadsIssues) && beadsIssues.length > 0) {
          await execBeads(['close', beadsIssues[0].id, '--reason', 'Agent deleted', '--json']);
        }
      } catch (error) {
        console.warn(`Failed to close Beads issue for agent ${agent.codeName}:`, error);
      }

      return true;
    } catch (error) {
      console.error(`Failed to delete agent ${id}:`, error);
      return false;
    }
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
