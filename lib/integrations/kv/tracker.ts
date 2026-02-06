import { KVAdapter, kv } from './adapter';
import { randomUUID } from 'crypto';
import {
  createIssue as beadsCreateIssue,
  updateIssue as beadsUpdateIssue,
  deleteIssue as beadsDeleteIssue,
  closeIssue as beadsCloseIssue,
} from '@/lib/integrations/beads/client';
import type { Task, TaskStatus, TaskPriority, TaskActivity, CreateTaskInput, UpdateTaskInput } from '@/types/task';

export type { Task, TaskStatus, TaskPriority, TaskActivity, CreateTaskInput, UpdateTaskInput };

export interface TaskContext {
  files: string[];
  logs: string[];
}

export interface TaskWithContext extends Task {
  context: TaskContext;
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
    const now = new Date().toISOString();
    
    // Create initial activity
    const activities: TaskActivity[] = [
      {
        id: `act-${Date.now()}`,
        timestamp: now,
        type: 'created',
        details: `Task created: ${input.title}`,
      },
    ];
    
    const task: Task = {
      id,
      title: input.title,
      description: input.description,
      status: 'todo',
      priority: input.priority || 'medium',
      assignedTo: input.assignedTo,
      agentCodeName: input.agentCodeName,
      project: input.project,
      createdAt: now,
      updatedAt: now,
      activities,
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
      updatedAt: new Date().toISOString(),
    };

    await this.set(id, updated);

    // Mirror to Beads (best-effort, fails silently on Vercel)
    await mirrorToBeads('update', updated).catch(() => {});

    return updated;
  }

  /**
   * Add an activity to a task
   */
  async addActivity(taskId: string, activity: TaskActivity): Promise<Task | null> {
    const existing = await this.getTask(taskId);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      activities: [activity, ...(existing.activities || [])],
      updatedAt: new Date().toISOString(),
    };

    await this.set(taskId, updated);

    return updated;
  }

  /**
   * List all tasks
   * Note: Uses KEYS command, might be slow if millions of tasks.
   * For Tracker scale, this is acceptable.
   */
  async listTasks(): Promise<Task[]> {
    const pattern = `${this.getPrefix()}:*`;
    
    try {
      const keys = await kv.keys(pattern);
      if (!keys || keys.length === 0) return [];

      if (keys.length === 0) return [];
      
      const values = await kv.mget<Task>(...keys);
      
      // Filter out nulls and deleted tasks
      return values.filter(t => t !== null && t.status !== 'deleted') as Task[];
    } catch (error) {
      console.error('TaskTracker listTasks error:', error);
      return [];
    }
  }

  /**
   * Delete a task (soft delete by setting status to deleted)
   */
  async deleteTask(id: string): Promise<boolean> {
    const task = await this.getTask(id);
    if (!task) return false;

    // Soft delete
    const deleted: Task = {
      ...task,
      status: 'deleted',
      deletedAt: new Date().toISOString(),
    };

    await this.set(id, deleted);

    // Mirror to Beads (best-effort, fails silently on Vercel)
    await mirrorToBeads('delete', task).catch(() => {});

    return true;
  }

  /**
   * Hard delete a task from KV
   */
  async hardDeleteTask(id: string): Promise<boolean> {
    const task = await this.getTask(id);
    if (!task) return false;

    const success = await this.delete(id);

    if (success) {
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
  'assigned': 'agent_working',
  'in_progress': 'agent_working',
  'needs-you': 'needs_jordan',
  'ready': 'ready_to_commit',
  'review': 'in_review',
  'shipped': 'pushed',
  'deleted': 'deleted',
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
