// Task Tracker - Beads Integration
// Uses Beads CLI for local development and Beads API for production

import {
  listIssues,
  getIssue,
  createIssue,
  updateIssue,
  closeIssue,
  deleteIssue,
} from './client-cached';
import { mapBeadsToTask, mapTaskToBeads } from './mapper';
import type { BeadsIssue } from './mapper';
import { randomUUID } from 'crypto';

// ============================================================================
// Types (same as KV tracker for compatibility)
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
  project?: string; // For project filtering (e.g., "clawd", "asset-hatch")
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
  project?: string; // For project filtering (e.g., "clawd", "asset-hatch")
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
// Beads Status Mapping
// ============================================================================

const BEADS_STATUS_MAP: Record<TaskStatus, string> = {
  'todo': 'open',
  'in-progress': 'in_progress',
  'review': 'review',
  'done': 'closed',
};

const BEADS_STATUS_REVERSE: Record<string, TaskStatus> = {
  'open': 'todo',
  'in_progress': 'in-progress',
  'review': 'review',
  'closed': 'done',
};

const BEADS_PRIORITY_MAP: Record<TaskPriority, number> = {
  'low': 3,
  'medium': 2,
  'high': 1,
  'urgent': 0,
};

const BEADS_PRIORITY_REVERSE: Record<number, TaskPriority> = {
  0: 'urgent',
  1: 'high',
  2: 'medium',
  3: 'low',
};

// ============================================================================
// Adapter Class
// ============================================================================

export class TaskTrackerAdapter {
  /**
   * Create a new task via Beads
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    const beadsIssue = await createIssue({
      title: input.title,
      description: input.description,
      priority: input.priority ? BEADS_PRIORITY_MAP[input.priority] : 2, // Default: medium (2)
      assignee: input.assignedTo,
      labels: [
        input.agentCodeName ? `agent:${input.agentCodeName}` : undefined,
        input.project ? `project:${input.project}` : undefined,
        input.parentId ? `parent:${input.parentId}` : undefined,
      ].filter(Boolean) as string[],
    });

    return mapBeadsToTask(beadsIssue);
  }

  /**
   * Get a task by ID
   */
  async getTask(id: string): Promise<Task | null> {
    const issue = await getIssue(id);
    return issue ? mapBeadsToTask(issue) : null;
  }

  /**
   * Update an existing task via Beads
   */
  async updateTask(id: string, updates: UpdateTaskInput): Promise<Task | null> {
    const updateParams: Parameters<typeof updateIssue>[1] = {};

    if (updates.title) updateParams.title = updates.title;
    if (updates.description) updateParams.description = updates.description;
    if (updates.status) updateParams.status = BEADS_STATUS_MAP[updates.status];
    if (updates.priority) updateParams.priority = BEADS_PRIORITY_MAP[updates.priority];
    if (updates.assignedTo) updateParams.assignee = updates.assignedTo;

    // Handle labels for context updates
    if (updates.agentCodeName || updates.project || updates.parentId) {
      const existing = await getIssue(id);
      if (existing) {
        // Filter out old agent/project/parent labels
        const filteredLabels = existing.labels?.filter(l => 
          !l.startsWith('agent:') && 
          !l.startsWith('project:') && 
          !l.startsWith('parent:')
        ) || [];

        // Add new labels
        const newLabels = [
          ...filteredLabels,
          updates.agentCodeName ? `agent:${updates.agentCodeName}` : undefined,
          updates.project ? `project:${updates.project}` : undefined,
          updates.parentId ? `parent:${updates.parentId}` : undefined,
        ].filter(Boolean) as string[];

        updateParams.labels = newLabels;
      }
    }

    const updatedIssue = await updateIssue(id, updateParams);
    return updatedIssue ? mapBeadsToTask(updatedIssue) : null;
  }

  /**
   * List all tasks via Beads
   */
  async listTasks(): Promise<Task[]> {
    const issues = await listIssues();
    return issues.map(issue => mapBeadsToTask(issue));
  }

  /**
   * Delete a task via Beads
   */
  async deleteTask(id: string): Promise<boolean> {
    const result = await deleteIssue(id);
    return result.success;
  }

  /**
   * Close a task (shortcut for status = done)
   */
  async closeTask(id: string, reason?: string): Promise<Task | null> {
    const closedIssue = await closeIssue(id, reason);
    return closedIssue ? mapBeadsToTask(closedIssue) : null;
  }
}

// Export singleton
export const taskTracker = new TaskTrackerAdapter();
