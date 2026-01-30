import { KVAdapter, kv } from './adapter';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskContext {
  files: string[];
  logs: string[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string; // Agent Session ID or 'JORDAN'
  agentCodeName?: string; // "Neon-Hawk"
  parentId?: string;
  context: TaskContext;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority; // Default: medium
  parentId?: string;
  assignedTo?: string;
  agentCodeName?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  parentId?: string;
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
    return this.delete(id);
  }
}

// Export singleton
export const taskTracker = new TaskTrackerAdapter();
