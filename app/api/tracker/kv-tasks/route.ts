import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// GET /api/tracker/kv-tasks?project=clawd
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');

    const taskIds: string[] =
      project && project !== 'all'
        ? await kv.smembers(`beads:project:${project}`)
        : await kv.smembers('beads:all');

    if (taskIds.length === 0) {
      return NextResponse.json({ tasks: [], source: 'kv', count: 0 });
    }

    // Fetch all task data using pipeline for better performance
    const pipeline = kv.pipeline();
    taskIds.forEach(id => pipeline.hgetall(`beads:task:${id}`));
    const tasks = await pipeline.exec();

    const validTasks = tasks.filter(t => t !== null);

    return NextResponse.json({
      tasks: validTasks,
      source: 'kv',
      count: validTasks.length,
    });
  } catch (error) {
    console.error('KV Tasks API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
