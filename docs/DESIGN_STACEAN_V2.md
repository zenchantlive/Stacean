# Stacean v2: Design Document

**Version:** 2.0  
**Status:** Draft  
**Last Updated:** 2026-02-03  
**Related PRD:** PRD_STACEAN_V2.md

---

## 1. Design Principles

### Core Philosophy
- **Mobile-first:** Every component works on touch devices
- **Speed-first:** < 100ms for all interactions
- **Clarity-first:** Clear visual hierarchy, no clutter
- **Consistency-first:** Reuse existing design tokens

### Design System

#### Color Palette
```css
/* Backgrounds */
--bg-primary: #09090B;    /* Main background */
--bg-secondary: #18181B;  /* Cards, modals */
--bg-tertiary: #27272A;   /* Inputs, borders */

/* Accent */
--accent: #F97316;        /* Primary action color */
--accent-hover: #EA580C;
--accent-light: rgba(249, 115, 22, 0.15);

/* Status Colors */
--status-online: #22C55E;
--status-offline: #EF4444;
--status-warning: #F59E0B;

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #A1A1AA;
--text-muted: #71717A;
```

#### Typography
```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Scale */
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
```

#### Spacing
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;       /* 16px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
```

---

## 2. Component Architecture

### File Structure

```
components/
├── layout/
│   ├── Sidebar.tsx
│   ├── MobileNav.tsx
│   ├── Header.tsx
│   └── MobileSidebar.tsx
├── views/
│   ├── ObjectivesView.tsx    /* Kanban board */
│   ├── AgentsView.tsx
│   ├── EnergyView.tsx
│   └── LiveView.tsx
├── kanban/
│   ├── KanbanBoard.tsx
│   ├── KanbanColumn.tsx
│   └── TaskCard.tsx
├── tasks/
│   ├── TaskModal.tsx        /* Task detail with tabs */
│   ├── TaskForm.tsx
│   └── TaskActivityTab.tsx
└── common/
    ├── StatusDot.tsx
    ├── PriorityBadge.tsx
    └── LoadingSpinner.tsx
```

---

## 3. Views

### 3.1 Objectives View (Kanban)

#### Desktop
```
┌─────────────────────────────────────────────────────────────────────┐
│  Sidebar  │  Objectives                                             │
│  ───────  │                                                        │
│            │  ┌─────────────────────────────────────────────────┐   │
│  [Logo]   │  │  Pipeline Stats                                  │   │
│  Atlas    │  │  [TODO:5] [ACTIVE:2] [NEEDS:1] [READY:3] [DONE:8]│   │
│  ───────  │  └─────────────────────────────────────────────────┘   │
│            │                                                        │
│  ● Obj    │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  ○ Agents │  │  TODO  │ │ ASSIGN │ │  WIP   │ │ REVIEW │       │
│  ○ Energy │  │  (5)   │ │  (2)   │ │  (1)   │ │  (0)   │       │
│  ○ Live   │  ├────────┤ ├────────┤ ├────────┤ ├────────┤       │
│            │  │ Task 1 │ │ Task A │ │ Task X │ │        │       │
│            │  │ Task 2 │ │ Task B │ │        │ │        │       │
│            │  │ Task 3 │ │        │ │        │ │        │       │
│            │  └────────┘ └────────┘ └────────┘ └────────┘       │
│            │                                                        │
│  ───────  │                                                        │
│  ● Online │  [Create Task +]  [+ Add Column v]                     │
│  Idle     │                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Mobile
```
┌─────────────────────────┐
│  Atlas    [Menu] ☰    │  ← Fixed header
├─────────────────────────┤
│                         │
│  [TODO:5] [ACTIVE:2]   │  ← Horizontal scroll stats
│  [NEEDS:1] [READY:3]   │
│                         │
│  ┌───────────────────┐  │
│  │  TODO            │  │
│  │  ─────────────   │  │
│  │  ● Task 1       │  │  ← Stacked cards (no drag)
│  │  ● Task 2       │  │
│  │  ● Task 3       │  │
│  │                  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  ASSIGNED         │  │
│  │  ─────────────    │  │
│  │  ● Task A        │  │
│  │                  │  │
│  └───────────────────┘  │
│                         │
├─────────────────────────┤
│ [Obj] [Agents] [Energy] │  ← Bottom nav (fixed)
│                         │
└─────────────────────────┘
```

### 3.2 Task Modal (New)

```
┌─────────────────────────────────────────┐
│  Task: Build authentication system      │
│  ─────────────────────────────────     │
│                                         │
│  [Overview] [Activity] [Deliverables]  │  ← Tab bar
│  ─────────────────────────────────     │
│                                         │
│  Overview Tab:                          │
│  ┌─────────────────────────────────┐   │
│  │ Title:                          │   │
│  │ Build authentication system      │   │
│  │                                 │   │
│  │ Description:                    │   │
│  │ Implement JWT auth with...       │   │
│  │                                 │   │
│  │ Status: [IN_PROGRESS v]         │   │
│  │ Priority: [URGENT v]            │   │
│  │ Assignee: [Charlie v]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Cancel]                    [Save]    │
└─────────────────────────────────────────┘
```

#### Activity Tab
```
┌─────────────────────────────────────────┐
│  Task: Build authentication system      │
│  ─────────────────────────────────     │
│                                         │
│  [Overview] [Activity] [Deliverables]  │  ← Active: Activity
│  ─────────────────────────────────     │
│                                         │
│  ● Charlie moved to IN_PROGRESS        │
│    2 hours ago                         │
│                                         │
│  ● Jordan assigned to Charlie          │
│    3 hours ago                         │
│                                         │
│  ● Task created by Jordan             │
│    Yesterday                           │
│                                         │
│  [Cancel]                    [Save]    │
└─────────────────────────────────────────┘
```

---

## 4. Components

### 4.1 KanbanColumn

```tsx
interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
}

function KanbanColumn({ status, title, tasks, color, onDrop }: KanbanColumnProps) {
  const [{ isDraggingOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (task: Task) => onDrop(task.id, status),
    collect: (monitor) => ({
      isDraggingOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`column ${isDraggingOver ? 'highlight' : ''}`}
    >
      <div className="column-header" style={{ borderTopColor: color }}>
        <span className="column-title">{title}</span>
        <span className="column-count">{tasks.length}</span>
      </div>
      
      <div className="column-content">
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

### 4.2 TaskCard

```tsx
interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const priorityColors = {
    urgent: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500',
  };

  return (
    <div
      draggable
      onClick={onClick}
      className={`task-card ${priorityColors[task.priority]} ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="task-header">
        <span className="task-title">{task.title}</span>
        <PriorityBadge priority={task.priority} />
      </div>
      
      {task.agentCodeName && (
        <div className="task-meta">
          <AgentTag name={task.agentCodeName} />
        </div>
      )}
      
      <div className="task-footer">
        <StatusIndicator status={task.status} />
        <RelativeTime timestamp={task.updatedAt} />
      </div>
    </div>
  );
}
```

### 4.3 ActivityItem

```tsx
interface ActivityItemProps {
  activity: TaskActivity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const activityIcons = {
    created: '➕',
    assigned: '👤',
    status_changed: '🔄',
    completed: '✅',
    comment: '💬',
    file_created: '📎',
  };

  return (
    <div className="activity-item">
      <span className="activity-icon">
        {activityIcons[activity.type]}
      </span>
      <div className="activity-content">
        <p className="activity-message">{activity.message}</p>
        <time className="activity-time">
          {formatRelativeTime(activity.createdAt)}
        </time>
      </div>
    </div>
  );
}
```

---

## 5. Real-Time Updates

### SSE Connection State

```
┌─────────────────────────────────────────────────────────┐
│  Connection States:                                      │
│                                                         │
│  ● Connecting...    (yellow pulse)                       │
│  ● Connected       (green solid)                        │
│  ● Reconnecting    (yellow pulse, auto)                 │
│  ● Disconnected    (red)                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Event Handling Flow

```
User Action          →  Optimistic Update  →  API Call
     │                      │                   │
     ▼                      ▼                   ▼
UI updates         Store updated           Background
immediately        immediately              sync
     │                      │                   │
     └──────────────────────┼───────────────────┘
                            │
                            ▼
                    SSE Event Received
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          Task updated  Task deleted  Activity logged
              │             │             │
              └─────────────┴─────────────┘
                            │
                            ▼
                    Store updated
```

---

## 6. Mobile Considerations

### Touch Targets
```css
/* Minimum touch target: 44x44px */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Spacing between interactive elements */
.touch-spacing {
  gap: var(--space-3);  /* 12px minimum */
}
```

### Mobile Interactions (Tap, Not Drag)

Since `@hello-pangea/dnd` has known issues on touch devices, mobile uses a different interaction pattern:

```tsx
// Mobile: Tap to open modal, use dropdown to change status
function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div onClick={onClick} className="task-card">
      {/* Long-press not needed - just tap to open */}
      <span className="task-title">{task.title}</span>
      {/* Status badge shows current status */}
      <StatusBadge status={task.status} />
    </div>
  );
}

// In TaskModal - Status dropdown for mobile
function StatusDropdown({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="todo">TODO</option>
      <option value="assigned">ASSIGNED</option>
      <option value="in_progress">IN PROGRESS</option>
      <option value="needs-you">NEEDS YOU</option>
      <option value="ready">READY</option>
      <option value="review">REVIEW</option>
      <option value="shipped">SHIPPED</option>
    </select>
  );
}
```

**Mobile UX Flow:**
1. Tap task card → Opens TaskModal
2. Tap "Status" field → Shows dropdown
3. Select new status → Auto-saves, closes modal
4. Toast notification: "Task moved to IN PROGRESS"

**Desktop UX Flow:**
1. Drag task card → Drop on new column
2. Auto-saves
3. Toast notification: "Task moved to IN PROGRESS"

### Offline Indicator
```
┌─────────────────────────┐
│  Atlas    [Offline v]   │  ← Shows when disconnected
│  ────────────────────   │
│                         │
│  Changes will sync when │
│  you're back online.    │
│                         │
│  [Retry Now]            │
└─────────────────────────┘
```

---

## 7. Animations

### Transitions
```css
/* Smooth state changes */
.task-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Column highlight on drag */
.column.highlight {
  background: rgba(249, 115, 22, 0.05);
  transition: background 0.2s ease;
}

/* Modal appearance */
.modal {
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 8. Accessibility

### ARIA Labels
```tsx
<button
  aria-label="Create new task"
  aria-describedby="create-task-help"
>
  <PlusIcon />
</button>
<span id="create-task-help" class="sr-only">
  Opens a form to create a new task
</span>
```

### Keyboard Navigation
- `Tab` moves between interactive elements
- `Enter` / `Space` activates buttons
- `Arrow keys` navigate kanban cards
- `Escape` closes modals

### Screen Reader
- Task cards announce priority and status
- Activity items announce action and time
- Status changes are announced via live region

---

## 9. Responsive Breakpoints

```css
/* Base: Mobile first */
.task-card { /* styles */ }

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .kanban {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .kanban {
    display: flex;
    gap: var(--space-4);
  }
  
  .sidebar {
    display: flex;
  }
}

/* Large: 1400px+ */
@media (min-width: 1400px) {
  .kanban {
    justify-content: center;
  }
}
```

---

## 10. Performance

### Optimization Strategies

| Strategy | Implementation |
|----------|----------------|
| Virtualization | Use `react-window` for large task lists |
| Code splitting | Lazy load modals and detail views |
| Image optimization | Lazy load avatars with placeholders |
| Bundle size | Tree-shaking, remove unused deps |
| Caching | SWR for server state |

### Metrics Targets
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **First paint:** < 500ms

---

## 11. Testing Strategy

### Visual Regression
- Screenshot testing with Playwright
- Percy or Chromatic for CI integration

### Component Tests
```tsx
// TaskCard.test.tsx
describe('TaskCard', () => {
  it('displays priority badge correctly', () => {
    render(<TaskCard task={urgentTask} />);
    expect(screen.getByText('URGENT')).toHaveClass('bg-red-500');
  });
  
  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<TaskCard task={task} onClick={onClick} />);
    fireEvent.click(screen.getByText(task.title));
    expect(onClick).toHaveBeenCalledWith(task.id);
  });
});
```

### E2E Tests
- User flows: Create task, drag to column, open modal
- Mobile: Touch interactions, responsive layouts
- Offline: Network throttling tests

---

## 12. Appendix

### A. Component Checklist

- [ ] KanbanBoard
- [ ] KanbanColumn
- [ ] TaskCard (draggable)
- [ ] TaskModal (with tabs)
- [ ] TaskActivityTab
- [ ] Sidebar (desktop)
- [ ] MobileNav (bottom)
- [ ] StatusDot
- [ ] PriorityBadge
- [ ] LoadingSpinner

### B. Color Reference

| Usage | Color | Hex |
|-------|-------|-----|
| Primary bg | #09090B | zinc-950 |
| Secondary bg | #18181B | zinc-900 |
| Accent | #F97316 | orange-500 |
| Success | #22C55E | green-500 |
| Warning | #F59E0B | amber-500 |
| Error | #EF4444 | red-500 |

### C. Icon Set
Uses `lucide-react` icons:
- Activity, Bot, CheckSquare, Layers, Zap, ChevronRight/Left
- Plus, Calendar, Clock, User, FileText
