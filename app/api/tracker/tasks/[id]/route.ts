import { NextResponse } from 'next/server';
import { taskTracker, UpdateTaskInput } from '@/lib/integrations/kv/tracker';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const task = await taskTracker.getTask(params.id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const task = await taskTracker.updateTask(params.id, body as UpdateTaskInput);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await taskTracker.deleteTask(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Task not found or could not be deleted' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
