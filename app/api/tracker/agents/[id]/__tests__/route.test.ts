/**
 * Unit Tests for Tracker Agent by ID API Routes
 *
 * Tests GET, PATCH, DELETE /api/tracker/agents/[id]
 */

import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '../route';
import { agentAdapter } from '@/lib/integrations/kv/agents';

// Mock the agent adapter
jest.mock('@/lib/integrations/kv/agents', () => ({
  agentAdapter: {
    getAgent: jest.fn(),
    updateAgent: jest.fn(),
    deleteAgent: jest.fn(),
  },
}));

describe('GET /api/tracker/agents/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 for non-existent agent', async () => {
    (agentAdapter.getAgent as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/tracker/agents/nonexistent');
    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Agent not found');
  });

  it('returns agent if found', async () => {
    const now = Date.now();
    const mockAgent = {
      id: 'agent-123',
      codeName: 'Neon-Hawk',
      initials: 'NH',
      status: 'working' as const,
      currentAction: 'Running tests...',
      context: { spawnedBy: 'main', logs: [] },
      heartbeat: now,
      createdAt: now - 5000,
      updatedAt: now,
    };
    (agentAdapter.getAgent as jest.Mock).mockResolvedValue(mockAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123');
    const response = await GET(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('agent-123');
    expect(data.codeName).toBe('Neon-Hawk');
    expect(data.status).toBe('working');
    expect(data.currentAction).toBe('Running tests...');
  });

  it('returns agent with currentTaskId', async () => {
    const now = Date.now();
    const mockAgent = {
      id: 'agent-456',
      codeName: 'Solar-Bear',
      initials: 'SB',
      status: 'idle' as const,
      currentTaskId: 'task-789',
      context: { currentTaskId: 'task-789', spawnedBy: 'main', logs: [] },
      heartbeat: now,
      createdAt: now,
      updatedAt: now,
    };
    (agentAdapter.getAgent as jest.Mock).mockResolvedValue(mockAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-456');
    const response = await GET(request, { params: { id: 'agent-456' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.currentTaskId).toBe('task-789');
    expect(data.context.currentTaskId).toBe('task-789');
  });

  it('returns agent with logs', async () => {
    const now = Date.now();
    const mockAgent = {
      id: 'agent-789',
      codeName: 'Iron-Wolf',
      initials: 'IW',
      status: 'done' as const,
      currentAction: 'Completed',
      context: {
        spawnedBy: 'main',
        logs: ['Started task', 'Step 1 complete', 'Task finished'],
      },
      heartbeat: now,
      createdAt: now - 10000,
      updatedAt: now,
    };
    (agentAdapter.getAgent as jest.Mock).mockResolvedValue(mockAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-789');
    const response = await GET(request, { params: { id: 'agent-789' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.context.logs).toHaveLength(3);
    expect(data.context.logs[0]).toBe('Started task');
    expect(data.context.logs[2]).toBe('Task finished');
  });

  it('returns 500 on error', async () => {
    (agentAdapter.getAgent as jest.Mock).mockRejectedValue(new Error('KV error'));

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123');
    const response = await GET(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch agent');
  });
});

describe('PATCH /api/tracker/agents/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 for non-existent agent', async () => {
    (agentAdapter.updateAgent as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/tracker/agents/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'working' }),
    });
    const response = await PATCH(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Agent not found');
  });

  it('updates agent status', async () => {
    const now = Date.now();
    const updatedAgent = {
      id: 'agent-123',
      codeName: 'Neon-Hawk',
      initials: 'NH',
      status: 'working' as const,
      currentAction: 'Processing...',
      context: { spawnedBy: 'main', logs: [] },
      heartbeat: now,
      createdAt: now - 5000,
      updatedAt: now,
    };
    (agentAdapter.updateAgent as jest.Mock).mockResolvedValue(updatedAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'working' }),
    });
    const response = await PATCH(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('working');
    expect(agentAdapter.updateAgent).toHaveBeenCalledWith('agent-123', {
      status: 'working',
      currentAction: undefined,
      currentTaskId: undefined,
      logs: undefined,
    });
  });

  it('updates currentAction', async () => {
    const now = Date.now();
    const updatedAgent = {
      id: 'agent-123',
      codeName: 'Neon-Hawk',
      initials: 'NH',
      status: 'idle' as const,
      currentAction: 'Running database migration...',
      context: { spawnedBy: 'main', logs: [] },
      heartbeat: now,
      createdAt: now - 5000,
      updatedAt: now,
    };
    (agentAdapter.updateAgent as jest.Mock).mockResolvedValue(updatedAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123', {
      method: 'PATCH',
      body: JSON.stringify({ currentAction: 'Running database migration...' }),
    });
    const response = await PATCH(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.currentAction).toBe('Running database migration...');
  });

  it('updates currentTaskId', async () => {
    const now = Date.now();
    const updatedAgent = {
      id: 'agent-123',
      codeName: 'Neon-Hawk',
      initials: 'NH',
      status: 'working' as const,
      currentTaskId: 'task-456',
      context: { currentTaskId: 'task-456', spawnedBy: 'main', logs: [] },
      heartbeat: now,
      createdAt: now - 5000,
      updatedAt: now,
    };
    (agentAdapter.updateAgent as jest.Mock).mockResolvedValue(updatedAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123', {
      method: 'PATCH',
      body: JSON.stringify({ currentTaskId: 'task-456' }),
    });
    const response = await PATCH(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.currentTaskId).toBe('task-456');
  });

  it('updates multiple fields', async () => {
    const now = Date.now();
    const updatedAgent = {
      id: 'agent-123',
      codeName: 'Neon-Hawk',
      initials: 'NH',
      status: 'working' as const,
      currentAction: 'Analyzing data...',
      currentTaskId: 'task-789',
      context: { currentTaskId: 'task-789', spawnedBy: 'main', logs: [] },
      heartbeat: now,
      createdAt: now - 5000,
      updatedAt: now,
    };
    (agentAdapter.updateAgent as jest.Mock).mockResolvedValue(updatedAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'working',
        currentAction: 'Analyzing data...',
        currentTaskId: 'task-789',
      }),
    });
    const response = await PATCH(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('working');
    expect(data.currentAction).toBe('Analyzing data...');
    expect(data.currentTaskId).toBe('task-789');
  });

  it('updates status to error', async () => {
    const now = Date.now();
    const updatedAgent = {
      id: 'agent-123',
      codeName: 'Neon-Hawk',
      initials: 'NH',
      status: 'error' as const,
      currentAction: 'Failed to connect to database',
      context: { spawnedBy: 'main', logs: [] },
      heartbeat: now,
      createdAt: now - 5000,
      updatedAt: now,
    };
    (agentAdapter.updateAgent as jest.Mock).mockResolvedValue(updatedAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'error',
        currentAction: 'Failed to connect to database',
      }),
    });
    const response = await PATCH(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('error');
    expect(data.currentAction).toBe('Failed to connect to database');
  });

  it('updates status to done', async () => {
    const now = Date.now();
    const updatedAgent = {
      id: 'agent-123',
      codeName: 'Neon-Hawk',
      initials: 'NH',
      status: 'done' as const,
      currentAction: 'Completed',
      context: { spawnedBy: 'main', logs: [] },
      heartbeat: now,
      createdAt: now - 5000,
      updatedAt: now,
    };
    (agentAdapter.updateAgent as jest.Mock).mockResolvedValue(updatedAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'done',
        currentAction: 'Completed',
      }),
    });
    const response = await PATCH(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('done');
    expect(data.currentAction).toBe('Completed');
  });

  it('returns 500 on error', async () => {
    (agentAdapter.updateAgent as jest.Mock).mockRejectedValue(new Error('KV error'));

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'working' }),
    });
    const response = await PATCH(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update agent');
  });

  it('handles invalid JSON gracefully', async () => {
    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123', {
      method: 'PATCH',
      body: 'invalid json',
    });
    const response = await PATCH(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update agent');
  });
});

describe('DELETE /api/tracker/agents/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 for non-existent agent', async () => {
    (agentAdapter.deleteAgent as jest.Mock).mockResolvedValue(false);

    const request = new Request('http://localhost:3000/api/tracker/agents/nonexistent', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Agent not found');
  });

  it('deletes agent successfully', async () => {
    (agentAdapter.deleteAgent as jest.Mock).mockResolvedValue(true);

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(agentAdapter.deleteAgent).toHaveBeenCalledWith('agent-123');
  });

  it('returns 500 on error', async () => {
    (agentAdapter.deleteAgent as jest.Mock).mockRejectedValue(new Error('KV error'));

    const request = new Request('http://localhost:3000/api/tracker/agents/agent-123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'agent-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete agent');
  });
});
