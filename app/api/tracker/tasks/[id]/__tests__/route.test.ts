/**
 * Unit Tests for Tracker Task by ID API Routes
 *
 * Tests GET, PATCH, DELETE /api/tracker/tasks/[id]
 */

import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '../route';
import { taskTracker } from '@/lib/integrations/kv/tracker';

jest.mock('@/lib/integrations/kv/tracker', () => ({
  taskTracker: {
    getTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  },
}));

describe('GET /api/tracker/tasks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 for non-existent task', async () => {
    (taskTracker.getTask as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks/nonexistent');
    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Task not found');
  });

  it('returns task if found', async () => {
    const mockTask = {
      id: 'task-123',
      title: 'Found Task',
      status: 'todo',
      priority: 'high',
      context: { files: [], logs: [] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    (taskTracker.getTask as jest.Mock).mockResolvedValue(mockTask);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks/task-123');
    const response = await GET(request, { params: { id: 'task-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Found Task');
    expect(data.id).toBe('task-123');
  });

  it('returns 500 on error', async () => {
    (taskTracker.getTask as jest.Mock).mockRejectedValue(new Error('KV error'));

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks/task-123');
    const response = await GET(request, { params: { id: 'task-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch task');
  });
});

describe('PATCH /api/tracker/tasks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 for non-existent task', async () => {
    (taskTracker.updateTask as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'New Title' }),
    });
    const response = await PATCH(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Task not found');
  });

  it('updates task status', async () => {
    const updatedTask = {
      id: 'task-123',
      title: 'Task',
      status: 'in-progress',
      priority: 'medium',
      context: { files: [], logs: [] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    (taskTracker.updateTask as jest.Mock).mockResolvedValue(updatedTask);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks/task-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in-progress' }),
    });
    const response = await PATCH(request, { params: { id: 'task-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('in-progress');
  });

  it('updates multiple fields', async () => {
    const updatedTask = {
      id: 'task-123',
      title: 'Updated Title',
      description: 'New description',
      status: 'review',
      priority: 'urgent',
      context: { files: [], logs: [] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    (taskTracker.updateTask as jest.Mock).mockResolvedValue(updatedTask);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks/task-123', {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'Updated Title',
        description: 'New description',
        status: 'review',
        priority: 'urgent',
      }),
    });
    const response = await PATCH(request, { params: { id: 'task-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Updated Title');
    expect(data.description).toBe('New description');
    expect(data.status).toBe('review');
    expect(data.priority).toBe('urgent');
  });

  it('returns 500 on error', async () => {
    (taskTracker.updateTask as jest.Mock).mockRejectedValue(new Error('KV error'));

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks/task-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'New' }),
    });
    const response = await PATCH(request, { params: { id: 'task-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update task');
  });
});

describe('DELETE /api/tracker/tasks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 for non-existent task', async () => {
    (taskTracker.deleteTask as jest.Mock).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks/nonexistent', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Task not found or could not be deleted');
  });

  it('deletes task successfully', async () => {
    (taskTracker.deleteTask as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks/task-123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'task-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 500 on error', async () => {
    (taskTracker.deleteTask as jest.Mock).mockRejectedValue(new Error('KV error'));

    const request = new NextRequest('http://localhost:3000/api/tracker/tasks/task-123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'task-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete task');
  });
});