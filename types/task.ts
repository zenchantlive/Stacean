export type TaskStatus =
  | 'todo'
  | 'assigned'
  | 'in_progress'
  | 'needs-you'
  | 'ready'
  | 'review'
  | 'shipped'
  | 'deleted';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

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
