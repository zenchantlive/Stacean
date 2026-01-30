/**
 * Unit Tests for Task Tracker KV Adapter
 *
 * Tests the core task tracking operations with mocked KV
 */

import { TaskTrackerAdapter, Task, CreateTaskInput, UpdateTaskInput } from '../tracker';

// Mock the KV module
const mockSet = jest.fn().mockResolvedValue(true);
const mockGet = jest.fn().mockResolvedValue(null);
const mockDelete = jest.fn().mockResolvedValue(true);
const mockKeys = jest.fn().mockResolvedValue([]);
const mockMget = jest.fn().mockResolvedValue([]);

jest.mock('../adapter', () => ({
  kv: {
    set: (...args) => mockSet(...args),
    get: (...args) => mockGet(...args),
    delete: (...args) => mockDelete(...args),
    keys: (...args) => mockKeys(...args),
    mget: (...args) => mockMget(...args),
  },
}));

describe('TaskTrackerAdapter', () => {
  let tracker: TaskTrackerAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    tracker = new TaskTrackerAdapter();
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
      expect(mockSet).toHaveBeenCalledWith(
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
      mockGet.mockResolvedValue(null);

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
      mockGet.mockResolvedValue(mockTask);

      const task = await tracker.getTask('task-123');

      expect(task).toEqual(mockTask);
      expect(mockGet).toHaveBeenCalledWith('task-123');
    });
  });

  describe('updateTask', () => {
    it('returns null if task not found', async () => {
      mockGet.mockResolvedValue(null);

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
      mockGet.mockResolvedValue(existingTask);

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
      expect(mockSet).toHaveBeenCalledWith('task-123', expect.objectContaining({
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
      mockGet.mockResolvedValue(existingTask);

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
      mockGet.mockResolvedValue(existingTask);

      const result = await tracker.updateTask('task-123', { title: 'New' });

      expect(result!.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });
  });

  describe('listTasks', () => {
    it('returns empty array when no tasks', async () => {
      mockKeys.mockResolvedValue([]);

      const tasks = await tracker.listTasks();

      expect(tasks).toEqual([]);
    });

    it('fetches and returns all tasks', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'todo',
          priority: 'medium',
          context: { files: [], logs: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: 'done',
          priority: 'high',
          context: { files: [], logs: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      mockKeys.mockResolvedValue(['tracker:task:1', 'tracker:task:2']);
      mockMget.mockResolvedValue(mockTasks);

      const tasks = await tracker.listTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });

    it('filters out null values from mget', async () => {
      mockKeys.mockResolvedValue(['tracker:task:1', 'tracker:task:2']);
      mockMget.mockResolvedValue([
        { id: 'task-1', title: 'Task 1', status: 'todo', priority: 'medium', context: { files: [], logs: [] }, createdAt: Date.now(), updatedAt: Date.now() },
        null, // Deleted task
      ]);

      const tasks = await tracker.listTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task 1');
    });

    it('handles KV errors gracefully', async () => {
      mockKeys.mockRejectedValue(new Error('KV connection failed'));

      const tasks = await tracker.listTasks();

      expect(tasks).toEqual([]);
    });
  });

  describe('deleteTask', () => {
    it('calls KV delete', async () => {
      mockDelete.mockResolvedValue(true);

      const result = await tracker.deleteTask('task-123');

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith('task-123');
    });

    it('returns false if delete fails', async () => {
      mockDelete.mockResolvedValue(false);

      const result = await tracker.deleteTask('task-123');

      expect(result).toBe(false);
    });
  });
});