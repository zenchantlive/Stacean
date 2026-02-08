# Task Tracker UI Reference

This document describes the Command Center dashboard UI and its components.

## Dashboard URL

- **Production**: https://stacean.vercel.app
- **Local**: http://localhost:3000

## Main Page Views (`/`)

The main page has 4 switchable views:

### 1. Objectives View
- Task list grouped by status
- Shows parent/child hierarchy using parentId
- "Ready" badge when all children complete
- Default view for task management

### 2. Agents View  
- Agent cards showing:
  - Code name
  - Current task
  - Status (active/idle)
  - Last activity timestamp
- Live updates via `/api/tracker/agents`

### 3. Energy View
- Tasks grouped by priority bands:
  - **Intense**: urgent + high priority
  - **Focused**: medium priority
  - **Light**: low priority
- Visual energy-based task selection

### 4. Live View
- Recent activity feed
- Grouped by time (Now, Recent, Earlier)
- Shows both task and agent activity

## Components

### StatusBadge
Displays task status with color coding.

| Status | Label | Color |
|--------|-------|-------|
| `todo` | TODO | Zinc |
| `in_progress` | IN PROGRESS | Orange |
| `needs-you` | NEEDS YOU | Amber |
| `review` | REVIEW | Purple |
| `ready` | READY | Green |
| `shipped` | SHIPPED | Emerald |

### PriorityBadge  
Displays task priority with icon.

| Priority | Label | Color |
|----------|-------|-------|
| `urgent` | URGENT | Red |
| `high` | HIGH | Orange |
| `medium` | MEDIUM | Yellow |
| `low` | LOW | Green |

### CreateTaskSheet
Modal for creating new tasks.

**Required fields**:
- Title (min 3 chars)
- Description (min 10 chars)
- Priority
- Project

**Optional fields**:
- Assigned to
- Agent code name
- Parent task ID

## File Locations

| Component | Path |
|-----------|------|
| Main Page | `app/page.tsx` |
| StatusBadge | `components/common/StatusBadge.tsx` |
| PriorityBadge | `components/common/PriorityBadge.tsx` |
| CreateTaskSheet | `components/dashboard/CreateTaskSheet.tsx` |
| TaskWidget | `components/dashboard/TaskWidget.tsx` |
| ObjectivesView | `components/views/ObjectivesView.tsx` |

## Styling

- Uses Tailwind CSS
- Dark theme by default
- Status/priority colors defined in components
- Responsive design for mobile

## KV ↔ Beads Data Flow

```
Beads CLI (local) → sync script → Vercel KV (cloud) → Frontend
                                        ↓
                                  /api/tracker/tasks
```

Frontend reads from KV via API, not directly from beads.
