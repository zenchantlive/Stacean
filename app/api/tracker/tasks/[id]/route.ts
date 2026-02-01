// Task Tracker API - KV with Beads Mirroring (by ID)
// Uses KV for production (real-time), mirrors to Beads for local tracking

import { NextRequest, NextResponse } from 'next/server';
import { taskTracker, type UpdateTaskInput, type Task, type TaskPriority, type TaskStatus } from '@/lib/integrations/kv/tracker';

// ============================================================================
// GET /api/tracker/tasks/[id] - Fetch a task
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await taskTracker.getTask(params.id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error('API Error (GET /tasks/[id]):', error);
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

    const updateInput: UpdateTaskInput = {};

    if (updates.title) updateInput.title = updates.title;
    if (updates.description) updateInput.description = updates.description;
    if (updates.priority) updateInput.priority = updates.priority as TaskPriority;
    if (updates.status) updateInput.status = updates.status as TaskStatus;
    if (updates.assignedTo) {
      updateInput.assignedTo = updates.assignedTo === 'JORDAN' ? undefined : updates.assignedTo;
    }

    const task = await taskTracker.updateTask(params.id, updateInput);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('API Error (PATCH /tasks/[id]):', error);
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
    const success = await taskTracker.deleteTask(params.id);

    if (!success) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error (DELETE /tasks/[id]):', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
