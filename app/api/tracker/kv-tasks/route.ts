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
  priority: number;
  labels?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Transform KV bead to Stacean task format
 */
function transformBeadToTask(bead: RawBead): BeadTask {
  // Map Beads status to Stacean status
  const statusMap: Record<string, BeadTask['status']> = {
    'open': 'todo',
    'in_progress': 'in_progress',
    'agent_working': 'in_progress',
    'needs_jordan': 'needs-you',
    'ready_to_commit': 'ready',
    'in_review': 'review',
    'pushed': 'shipped',
  };

  // Map Beads priority (0-3) to Stacean priority
  const priorityMap: Record<number, BeadTask['priority']> = {
    0: 'urgent',
    1: 'high',
    2: 'medium',
    3: 'low',
  };

  // Extract agent code name from labels (format: "agent:Bro")
  const agentLabel = bead.labels?.find((l: string) => l.startsWith('agent:'));
  const agentCodeName = agentLabel ? agentLabel.replace('agent:', '') : 'unknown';

  // Extract project from labels (format: "project:stacean-repo")
  const projectLabel = bead.labels?.find((l: string) => l.startsWith('project:'));
  const project = projectLabel ? projectLabel.replace('project:', '') : 'general';

  return {
    id: bead.id,
    title: bead.title,
    description: bead.description || '',
    status: statusMap[bead.status] || 'todo',
    priority: priorityMap[bead.priority] || 'medium',
    agentCodeName,
    project,
    createdAt: bead.created_at,
    updatedAt: bead.updated_at,
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
    // Get project filter from query params
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');

    let beads: RawBead[] = [];

    if (project && project !== 'all') {
      // Fetch from project-specific key
      const projectKey = `beads:${project}`;
      beads = await kv.get(projectKey) || [];
    } else {
      // Fetch all beads
      beads = await kv.get('beads:all') || [];
    }

    // Transform to Stacean task format
    const tasks: BeadTask[] = beads.map((bead: RawBead) => {
      // Auto-add project from ID if not in labels
      if (!bead.labels?.some(l => l.startsWith('project:'))) {
        const detectedProject = getProjectFromId(bead.id);
        bead.labels = bead.labels || [];
        bead.labels.push(`project:${detectedProject}`);
      }
      return transformBeadToTask(bead);
    });

    return NextResponse.json({
      tasks,
      source: 'kv',
      count: tasks.length,
      project: project || 'all',
    });
  } catch (error) {
    console.error('API Error (GET /kv-tasks):', error);
    return NextResponse.json({ 
      error: 'Failed to fetch from KV',
      tasks: [],
      source: 'error'
    }, { status: 500 });
  }
}
