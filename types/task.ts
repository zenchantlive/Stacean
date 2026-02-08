// 6-status workflow: TODO → IN_PROGRESS → NEEDS_YOU → REVIEW → READY → SHIPPED
export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'needs-you'
  | 'review'
  | 'ready'
  | 'shipped';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  label: string;
  emoji?: string;
  color?: string;
}

export interface TaskActivity {
  id: string;
  timestamp: string;
  type: 'created' | 'status_changed' | 'priority_changed' | 'description_updated' | 'assigned' | 'comment';
  details: string;
  userId?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId?: string;
  agentCodeName?: string;
  assignedTo?: string;
  project?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  activities?: TaskActivity[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedTo?: string;
  agentCodeName?: string;
  project?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  agentCodeName?: string;
  project?: string;
  activities?: TaskActivity[];
}
