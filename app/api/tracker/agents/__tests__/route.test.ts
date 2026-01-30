/**
 * Unit Tests for Tracker Agents API Routes
 *
 * Tests GET /api/tracker/agents and POST /api/tracker/agents
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { agentAdapter } from '@/lib/integrations/kv/agents';

// Mock the agent adapter
jest.mock('@/lib/integrations/kv/agents', () => ({
  agentAdapter: {
    getActiveAgents: jest.fn(),
    createAgent: jest.fn(),
  },
}));

describe('GET /api/tracker/agents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 500 on KV error', async () => {
    (agentAdapter.getActiveAgents as jest.Mock).mockRejectedValue(new Error('KV failed'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch agents');
  });

  it('returns empty array when no agents', async () => {
    (agentAdapter.getActiveAgents as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('returns all active agents sorted by heartbeat', async () => {
    const now = Date.now();
    const mockAgents = [
      {
        id: 'agent-1',
        codeName: 'Neon-Hawk',
        initials: 'NH',
        status: 'working' as const,
        currentAction: 'Analyzing...',
        context: { spawnedBy: 'main', logs: [] },
        heartbeat: now - 1000,
        createdAt: now - 5000,
        updatedAt: now - 1000,
      },
      {
        id: 'agent-2',
        codeName: 'Solar-Bear',
        initials: 'SB',
        status: 'idle' as const,
        context: { spawnedBy: 'main', logs: [] },
        heartbeat: now,
        createdAt: now - 3000,
        updatedAt: now,
      },
    ];
    (agentAdapter.getActiveAgents as jest.Mock).mockResolvedValue(mockAgents);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].codeName).toBe('Solar-Bear'); // Most recent heartbeat
    expect(data[1].codeName).toBe('Neon-Hawk');
  });

  it('handles agents with different statuses', async () => {
    const now = Date.now();
    const mockAgents = [
      {
        id: 'agent-1',
        codeName: 'Neon-Hawk',
        initials: 'NH',
        status: 'working' as const,
        currentAction: 'Running tests...',
        context: { spawnedBy: 'main', logs: [] },
        heartbeat: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'agent-2',
        codeName: 'Solar-Bear',
        initials: 'SB',
        status: 'error' as const,
        currentAction: 'Failed to fetch data',
        context: { spawnedBy: 'main', logs: [] },
        heartbeat: now - 1000,
        createdAt: now - 5000,
        updatedAt: now - 1000,
      },
      {
        id: 'agent-3',
        codeName: 'Iron-Wolf',
        initials: 'IW',
        status: 'done' as const,
        currentAction: 'Completed',
        context: { spawnedBy: 'main', logs: [] },
        heartbeat: now - 2000,
        createdAt: now - 6000,
        updatedAt: now - 2000,
      },
    ];
    (agentAdapter.getActiveAgents as jest.Mock).mockResolvedValue(mockAgents);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);
    expect(data[0].status).toBe('working');
    expect(data[1].status).toBe('error');
    expect(data[2].status).toBe('done');
  });

  it('handles agents with currentTaskId', async () => {
    const now = Date.now();
    const mockAgents = [
      {
        id: 'agent-1',
        codeName: 'Neon-Hawk',
        initials: 'NH',
        status: 'working' as const,
        currentTaskId: 'task-123',
        currentAction: 'Working on task-123',
        context: { currentTaskId: 'task-123', spawnedBy: 'main', logs: [] },
        heartbeat: now,
        createdAt: now,
        updatedAt: now,
      },
    ];
    (agentAdapter.getActiveAgents as jest.Mock).mockResolvedValue(mockAgents);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].currentTaskId).toBe('task-123');
    expect(data[0].context.currentTaskId).toBe('task-123');
  });
});

describe('POST /api/tracker/agents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates agent with minimal data', async () => {
    const mockAgent = {
      id: 'agent-123',
      codeName: 'Neon-Hawk',
      initials: 'NH',
      status: 'idle' as const,
      context: { spawnedBy: 'main', logs: [] },
      heartbeat: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    (agentAdapter.createAgent as jest.Mock).mockResolvedValue(mockAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('agent-123');
    expect(data.codeName).toBe('Neon-Hawk');
    expect(data.initials).toBe('NH');
    expect(data.status).toBe('idle');
    expect(agentAdapter.createAgent).toHaveBeenCalledWith({});

    // Verify codeName and initials are auto-generated
    const createCall = (agentAdapter.createAgent as jest.Mock).mock.calls[0][0];
    expect(createCall.id).toBeUndefined(); // Auto-generated
    expect(createCall.codeName).toBeUndefined(); // Auto-generated
    expect(createCall.initials).toBeUndefined(); // Auto-generated
  });

  it('creates agent with custom id', async () => {
    const mockAgent = {
      id: 'custom-id',
      codeName: 'Solar-Bear',
      initials: 'SB',
      status: 'idle' as const,
      context: { spawnedBy: 'main', logs: [] },
      heartbeat: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    (agentAdapter.createAgent as jest.Mock).mockResolvedValue(mockAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents', {
      method: 'POST',
      body: JSON.stringify({ id: 'custom-id' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('custom-id');
    expect(agentAdapter.createAgent).toHaveBeenCalledWith({ id: 'custom-id' });
  });

  it('creates agent with custom codeName and initials', async () => {
    const mockAgent = {
      id: 'agent-456',
      codeName: 'Iron-Wolf',
      initials: 'IW',
      status: 'idle' as const,
      context: { spawnedBy: 'main', logs: [] },
      heartbeat: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    (agentAdapter.createAgent as jest.Mock).mockResolvedValue(mockAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents', {
      method: 'POST',
      body: JSON.stringify({
        codeName: 'Iron-Wolf',
        initials: 'IW',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.codeName).toBe('Iron-Wolf');
    expect(data.initials).toBe('IW');
    expect(agentAdapter.createAgent).toHaveBeenCalledWith({
      codeName: 'Iron-Wolf',
      initials: 'IW',
    });
  });

  it('creates agent with spawnedBy', async () => {
    const mockAgent = {
      id: 'agent-789',
      codeName: 'Neon-Hawk',
      initials: 'NH',
      status: 'idle' as const,
      context: { spawnedBy: 'parent-session-123', logs: [] },
      heartbeat: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    (agentAdapter.createAgent as jest.Mock).mockResolvedValue(mockAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents', {
      method: 'POST',
      body: JSON.stringify({ spawnedBy: 'parent-session-123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.context.spawnedBy).toBe('parent-session-123');
    expect(agentAdapter.createAgent).toHaveBeenCalledWith({
      spawnedBy: 'parent-session-123',
    });
  });

  it('creates agent with all fields', async () => {
    const mockAgent = {
      id: 'agent-full',
      codeName: 'Custom-Agent',
      initials: 'CA',
      status: 'idle' as const,
      context: { spawnedBy: 'parent-123', logs: [] },
      heartbeat: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    (agentAdapter.createAgent as jest.Mock).mockResolvedValue(mockAgent);

    const request = new Request('http://localhost:3000/api/tracker/agents', {
      method: 'POST',
      body: JSON.stringify({
        id: 'agent-full',
        codeName: 'Custom-Agent',
        initials: 'CA',
        spawnedBy: 'parent-123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('agent-full');
    expect(data.codeName).toBe('Custom-Agent');
    expect(data.initials).toBe('CA');
    expect(data.context.spawnedBy).toBe('parent-123');
    expect(agentAdapter.createAgent).toHaveBeenCalledWith({
      id: 'agent-full',
      codeName: 'Custom-Agent',
      initials: 'CA',
      spawnedBy: 'parent-123',
    });
  });

  it('returns 500 on create error', async () => {
    (agentAdapter.createAgent as jest.Mock).mockRejectedValue(new Error('KV write failed'));

    const request = new Request('http://localhost:3000/api/tracker/agents', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create agent');
  });

  it('handles invalid JSON gracefully', async () => {
    const request = new Request('http://localhost:3000/api/tracker/agents', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create agent');
  });
});
