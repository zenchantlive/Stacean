// Beads Agent Session Type (extended with agent_state)
// Adds agent_state, last_activity from Beads native fields

export interface BeadsAgentIssue {
  id: string;
  title: string;
  description?: string;
  design?: string;
  acceptance_criteria?: string;
  notes?: string;
  status: BeadsStatus;
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
  // Beads native agent fields
  agent_state?: 'idle' | 'spawning' | 'running' | 'working' | 'stuck' | 'done' | 'stopped' | 'dead';
  last_activity?: string;
}

export type BeadsStatus =
  | 'open'
  | 'in_progress'
  | 'blocked'
  | 'deferred'
  | 'closed'
  | 'todo'
  | 'review'
  | 'done'; // Custom statuses

export type BeadsIssueType =
  | 'task'
  | 'bug'
  | 'feature'
  | 'epic'
  | 'chore'
  | 'agent'; // Agent type for tracking

export interface BeadsDependency {
  issue_id: string;
  depends_on_id: string;
  type: string;
  created_at: string;
  created_by?: string;
}
