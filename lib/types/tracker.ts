// Shared types for Task Tracker (Frontend + Backend)

// ============================================================================
// Tasks
// ============================================================================

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskContext {
  files: string[];
  logs: string[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string; // Agent Session ID or 'JORDAN'
  agentCodeName?: string; // "Neon-Hawk"
  parentId?: string;
  context: TaskContext;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Agents
// ============================================================================

export type AgentStatus = 'idle' | 'working' | 'error' | 'done';

export interface AgentContext {
  currentTaskId?: string;
  spawnedBy?: string;
  logs: string[];
}

export interface AgentSession {
  id: string;
  codeName: string;
  initials: string;
  currentTaskId?: string;
  status: AgentStatus;
  currentAction?: string;
  context: AgentContext;
  heartbeat: number;
  createdAt: number;
  updatedAt: number;
}
