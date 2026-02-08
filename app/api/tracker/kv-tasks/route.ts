// KV Tasks API - Fetch tasks from KV (Single Source of Truth)
// GET /api/tracker/kv-tasks - List all tasks from KV

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface BeadTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  agentCodeName: string;
  project: string;
  createdAt: string;
  updatedAt: string;
  isFromKV: true;
}

interface RawBead {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number | string;
  labels?: string[];
  created_at?: string;
  updated_at?: string;
  createdAt?: string;  // Allow both formats
  updatedAt?: string;
  project?: string;
  agentCodeName?: string;
}

/**
 * Transform KV bead to Stacean task format
 */
function transformBeadToTask(bead: RawBead): BeadTask {
  // Map Beads status to Stacean status (Unified 6-status system)
  const statusMap: Record<string, string> = {
    'open': 'todo',
    'todo': 'todo',
    'in_progress': 'in_progress',
    'agent_working': 'in_progress',
    'needs_jordan': 'needs-you',
    'needs-you': 'needs-you',
    'ready_to_commit': 'ready',
    'ready': 'ready',
    'in_review': 'review',
    'review': 'review',
    'shipped': 'shipped',
    'pushed': 'shipped',
    'done': 'shipped',
    'closed': 'shipped',
  };

  // Map Beads priority (0-3 or string) to Stacean priority
  const priorityMap: Record<string | number, BeadTask['priority']> = {
    0: 'urgent',
    1: 'high',
    2: 'medium',
    3: 'low',
    'urgent': 'urgent',
    'high': 'high',
    'medium': 'medium',
    'low': 'low',
  };

  // Extract agent code name
  const agentLabel = bead.labels?.find((l: string) => l.startsWith('agent:'));
  const agentCodeName = bead.agentCodeName || (agentLabel ? agentLabel.replace('agent:', '') : 'unknown');

  // Extract project
  const projectLabel = bead.labels?.find((l: string) => l.startsWith('project:'));
  const project = bead.project || (projectLabel ? projectLabel.replace('project:', '') : getProjectFromId(bead.id));

  return {
    id: bead.id,
    title: bead.title,
    description: bead.description || '',
    status: statusMap[bead.status] || 'todo',
    priority: priorityMap[bead.priority] || 'medium',
    agentCodeName,
    project,
    createdAt: bead.created_at || bead.createdAt || new Date().toISOString(),
    updatedAt: bead.updated_at || bead.updatedAt || new Date().toISOString(),
    isFromKV: true,
  };
}

/**
 * Auto-detect project from bead ID prefix
 */
function getProjectFromId(id: string): string {
  if (id.startsWith('clawd-')) return 'clawd';
  if (id.startsWith('stacean-')) return 'stacean-repo';
  if (id.startsWith('personal-')) return 'personal-life';
  return 'general';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');

    // Get IDs from sets (new architecture)
    const taskIds: string[] =
      project && project !== 'all'
        ? await kv.smembers(`beads:project:${project}`)
        : await kv.smembers('beads:all');

    if (!taskIds || taskIds.length === 0) {
      // Fallback for old architecture (direct list)
      const oldBeads = await kv.get<RawBead[]>('beads:all');
      if (oldBeads && Array.isArray(oldBeads)) {
        return NextResponse.json({
          tasks: oldBeads.map(transformBeadToTask),
          source: 'kv-compat',
          count: oldBeads.length
        });
      }
      return NextResponse.json({ tasks: [], source: 'kv', count: 0 });
    }

    // Fetch all task data using pipeline (prefer performance)
    const pipeline = kv.pipeline();
    taskIds.forEach(id => pipeline.hgetall(`beads:task:${id}`));
    const results = await pipeline.exec();

    // Filter, transform and normalize
    const tasks = (results || [])
      .filter((t): t is RawBead => t !== null)
      .map(transformBeadToTask);

    return NextResponse.json({
      tasks,
      source: 'kv-pipeline',
      count: tasks.length,
      project: project || 'all',
    });
  } catch (error) {
    console.error('KV Tasks API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch tasks',
      tasks: [],
      source: 'error'
    }, { status: 500 });
  }
}
