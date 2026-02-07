import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// GET /api/tracker/kv-tasks?project=clawd
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    
    let taskIds;
    
    if (project && project !== 'all') {
      // Get tasks for specific project
      taskIds = await kv.smembers(`beads:project:${project}`);
    } else {
      // Get all tasks
      taskIds = await kv.smembers('beads:all');
    }
    
    if (taskIds.length === 0) {
      return NextResponse.json({ tasks: [], count: 0 });
    }
    
    // Fetch all task data in parallel
    const tasks = await Promise.all(
      taskIds.map(id => kv.hgetall(`beads:task:${id}`))
    );
    
    // Filter out nulls (deleted tasks)
    const validTasks = tasks.filter(t => t !== null);
    
    return NextResponse.json({
      tasks: validTasks,
      count: validTasks.length,
    });
  } catch (error) {
    console.error('KV Tasks API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
