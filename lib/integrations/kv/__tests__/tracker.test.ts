/**
 * Unit Tests for Task Tracker KV Adapter
 *
 * Tests the core task tracking operations with mocked KV
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskTrackerAdapter, Task, CreateTaskInput, UpdateTaskInput } from '../tracker';
import { KVAdapter } from '../adapter';

// Create a mock class that extends KVAdapter
const createMockTracker = () => {
  const mockSet = vi.fn().mockResolvedValue(true);
  const mockGet = vi.fn().mockResolvedValue(null);
  const mockDelete = vi.fn().mockResolvedValue(true);
  const mockKeys = vi.fn().mockResolvedValue([]);
  const mockMget = vi.fn().mockResolvedValue([]);

  class MockKVAdapter extends KVAdapter {
    constructor() {
      super({ prefix: 'test' });
    }
    async get<T>(key: string): Promise<T | null> {
      return mockGet(key) as Promise<T | null>;
    }
    async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
      return mockSet(key, value, ttl);
    }
    async delete(key: string): Promise<boolean> {
      return mockDelete(key);
    }
    async exists(key: string): Promise<boolean> {
      return (await this.get(key)) !== null;
    }
    async incr(key: string): Promise<number> {
      return 1;
    }
    async decr(key: string): Promise<number> {
      return 0;
    }
    async keys(pattern: string): Promise<string[]> {
      return mockKeys(pattern);
    }
    async mget<T>(...keys: string[]): Promise<(T | null)[]> {
      return mockMget(...keys) as Promise<(T | null)[]>;
    }
    async zadd(key: string, item: { score: number; member: string }): Promise<number | string> {
      return 1;
    }
    async zrange(key: string, start: number | string, stop: number | string, opts?: any): Promise<string[]> {
      return [];
    }
    async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
      return 1;
    }
    async zcard(key: string): Promise<number> {
      return 0;
    }
    async ping(): Promise<string> {
      return 'PONG';
    }
  }

  return { tracker: new MockKVAdapter() as TaskTrackerAdapter, mocks: { mockSet, mockGet, mockDelete, mockKeys, mockMget } };
};

describe('TaskTrackerAdapter', () => {
  let tracker: TaskTrackerAdapter;
  let mocks: { mockSet: any, mockGet: any, mockDelete: any, mockKeys: any, mockMget: any };

  beforeEach(() => {
    const setup = createMockTracker();
    tracker = setup.tracker;
    mocks = setup.mocks;
    vi.clearAllMocks();
  });

  describe('createTask', () => {
    it('creates a task with defaults', async () => {
      const input: CreateTaskInput = {
        title: 'Test Task',
        description: 'A test task',
      };

      const task = await tracker.createTask(input);

      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('A test task');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.id).toBeDefined();
      expect(task.context.files).toEqual([]);
      expect(task.context.logs).toEqual([]);
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();

      // Verify KV set was called
      expect(mocks.mockSet).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({ title: 'Test Task' })
      );
    });

    it('uses provided priority', async () => {
      const input: CreateTaskInput = {
        title: 'Urgent Task',
        priority: 'urgent',
      };

      const task = await tracker.createTask(input);

      expect(task.priority).toBe('urgent');
    });

    it('assigns to agent if provided', async () => {
      const input: CreateTaskInput = {
        title: 'Agent Task',
        assignedTo: 'agent-123',
        agentCodeName: 'Neon-Hawk',
      };

      const task = await tracker.createTask(input);

      expect(task.assignedTo).toBe('agent-123');
      expect(task.agentCodeName).toBe('Neon-Hawk');
    });
  });

  describe('getTask', () => {
    it('returns null for non-existent task', async () => {
      mocks.mockGet.mockResolvedValue(null);

      const task = await tracker.getTask('nonexistent');

      expect(task).toBeNull();
    });

    it('returns task if found', async () => {
      const mockTask: Task = {
        id: 'task-123',
        title: 'Found Task',
        status: 'todo',
        priority: 'medium',
        context: { files: [], logs: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mocks.mockGet.mockResolvedValue(mockTask);

      const task = await tracker.getTask('task-123');

      expect(task).toEqual(mockTask);
      expect(mocks.mockGet).toHaveBeenCalledWith('task-123');
    });
  });

  describe('updateTask', () => {
    it('returns null if task not found', async () => {
      mocks.mockGet.mockResolvedValue(null);

      const result = await tracker.updateTask('nonexistent', { title: 'New' });

      expect(result).toBeNull();
    });

    it('updates task fields', async () => {
      const existingTask: Task = {
        id: 'task-123',
        title: 'Original',
        status: 'todo',
        priority: 'medium',
        context: { files: [], logs: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mocks.mockGet.mockResolvedValue(existingTask);

      const updates: UpdateTaskInput = {
        title: 'Updated Title',
        status: 'in-progress',
        priority: 'high',
      };

      const result = await tracker.updateTask('task-123', updates);

      expect(result).toBeDefined();
      expect(result!.title).toBe('Updated Title');
      expect(result!.status).toBe('in-progress');
      expect(result!.priority).toBe('high');
      expect(mocks.mockSet).toHaveBeenCalledWith('task-123', expect.objectContaining({
        title: 'Updated Title',
        status: 'in-progress',
        priority: 'high',
      }));
    });

    it('merges context updates', async () => {
      const existingTask: Task = {
        id: 'task-123',
        title: 'Task',
        status: 'todo',
        priority: 'medium',
        context: { files: ['file1.ts'], logs: ['log1'] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mocks.mockGet.mockResolvedValue(existingTask);

      const result = await tracker.updateTask('task-123', {
        context: { files: ['file2.ts'] },
      });

      expect(result!.context.files).toEqual(['file2.ts']);
      expect(result!.context.logs).toEqual(['log1']);
    });

    it('updates timestamp', async () => {
      const originalUpdatedAt = Date.now() - 1000;
      const existingTask: Task = {
        id: 'task-123',
        title: 'Task',
        status: 'todo',
        priority: 'medium',
        context: { files: [], logs: [] },
        createdAt: originalUpdatedAt,
        updatedAt: originalUpdatedAt,
      };
      mocks.mockGet.mockResolvedValue(existingTask);

      const result = await tracker.updateTask('task-123', { title: 'New' });

      expect(result!.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });
  });

  describe('listTasks', () => {
    it('returns empty array when no tasks', async () => {
      mocks.mockKeys.mockResolvedValue([]);

      const tasks = await tracker.listTasks();

      expect(tasks).toEqual([]);
    });

    it('fetches and returns all tasks', async () => {
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          status: 'todo',
          priority: 'medium',
          context: { files: [], logs: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          title: 'Task 2',
          status: 'in-progress',
          priority: 'high',
          context: { files: [], logs: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      mocks.mockKeys.mockResolvedValue(['1', '2']);
      mocks.mockMget.mockResolvedValue(mockTasks);

      const tasks = await tracker.listTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('1');
      expect(mocks.mockMget).toHaveBeenCalledWith('1', '2');
    });

    it('filters out null values from mget', async () => {
      mocks.mockKeys.mockResolvedValue(['1', '2', '3']);
      mocks.mockMget.mockResolvedValue([
        {
          id: '1',
          title: 'Task 1',
          status: 'todo',
          priority: 'medium',
          context: { files: [], logs: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        null, // Deleted task
        {
          id: '3',
          title: 'Task 3',
          status: 'done',
          priority: 'low',
          context: { files: [], logs: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      const tasks = await tracker.listTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('1');
      expect(tasks[1].id).toBe('3');
    });

    it('handles KV errors gracefully', async () => {
      mocks.mockKeys.mockRejectedValue(new Error('KV connection failed'));

      const tasks = await tracker.listTasks();

      expect(tasks).toEqual([]);
    });
  });

  describe('deleteTask', () => {
    it('deletes task successfully', async () => {
      mocks.mockDelete.mockResolvedValue(true);

      const result = await tracker.deleteTask('task-123');

      expect(result).toBe(true);
      expect(mocks.mockDelete).toHaveBeenCalledWith('task-123');
    });

    it('returns false if delete fails', async () => {
      mocks.mockDelete.mockResolvedValue(false);

      const result = await tracker.deleteTask('nonexistent');

      expect(result).toBe(false);
    });

    it('calls KV delete', async () => {
        mocks.mockDelete.mockResolvedValue(true);
        await tracker.deleteTask('task-123');
        expect(mocks.mockDelete).toHaveBeenCalledWith('task-123');
    });
  });
});