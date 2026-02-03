import { KVAdapter, kv } from './adapter';
import { randomUUID } from 'crypto';
import {
  createIssue as beadsCreateIssue,
  updateIssue as beadsUpdateIssue,
  deleteIssue as beadsDeleteIssue,
  closeIssue as beadsCloseIssue,
} from '@/lib/integrations/beads/client';

// ============================================================================
// Types
// ============================================================================

export type TaskStatus = 'todo' | 'active' | 'needs-you' | 'ready' | 'shipped';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskContext {
  files: string[];
  logs: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string; // Agent Session ID or 'JORDAN'
  agentCodeName?: string; // "Neon-Hawk"
  project?: string; // For project filtering (e.g., "clawd", "asset-hatch")
  parentId?: string;
  context: TaskContext;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority?: TaskPriority; // Default: medium
  parentId?: string;
  assignedTo?: string;
  agentCodeName?: string;
  project?: string; // For project filtering (e.g., "clawd", "asset-hatch")
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  parentId?: string;
  project?: string; // For project filtering (e.g., "clawd", "asset-hatch")
  context?: Partial<TaskContext>;
}

// ============================================================================
// Adapter Class
// ============================================================================

export class TaskTrackerAdapter extends KVAdapter {
  constructor() {
    super({ prefix: 'tracker:task' });
  }

  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    const id = randomUUID();
    const now = Date.now();
    
    const task: Task = {
      id,
      title: input.title,
      description: input.description,
      status: 'todo',
      priority: input.priority || 'medium',
      assignedTo: input.assignedTo,
      agentCodeName: input.agentCodeName,
      parentId: input.parentId,
      context: {
        files: [],
        logs: [],
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.set(id, task);

    // Mirror to Beads (best-effort, fails silently on Vercel)
    await mirrorToBeads('create', task).catch(() => {});

    return task;
  }

  /**
   * Get a task by ID
   */
  async getTask(id: string): Promise<Task | null> {
    return this.get<Task>(id);
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, updates: UpdateTaskInput): Promise<Task | null> {
    const existing = await this.getTask(id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...updates,
      context: {
        ...existing.context,
        ...(updates.context || {}),
      },
      updatedAt: Date.now(),
    };

    await this.set(id, updated);

    // Mirror to Beads (best-effort, fails silently on Vercel)
    await mirrorToBeads('update', updated).catch(() => {});

    return updated;
  }

  /**
   * List all tasks
   * Note: Uses KEYS command, might be slow if millions of tasks.
   * For the Tracker scale, this is acceptable.
   */
  async listTasks(): Promise<Task[]> {
    // The prefix in the adapter includes the colon? 
    // In KVAdapter: key(suffix) => `${this.prefix}:${suffix}`
    // So our prefix is 'tracker:task'
    // Keys will be 'tracker:task:UUID'
    
    // We need to find keys starting with 'tracker:task:'
    const pattern = `${this.getPrefix()}:*`;
    
    try {
      const keys = await kv.keys(pattern);
      if (!keys || keys.length === 0) return [];

      // Fetch all values in parallel
      // kv.mget requires full keys
      // Vercel KV mget returns array of values
      if (keys.length === 0) return [];
      
      const values = await kv.mget<Task>(...keys);
      
      // Filter out nulls if any
      return values.filter(t => t !== null) as Task[];
    } catch (error) {
      console.error('TaskTracker listTasks error:', error);
      return [];
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<boolean> {
    // Fetch task first for mirroring
    const task = await this.getTask(id);
    if (!task) return false;

    const success = await this.delete(id);

    if (success) {
      // Mirror to Beads (best-effort, fails silently on Vercel)
      await mirrorToBeads('delete', task).catch(() => {});
    }

    return success;
  }
}

// Export singleton
export const taskTracker = new TaskTrackerAdapter();

// ============================================================================
// Beads Mirroring Helper (Dual-Write)
// ============================================================================

/**
 * Beads status mapping
 */
const BEADS_STATUS_MAP: Record<TaskStatus, string> = {
  'todo': 'open',
  'active': 'agent_working',
  'needs-you': 'needs_jordan',
  'ready': 'ready_to_commit',
  'shipped': 'pushed',
};

const BEADS_PRIORITY_MAP: Record<TaskPriority, number> = {
  'low': 3,
  'medium': 2,
  'high': 1,
  'urgent': 0,
};

/**
 * Mirror task to Beads (best-effort, fails silently on Vercel)
 * This is called from KV adapter to keep Beads in sync
 */
async function mirrorToBeads(
  action: 'create' | 'update' | 'delete' | 'close',
  task: Task
): Promise<void> {
  // Skip on Vercel (no Beads CLI available)
  if (process.env.VERCEL) {
    return;
  }

  try {
    if (action === 'create') {
      await beadsCreateIssue({
        title: task.title,
        description: task.description,
        priority: BEADS_PRIORITY_MAP[task.priority],
        assignee: task.assignedTo,
        labels: [
          task.agentCodeName ? `agent:${task.agentCodeName}` : undefined,
          task.project ? `project:${task.project}` : undefined,
        ].filter(Boolean) as string[],
      });
    } else if (action === 'update') {
      await beadsUpdateIssue(task.id, {
        title: task.title,
        description: task.description,
        priority: BEADS_PRIORITY_MAP[task.priority],
        status: BEADS_STATUS_MAP[task.status],
        assignee: task.assignedTo,
      });
    } else if (action === 'delete') {
      await beadsDeleteIssue(task.id);
    } else if (action === 'close') {
      await beadsCloseIssue(task.id, 'Closed from KV tracker');
    }
  } catch (error) {
    // Silently fail on Vercel or if Beads isn't available
    // This is a best-effort mirror, not a critical operation
    if (process.env.NODE_ENV === 'development') {
      console.warn('Beads mirror failed (non-critical):', error);
    }
  }
}
