# Stacean v2.0 PRD

**Version:** 2.0  
**Status:** Draft  
**Last Updated:** 2026-02-03  

---

## 1. Current State (What We Have)

### 1.1 Architecture
- Next.js dashboard with 4 views: Objectives, Agents, Energy, Live
- Mobile-first design with bottom nav
- 5-second polling for all updates
- In-memory task storage via tracker API

### 1.2 Task System
- **5 static status columns:** TODO, ACTIVE, NEEDS YOU, READY, SHIPPED
- No drag-and-drop
- Task cards show: title, description, agent, priority, timestamp
- No task detail view (only card)

### 1.3 What's Missing
- No real-time updates
- No activity audit trail
- No sub-agent tracking
- No task detail modal
- No search/filter
- No delete functionality

---

## 2. Desired State (What We Want)

### 2.1 Real-Time Updates
- Server-Sent Events (SSE) for instant updates
- No polling, no refresh needed
- Live agent status changes

### 2.2 Interactive Kanban
- **7 workflow columns:** TODO, ASSIGNED, IN PROGRESS, NEEDS YOU, READY, REVIEW, SHIPPED
- Drag-and-drop on desktop
- Touch-friendly status change on mobile (long-press → modal → dropdown)
- Optimistic UI (updates instantly)

### 2.3 Task Details
- Click task → modal with tabs:
  - **Overview:** Edit title, description, status, priority, assignee
  - **Activity:** Complete audit trail (who did what, when)
  - **Sub-Agents:** Register agents working on this task
  - **Deliverables:** Files/URLs created

### 2.4 Activity Logging
- SQLite database for persistence
- API to log: created, assigned, status_changed, completed
- Query activity by task ID
- Auto-archive activities > 90 days

### 2.5 Search & Filter
- Search tasks by title/description
- Filter by status, priority, agent

### 2.6 Delete
- Soft-delete (status: `deleted`) to preserve activity trail

---

## 3. The Gap (What Changes)

| Current | → | Desired |
|---------|---|---------|
| In-memory storage | → | SQLite + in-memory cache |
| 5s polling | → | SSE (instant) |
| 5 static columns | → | 7 drag-drop columns |
| No task detail | → | Modal with 4 tabs |
| No activity log | → | SQLite + API + UI |
| No sub-agent tracking | → | Register per task |
| No search | → | Search + filter |
| No delete | → | Soft-delete |

---

## 4. User Stories

| As a... | I want to... | So that... |
|---------|-------------|------------|
| User | see agent activity instantly | I don't have to refresh |
| User | drag tasks between columns | I can reorganize intuitively |
| User | click a task and see its history | I understand what happened |
| User | search for tasks by name | I can find specific work |
| User | soft-delete unwanted tasks | I clean up without losing history |
| Agent | log my activities automatically | Jordan sees my progress |
| Agent | register sub-agents per task | tracking is clear |

---

## 5. Data Model

### Task
```typescript
{
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'assigned' | 'active' | 'in_progress' | 'needs-you' | 'ready' | 'review' | 'shipped' | 'deleted';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedAgentId?: string;
  agentCodeName?: string;
  project?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;  // Soft delete
}
```

### TaskActivity (New - SQLite)
```typescript
{
  id: string;
  taskId: string;
  agentId?: string;
  type: 'created' | 'assigned' | 'status_changed' | 'comment' | 'file_created' | 'completed' | 'deleted';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

### TaskSubAgent (New - SQLite)
```typescript
{
  id: string;
  taskId: string;
  agentId: string;
  openclawSessionId: string;
  startedAt: string;
  endedAt?: string;
}
```

### TaskDeliverable (New - SQLite)
```typescript
{
  id: string;
  taskId: string;
  type: 'file' | 'url' | 'artifact';
  title: string;
  path?: string;
  description?: string;
  createdAt: string;
}
```

---

## 6. API Endpoints

### New: SSE Events Stream
```
GET /api/events/stream

Event Types:
- task.created
- task.updated
- task.deleted
- activity.logged
- agent.spawned
- agent.completed
```

### New: Task Activities
```
GET /api/tasks/[id]/activities
POST /api/tasks/[id]/activities
```

### New: Sub-Agents
```
GET /api/tasks/[id]/subagents
POST /api/tasks/[id]/subagents
DELETE /api/tasks/[id]/subagents/[subagentId]
```

### New: Deliverables
```
GET /api/tasks/[id]/deliverables
POST /api/tasks/[id]/deliverables
```

### Modified: Tasks
```
GET /api/tracker/tasks
POST /api/tracker/tasks
PATCH /api/tracker/tasks/[id]  // Now handles status transitions
DELETE /api/tracker/tasks/[id]  // Soft delete
```

---

## 7. Backward Compatibility

### Column Mapping
When upgrading from v1 to v2:
| v1 Status | v2 Status | Notes |
|-----------|-----------|-------|
| todo | todo | Same |
| active | in_progress | Renamed |
| needs-you | needs-you | Same |
| ready | ready | Same |
| shipped | shipped | Same |
| (new) | assigned | Starts empty |
| (new) | review | Starts empty |

### Migration Strategy
1. Add new columns to UI (hidden by default)
2. When any task moves, show new columns
3. Full migration on first interaction

---

## 8. Conflict Resolution

### Strategy: Last Write Wins
- Optimistic UI updates immediately
- Server accepts last write
- No locking for simplicity

### Future Enhancement: Version Numbers
```typescript
{
  id: string;
  title: string;
  status: string;
  version: number;  // Increment on each update
}
```

---

## 9. Activity Log Retention

- **Active tasks:** Full activity history
- **Archived tasks (>90 days):** Summarize to 5 events, full detail on demand
- **Deleted tasks:** Keep activity, hide from main view

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] SQLite setup and migrations
- [ ] SSE endpoint `/api/events/stream`
- [ ] Client EventSource integration
- [ ] Activity logging API
- [ ] Auto-reconnect with backoff

### Phase 2: Kanban (Week 2)
- [ ] Add columns: ASSIGNED, IN_PROGRESS, REVIEW
- [ ] @hello-pangea/dnd for desktop
- [ ] Mobile: long-press → modal → status dropdown
- [ ] Optimistic UI updates
- [ ] TaskModal with tabs

### Phase 3: Search & Sub-Agents (Week 3)
- [ ] Search bar in modal
- [ ] Filter chips (status, priority, agent)
- [ ] Sub-agent registration API
- [ ] Deliverables API
- [ ] Soft-delete functionality

---

## 11. UI Components

### New Components
- `KanbanBoard` - Main container
- `KanbanColumn` - Column with drop zone
- `DraggableTaskCard` - Task with drag handle
- `TaskModal` - Detail view with tabs:
  - `OverviewTab`
  - `ActivityTab`
  - `SubAgentsTab`
  - `DeliverablesTab`
- `ActivityItem` - Single activity row
- `StatusDropdown` - Mobile-friendly status change
- `SearchFilter` - Search and filter bar

### Modified Components
- `ObjectivesView` → Replace static columns with KanbanBoard
- `TasksPage` → Add TaskModal with tabs
- `TaskCard` → Add drag handle, expand for modal

---

## 12. Dependencies
- `@hello-pangea/dnd` - Drag and drop (desktop)
- `better-sqlite3` - SQLite database

---

## 13. Success Metrics
- SSE latency < 100ms
- Drag-drop works on desktop
- Mobile status change in 2 taps
- Activity log shows complete history
- Page load < 500ms
- Search returns results < 200ms

---

## 14. Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mobile DnD flaky | High | Use modal + dropdown instead |
| Activity table grows huge | Medium | Auto-archive > 90 days |
| Concurrent edits | Low | Last-write-wins for now |
| Migration breaks tasks | High | Test on staging first |
| SSE connection drops | Medium | Auto-reconnect with backoff |

---

## 15. Open Questions

1. **Should we use a separate activity database or merge with main DB?**
2. **Do we need real-time collaboration (OT) or is last-write-wins sufficient?**
3. **Should sub-agents auto-register or require manual registration?**