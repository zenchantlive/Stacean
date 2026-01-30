/**
 * Unit Tests for Tracker Tasks API Routes
 *
 * Tests GET /api/tracker/tasks and POST /api/tracker/tasks
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { taskTracker } from '@/lib/integrations/kv/tracker';

// Mock the task tracker
jest.mock('@/lib/integrations/kv/tracker', () => ({
  taskTracker: {
    listTasks: jest.fn(),
    createTask: jest.fn(),
  },
}));

describe('GET /api/tracker/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 500 on KV error', async () => {
    (taskTracker.listTasks as jest.Mock).mockRejectedValue(new Error('KV failed'));

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch tasks');
  });

  it('returns empty array when no tasks', async () => {
    (taskTracker.listTasks as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('returns all tasks', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', status: 'todo' as const, priority: 'medium' as const, context: { files: [], logs: [] }, createdAt: 1, updatedAt: 1 },
      { id: '2', title: 'Task 2', status: 'done' as const, priority: 'high' as const, context: { files: [], logs: [] }, createdAt: 2, updatedAt: 2 },
    ];
    (taskTracker.listTasks as jest.Mock).mockResolvedValue(mockTasks);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].title).toBe('Task 1');
    expect(data[1].title).toBe('Task 2');
  });
});

describe('POST /api/tracker/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if title is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/tracker/tasks', {
      method: 'POST',
      body: JSON.stringify({ description: 'No title' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title is required');
  });

  it('returns 400 for empty title', async () => {
    const request = new NextRequest('http://localhost:3000/api/tracker/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: '   ' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title is required');
  });

  it('creates task with title only', async () => {
    const mockTask = {
      id: 'new-task-id',
      title: 'New Task',
      status: 'todo',
      priority: 'medium',
      context: { files: [], logs: [] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    (taskTracker.createTask as jest.Mock).mockResolvedValue(mockTask);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Task' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe('New Task');
    expect(data.id).toBe('new-task-id');
    expect(data.status).toBe('todo');
  });

  it('creates task with all fields', async () => {
    const mockTask = {
      id: 'task-with-all',
      title: 'Full Task',
      description: 'A description',
      status: 'todo',
      priority: 'high',
      assignedTo: 'agent-123',
      agentCodeName: 'Neon-Hawk',
      context: { files: [], logs: [] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    (taskTracker.createTask as jest.Mock).mockResolvedValue(mockTask);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Full Task',
        description: 'A description',
        priority: 'high',
        assignedTo: 'agent-123',
        agentCodeName: 'Neon-Hawk',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe('Full Task');
    expect(data.description).toBe('A description');
    expect(data.priority).toBe('high');
    expect(data.assignedTo).toBe('agent-123');
    expect(data.agentCodeName).toBe('Neon-Hawk');
  });

  it('returns 500 on create error', async () => {
    (taskTracker.createTask as jest.Mock).mockRejectedValue(new Error('KV write failed'));

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Failing Task' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create task');
  });
});