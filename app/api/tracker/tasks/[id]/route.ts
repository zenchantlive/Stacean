// Task Tracker API - Beads Integration (by ID)

import { NextRequest, NextResponse } from 'next/server';
import {
  getIssue,
  updateIssue as updateIssueUncached,
  deleteIssue,
  BeadsError,
} from '@/lib/integrations/beads/client-cached';
import { beadToTask } from '@/lib/integrations/beads/mapper';
import type { TaskPriority, TaskStatus } from '@/lib/types/tracker';

// ============================================================================
// GET /api/tracker/tasks/[id] - Fetch a task
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bead = await getIssue(params.id);
    if (!bead) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(beadToTask(bead));
  } catch (error) {
    console.error('API Error (GET /tasks/[id]):', error);

    if (error instanceof BeadsError) {
      return NextResponse.json(
        { error: error.message, stderr: error.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
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

    const bead = await updateIssueUncached(params.id, beadUpdates);
    return NextResponse.json(beadToTask(bead));
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
