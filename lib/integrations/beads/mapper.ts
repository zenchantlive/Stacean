// Beads Integration - Issue Mapper
// Converts between Beads Issue format and Fleet Commander Task format

import type { Task, TaskStatus, TaskPriority } from '../../types/tracker';

// ============================================================================
// Project Configuration
// ============================================================================

export const PROJECT_PREFIXES: Record<string, { name: string; url?: string }> = {
  'clawd': { name: 'Atlas Cockpit', url: 'http://localhost:3000' },
  'asset': { name: 'Asset-Hatch', url: 'https://asset-hatch.vercel.app' },
  'catwalk': { name: 'Catwalk Live', url: 'https://catwalk.live' },
  'feed': { name: 'TheFeed', url: 'https://the-feed.vercel.app' },
};

/**
 * Extract project prefix from issue ID (e.g., "clawd-abc123" -> "clawd")
 */
function extractProject(issueId: string): string {
  const prefix = issueId.split('-')[0];
  return PROJECT_PREFIXES[prefix] ? prefix : 'clawd';
}

export type BeadsIssueType =
  | 'task'
  | 'bug'
  | 'feature'
  | 'epic'
  | 'chore';

export type BeadsAgentState =
  | 'idle'
  | 'spawning'
  | 'running'
  | 'working'
  | 'stuck'
  | 'done'
  | 'stopped'
  | 'dead';


export interface BeadsDependency {
  issue_id: string;
  depends_on_id: string;
  type: string;
}

export interface BeadsIssue {
  id: string;
  title: string;
  description?: string;
  design?: string;
  acceptance_criteria?: string;
  notes?: string;
  status: 'open' | 'in_progress' | 'done' | 'blocked' | 'closed';
  priority: number;
  issue_type: BeadsIssueType;
  assignee?: string;
  owner?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
  closed_at?: string;
  labels?: string[];
  dependencies?: BeadsDependency[];
  agent_state?: BeadsAgentState;
  last_activity?: string;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert a Beads Issue to a Fleet Commander Task
 */
export function beadToTask(bead: BeadsIssue): Task {
  return {
    id: bead.id,
    title: bead.title,
    description: bead.description || bead.notes,
    status: mapBeadStatusToTaskStatus(bead.status),
    priority: mapBeadPriorityToTaskPriority(bead.priority),
    assignedTo: bead.assignee || 'JORDAN',
    agentCodeName: bead.labels?.find(l => l.startsWith('agent:'))?.replace('agent:', ''),
    project: extractProject(bead.id),
    currentAction: bead.last_activity || undefined,
    context: {
      files: [],
      logs: [],
    },
    createdAt: new Date(bead.created_at).getTime(),
    updatedAt: new Date(bead.updated_at).getTime(),
  };
}

/**
 * Convert Fleet Commander Task inputs to Beads Issue parameters
 */
export function taskToBead(task: {
  title: string;
  description?: string;
  priority: number;
  assignee?: string;
  agentCodeName?: string;
}): {
  title: string;
  description?: string;
  priority: number;
  issue_type: BeadsIssueType;
  status: string;
  labels?: string[];
} {
  const labels: string[] = [];
  if (task.agentCodeName) {
    labels.push(`agent:${task.agentCodeName}`);
  }

  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    issue_type: 'task',
    status: 'open',
    labels: labels.length > 0 ? labels : undefined,
  };
}

// ============================================================================
// Helper Mappers
// ============================================================================

function mapBeadStatusToTaskStatus(status: BeadsIssue['status']): TaskStatus {
  const statusMap: Record<BeadsIssue['status'], TaskStatus> = {
    'open': 'todo',
    'in_progress': 'in-progress',
    'done': 'done',
    'blocked': 'in-progress',
    'closed': 'done',
  };
  return statusMap[status] || 'todo';
}

function mapBeadPriorityToTaskPriority(priority: number): TaskPriority {
  if (priority === 0) return 'urgent';
  if (priority === 1) return 'high';
  if (priority === 2) return 'medium';
  if (priority === 3) return 'low';
  return 'medium';
}
