// Task Tracker API - Beads Integration (Production-Ready)
// Uses cached Beads client + agent state exposure

import { NextRequest, NextResponse } from 'next/server';
import {
  listIssues,
  getIssue,
  createIssue as createIssueUncached,
  updateIssue as updateIssueUncached,
  closeIssue as closeIssueUncached,
  deleteIssue,
  BeadsError,
} from '@/lib/integrations/beads/client-cached';
import { beadToTask, taskToBead } from '@/lib/integrations/beads/mapper';

// ============================================================================
// GET /api/tracker/tasks - List all tasks
// ============================================================================

export async function GET() {
  try {
    const beads = await listIssues();
    const tasks = beads.map(beadToTask);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('API Error (GET /tasks):', error);

    if (error instanceof BeadsError) {
      return NextResponse.json(
        { error: error.message, stderr: error.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/tracker/tasks - Create a new task
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Map Fleet Commander Task to Beads Issue
    const beadParams = taskToBead({
      title: body.title,
      description: body.description,
      priority: mapPriorityToBead(body.priority),
      assignee: body.assignedTo,
      agentCodeName: body.agentCodeName,
    });

    // Create issue in Beads
    const bead = await createIssueUncached(beadParams);

    // Convert back to Task format for response
    const task = beadToTask(bead);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('API Error (POST /tasks):', error);

    if (error instanceof BeadsError) {
      return NextResponse.json(
        { error: error.message, stderr: error.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/tracker/tasks/[id] - Update a task
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();

    // Map Fleet Commander updates to Beads format
    const beadUpdates: {
      title?: string;
      description?: string;
      priority?: number;
      status?: string;
      assignee?: string;
      labels?: string[];
    } = {};

    if (updates.title) beadUpdates.title = updates.title;
    if (updates.description) beadUpdates.description = updates.description;
    if (updates.priority !== undefined) beadUpdates.priority = mapPriorityToBead(updates.priority);
    if (updates.status) beadUpdates.status = mapStatusToBead(updates.status);
    if (updates.assignedTo) {
      beadUpdates.assignee = updates.assignedTo === 'JORDAN' ? undefined : updates.assignedTo;
    }

    // Update issue in Beads
    const bead = await updateIssueUncached(params.id, beadUpdates);

    // Convert back to Task format for response
    const task = beadToTask(bead);

    return NextResponse.json(task);
  } catch (error) {
    console.error('API Error (PATCH /tasks/[id]):', error);

    if (error instanceof BeadsError) {
      return NextResponse.json(
        { error: error.message, stderr: error.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/tracker/tasks/[id] - Delete a task
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await deleteIssue(params.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error (DELETE /tasks/[id]):', error);

    if (error instanceof BeadsError) {
      return NextResponse.json(
        { error: error.message, stderr: error.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

import type { TaskPriority, TaskStatus } from '@/lib/types/tracker';

function mapPriorityToBead(priority: TaskPriority): number {
  const priorityMap: Record<TaskPriority, number> = {
    'urgent': 0,
    'high': 1,
    'medium': 2,
    'low': 3,
  };
  return priorityMap[priority] || 2;
}

function mapStatusToBead(status: TaskStatus): string {
  const statusMap: Record<TaskStatus, string> = {
    'todo': 'todo',
    'in-progress': 'in-progress',
    'review': 'review',
    'done': 'done',
  };
  return statusMap[status] || 'open';
}
