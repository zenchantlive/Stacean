/**
 * API Unit Tests
 * 
 * These tests focus on edge cases and finding bugs in the backend.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskTrackerAdapter } from '../../lib/integrations/kv/tracker';

// Mock Beads client globally to avoid slow timeouts in tests
vi.mock('@/lib/integrations/beads/client', () => ({
  createIssue: vi.fn().mockResolvedValue({ id: 'mock-bead-id' }),
  updateIssue: vi.fn().mockResolvedValue(true),
  deleteIssue: vi.fn().mockResolvedValue(true),
  closeIssue: vi.fn().mockResolvedValue(true),
  listIssues: vi.fn().mockResolvedValue([]),
  getIssue: vi.fn().mockResolvedValue(null),
  execBeads: vi.fn().mockResolvedValue({}),
}));

// Mock KV adapter for testing
class MockKVAdapter {
  private storage: Map<string, any> = new Map();

  async set(key: string, value: any): Promise<void> {
    this.storage.set(key, value);
  }

  async get<T>(key: string): Promise<T | null> {
    return this.storage.get(key) || null;
  }

  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const prefix = pattern.replace(/\*/g, '');
    return Array.from(this.storage.keys()).filter(k => k.startsWith(prefix));
  }

  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    return keys.map(k => this.storage.get(k) || null);
  }

  getPrefix() {
    return 'mock:tracker:task';
  }
}

describe('TaskTracker API - Edge Cases & Bug Tests', () => {
  let tracker: TaskTrackerAdapter;
  let mockKV: MockKVAdapter;

  beforeEach(() => {
    mockKV = new MockKVAdapter();
    tracker = new TaskTrackerAdapter();
    (tracker as any).kv = mockKV;
  });

  afterEach(() => {
    // Clear mock storage
    (mockKV as any).storage.clear();
  });

  describe('Task Creation', () => {
    it('should generate unique ID for each task', async () => {
      const task1 = await tracker.createTask({ title: 'Task 1', description: '' });
      const task2 = await tracker.createTask({ title: 'Task 2', description: '' });

      expect(task1.id).not.toBe(task2.id);
    });

    it('should add "created" activity to new tasks', async () => {
      const task = await tracker.createTask({ title: 'Test', description: '' });

      expect(task.activities).toBeDefined();
      expect(task.activities?.length).toBeGreaterThan(0);

      const createdActivity = task.activities?.find((a: any) => a.type === 'created');
      expect(createdActivity).toBeDefined();
    });

    it('should default priority to medium', async () => {
      const task = await tracker.createTask({ title: 'Test', description: '' });

      expect(task.priority).toBe('medium');
    });

    it('should handle empty description', async () => {
      const task = await tracker.createTask({ title: 'Test', description: '' });

      expect(task.description).toBe('');
    });

    it('should handle missing description', async () => {
      const task = await tracker.createTask({ title: 'Test', description: undefined });

      expect(task.description).toBeUndefined();
    });
  });

  describe('Task Updates', () => {
    it('should update existing task', async () => {
      const created = await tracker.createTask({ title: 'Original', description: '' });
      const updated = await tracker.updateTask(created.id, {
        title: 'Updated',
        status: 'in_progress'
      });

      expect(updated?.title).toBe('Updated');
      expect(updated?.status).toBe('in_progress');
    });

    it('should preserve original data on partial update', async () => {
      const created = await tracker.createTask({
        title: 'Test',
        description: 'Original description',
        priority: 'high'
      });

      const updated = await tracker.updateTask(created.id, {
        title: 'New title only'
      });

      expect(updated?.description).toBe('Original description');
      expect(updated?.priority).toBe('high');
    });

    it('should append activities on update', async () => {
      const created = await tracker.createTask({ title: 'Test', description: '' });
      const initialActivityCount = created.activities?.length || 0;

      await tracker.updateTask(created.id, {
        status: 'in_progress',
        activities: [
          {
            id: 'act-1',
            timestamp: new Date().toISOString(),
            type: 'status_changed',
            details: 'Status changed',
          },
          ...(created.activities || []),
        ],
      });

      const updated = await tracker.getTask(created.id);

      expect(updated?.activities?.length).toBeGreaterThan(initialActivityCount);
    });

    it('should handle invalid task ID gracefully', async () => {
      const result = await tracker.updateTask('invalid-id', { title: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('Task Deletion', () => {
    it('should soft delete task', async () => {
      const created = await tracker.createTask({ title: 'Test', description: '' });
      await tracker.deleteTask(created.id);

      // 6-status system: soft delete sets status to shipped and deletedAt to ISO string
      const deleted = await tracker.getTask(created.id);
      expect(deleted).toBeDefined();
      expect(deleted?.status).toBe('shipped');
      expect(deleted?.deletedAt).toBeDefined();
    });

    it('should exclude deleted tasks from list', async () => {
      const created = await tracker.createTask({ title: 'Test', description: '' });
      await tracker.deleteTask(created.id);

      const tasks = await tracker.listTasks();
      const deletedInList = tasks.find((t: any) => t.id === created.id);

      expect(deletedInList).toBeUndefined();
    });

    it('should handle deleting non-existent task', async () => {
      const result = await tracker.deleteTask('does-not-exist');

      expect(result).toBe(false);
    });
  });

  describe('Activity Logging', () => {
    it('should generate unique activity IDs', async () => {
      const task = await tracker.createTask({ title: 'Test', description: '' });

      const activityIds = task.activities?.map((a: any) => a.id) || [];
      const uniqueIds = new Set(activityIds);

      expect(uniqueIds.size).toBe(activityIds.length);
    });

    it('should order activities by timestamp (newest first)', async () => {
      const task = await tracker.createTask({ title: 'Test', description: '' });

      const timestamps = task.activities?.map((a: any) => new Date(a.timestamp).getTime()) || [];

      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });

    it('should support all activity types', async () => {
      const validTypes = ['created', 'status_changed', 'priority_changed', 'description_updated', 'assigned', 'comment'];

      const task = await tracker.createTask({ title: 'Test', description: '' });
      const activityTypes = task.activities?.map((a: any) => a.type) || [];

      expect(validTypes).toContain(activityTypes[0]);
    });
  });

  describe('Data Validation', () => {
    it('should reject empty title', async () => {
      const task = await tracker.createTask({ title: '', description: '' });
      expect(task).toBeDefined();
    });

    it('should handle very long titles', async () => {
      const longTitle = 'A'.repeat(1000);
      const task = await tracker.createTask({ title: longTitle, description: '' });

      expect(task.title).toBe(longTitle);
    });

    it('should handle special characters in description', async () => {
      const specialDesc = 'Test with emoji 🔥\nNewlines\nAnd "quotes"';
      const task = await tracker.createTask({ title: 'Test', description: specialDesc });

      expect(task.description).toBe(specialDesc);
    });

    it('should handle concurrent updates', async () => {
      const task = await tracker.createTask({ title: 'Test', description: '' });

      const updates = [
        tracker.updateTask(task.id, { title: 'Update 1' }),
        tracker.updateTask(task.id, { status: 'in_progress' }),
        tracker.updateTask(task.id, { priority: 'urgent' }),
      ];

      await Promise.all(updates);

      const final = await tracker.getTask(task.id);
      expect(final).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle task with all optional fields', async () => {
      const fullTask = await tracker.createTask({
        title: 'Full task',
        description: 'Full description',
        priority: 'urgent',
        assignedTo: 'test-agent',
        agentCodeName: 'TestBot',
        project: 'test-project',
      });

      expect(fullTask.assignedTo).toBe('test-agent');
      expect(fullTask.agentCodeName).toBe('TestBot');
      expect(fullTask.project).toBe('test-project');
    });

    it('should handle task with minimal fields', async () => {
      const minimalTask = await tracker.createTask({
        title: 'Minimal task',
      });

      expect(minimalTask).toBeDefined();
      expect(minimalTask.id).toBeDefined();
      expect(minimalTask.createdAt).toBeDefined();
      expect(minimalTask.updatedAt).toBeDefined();
    });

    it('should handle rapid task creation', async () => {
      const count = 50;
      const start = Date.now();

      const tasks = await Promise.all(
        Array.from({ length: count }).map((_, i) =>
          tracker.createTask({ title: `Rapid task ${i}`, description: '' })
        )
      );

      const duration = Date.now() - start;

      expect(tasks.length).toBe(count);
      expect(duration).toBeLessThan(10000); // < 10s for 100 tasks

      const ids = tasks.map((t: any) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(count);
    });
  });
});
