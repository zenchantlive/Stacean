// Beads Tasks API - Fetch Beads and convert to Stacean task format
// GET /api/tracker/beads - List all beads as tasks

import { NextRequest, NextResponse } from 'next/server';
import { listIssues } from '@/lib/integrations/beads/client';
import type { BeadsIssue } from '@/lib/integrations/beads/mapper';

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
  isFromBeads: true;
}

/**
 * Transform Bead issue to Stacean task format
 */
function transformBeadToTask(bead: BeadsIssue): BeadTask {
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
    isFromBeads: true,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Skip on Vercel (Beads CLI not available)
    if (process.env.VERCEL) {
      return NextResponse.json({ 
        error: 'Beads not available on Vercel',
        tasks: [],
        source: 'vercel'
      }, { status: 200 });
    }

    // Fetch all beads/issues
    const beads = await listIssues();

    // Transform to Stacean task format
    const tasks: BeadTask[] = beads.map(transformBeadToTask);

    // Filter by project if query param provided
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');

    let filteredTasks = tasks;
    if (project && project !== 'all') {
      filteredTasks = tasks.filter(t => t.project === project);
    }

    return NextResponse.json({
      tasks: filteredTasks,
      source: 'beads',
      count: filteredTasks.length,
    });
  } catch (error) {
    console.error('API Error (GET /beads):', error);
    return NextResponse.json({ 
      error: 'Failed to fetch beads',
      tasks: [],
      source: 'error'
    }, { status: 500 });
  }
}
