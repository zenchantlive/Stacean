// Agent Tracker API - Beads Integration (Production-Ready)
// Uses locked Beads agent adapter with agent state exposure

import { NextResponse } from 'next/server';
import { agentAdapter, UpdateAgentInput } from '@/lib/integrations/beads/agents';

// ============================================================================
// GET /api/tracker/agents/[id]
// ============================================================================

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await agentAdapter.getAgent(params.id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Failed to fetch agent:', error);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/tracker/agents/[id]
// Update agent status/heartbeat
// ============================================================================

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updates: UpdateAgentInput = {
      status: body.status,
      currentAction: body.currentAction,
      currentTaskId: body.currentTaskId,
      logs: body.logs,
    };

    const updated = await agentAdapter.updateAgent(params.id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/tracker/agents/[id]
// ============================================================================

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await agentAdapter.deleteAgent(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete agent:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
