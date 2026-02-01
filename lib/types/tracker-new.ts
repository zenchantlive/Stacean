// ============================================================================
// Task Tracker Types — Beads-Aligned Status Scheme
// ============================================================================

/**
 * Task status matching Beads wire format
 * - open: Task is ready to be worked on
 * - in_progress: Currently being worked on
 * - review: Ready for review/feedback
 * - done: Completed
 * - tombstone: Archived/removed from active view
 */
export type TaskStatus = 'open' | 'in_progress' | 'review' | 'done' | 'tombstone';

/**
 * Task priority matching Beads numeric priority
 * Mapped to KV strings for API consistency
 */
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * Task display labels (prettified UI labels)
 */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  tombstone: 'Tombstone',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/**
 * Priority to Beads numeric mapping
 */
export const PRIORITY_TO_BEADS: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const BEADS_TO_PRIORITY: Record<number, TaskPriority> = {
  0: 'urgent',
  1: 'high',
  2: 'medium',
  3: 'low',
};

/**
 * Status to Beads mapping (already aligned)
 */
export const STATUS_TO_BEADS: Record<TaskStatus, string> = {
  open: 'open',
  in_progress: 'in_progress',
  review: 'review',
  done: 'done',
  tombstone: 'tombstone',
};

export const BEADS_TO_STATUS: Record<string, TaskStatus> = {
  open: 'open',
  in_progress: 'in_progress',
  review: 'review',
  done: 'done',
  tombstone: 'tombstone',
};

// ============================================================================
// Task Interface
// ============================================================================

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
  agentCodeName?: string; // "Atlas_XXX"
  project?: string; // Single project per task (e.g., "clawd", "asset-hatch")
  parentId?: string; // For hierarchical objectives
  context: TaskContext;
  currentAction?: string; // Last heartbeat action
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Task Creation Input
// ============================================================================

export interface CreateTaskInput {
  title: string;
  description: string; // Required (not optional)
  priority?: TaskPriority; // Default: medium
  project?: string; // Required
  parentId?: string; // Optional - if set, this is a child/subtask
  assignedTo?: string;
  agentCodeName?: string;
  isObjective?: boolean; // If true, this is a parent task
}

// ============================================================================
// Task Update Input
// ============================================================================

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  parentId?: string;
  project?: string;
  context?: Partial<TaskContext>;
}

// ============================================================================
// Agent Types
// ============================================================================

export type AgentStatus = 'idle' | 'working' | 'error' | 'done';

export interface AgentContext {
  currentTaskId?: string;
  spawnedBy?: string;
  logs: string[];
}

export interface AgentSession {
  id: string;
  codeName: string; // "Atlas_XXX"
  initials: string;
  currentTaskId?: string;
  status: AgentStatus;
  currentAction?: string;
  context: AgentContext;
  heartbeat: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// View Types
// ============================================================================

export type ViewType = 'objective-stack' | 'agent-lens' | 'energy-map' | 'search';

export interface ViewConfig {
  id: ViewType;
  label: string;
  icon: string;
  description?: string;
}

export const VIEWS: Record<ViewType, ViewConfig> = {
  'objective-stack': {
    id: 'objective-stack',
    label: 'Objectives',
    icon: 'Layers',
    description: 'Hierarchical objective planning with parent/child tasks',
  },
  'agent-lens': {
    id: 'agent-lens',
    label: 'Agents',
    icon: 'Bot',
    description: 'Real-time view of active agents and their current tasks',
  },
  'energy-map': {
    id: 'energy-map',
    label: 'Energy',
    icon: 'Zap',
    description: 'Prioritize by energy bands derived from task priority',
  },
  'search': {
    id: 'search',
    label: 'Search',
    icon: 'Search',
    description: 'Search and filter tasks',
  },
};

// ============================================================================
// Filter Types
// ============================================================================

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  project?: string[];
  assignedTo?: string[];
  parentId?: string | null; // Filter by parent (null = top-level only)
}

// ============================================================================
// Energy Band Types
// ============================================================================

export type EnergyBand = 'intense' | 'focused' | 'light';

export interface EnergyBandConfig {
  id: EnergyBand;
  label: string;
  description: string;
  color: string;
  priorities: TaskPriority[];
}

export const ENERGY_BANDS: Record<EnergyBand, EnergyBandConfig> = {
  intense: {
    id: 'intense',
    label: 'Intense',
    description: 'High-urgency work requiring full attention',
    color: '#b46b4f', // ember
    priorities: ['urgent', 'high'],
  },
  focused: {
    id: 'focused',
    label: 'Focused',
    description: 'Medium-priority work',
    color: '#8ea89e', // sage
    priorities: ['medium'],
  },
  light: {
    id: 'light',
    label: 'Light',
    description: 'Low-priority work, good for breaks',
    color: '#6fa5a2', // teal
    priorities: ['low'],
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get energy band from task priority
 */
export function getEnergyBand(priority: TaskPriority): EnergyBand {
  for (const [band, config] of Object.entries(ENERGY_BANDS)) {
    if (config.priorities.includes(priority)) {
      return band as EnergyBand;
    }
  }
  return 'light';
}

/**
 * Check if a task is an objective (has children)
 */
export function isObjective(task: Task, allTasks: Task[]): boolean {
  return allTasks.some(t => t.parentId === task.id);
}

/**
 * Get child tasks for a parent objective
 */
export function getChildTasks(parentId: string, allTasks: Task[]): Task[] {
  return allTasks.filter(t => t.parentId === parentId);
}

/**
 * Check if a parent is ready (all blocking children are done)
 */
export function isParentReady(parentId: string, allTasks: Task[]): boolean {
  const children = getChildTasks(parentId, allTasks);
  if (children.length === 0) return true;
  return children.every(t => t.status === 'done');
}

/**
 * Get top-level objectives (tasks without parentId)
 */
export function getTopLevelObjectives(allTasks: Task[]): Task[] {
  return allTasks.filter(t => !t.parentId && t.status !== 'tombstone');
}
