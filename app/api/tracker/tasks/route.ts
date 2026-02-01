// Task Tracker API - KV with Beads Mirroring
// Uses KV for production (real-time), mirrors to Beads for local tracking

import { NextRequest, NextResponse } from 'next/server';
import { taskTracker, type CreateTaskInput, type UpdateTaskInput, type Task, type TaskPriority, type TaskStatus } from '@/lib/integrations/kv/tracker';

// ============================================================================
// GET /api/tracker/tasks - List all tasks
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const tasks = await taskTracker.listTasks();

    // Filter by project if query param provided
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');

    if (project && project !== 'all') {
      return NextResponse.json(tasks.filter(t => t.project === project));
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('API Error (GET /tasks):', error);
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

    // Support project from query param or body
    const { searchParams } = new URL(request.url);
    const queryProject = searchParams.get('project');

    const taskInput: CreateTaskInput = {
      title: body.title,
      description: body.description,
      priority: (body.priority as TaskPriority) || 'medium',
      assignedTo: body.assignedTo,
      agentCodeName: body.agentCodeName,
      project: queryProject || body.project,
      parentId: body.parentId,
    };

    const task = await taskTracker.createTask(taskInput);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('API Error (POST /tasks):', error);
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
