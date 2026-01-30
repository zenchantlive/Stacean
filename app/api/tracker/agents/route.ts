// Agent Tracker API - Beads Integration with File Locking
// Uses locked Beads agent adapter

import { NextResponse } from 'next/server';
import { agentAdapter, CreateAgentInput, UpdateAgentInput } from '@/lib/integrations/beads/agents';

// ============================================================================
// GET /api/tracker/agents - List all active agents
// ============================================================================

export async function GET() {
  try {
    const agents = await agentAdapter.getActiveAgents();
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/tracker/agents - Create a new agent session
// ============================================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input: CreateAgentInput = {
      id: body.id,
      codeName: body.codeName,
      initials: body.initials,
      spawnedBy: body.spawnedBy,
    };

    const agent = await agentAdapter.createAgent(input);
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
