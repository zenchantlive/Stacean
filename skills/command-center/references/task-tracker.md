# Task Tracker — Command Center

## Purpose
Redesign + operate the Task Tracker UI with mobile-first navigation and three primary views.

## Core Constraints
- **Statuses (wire):** `open`, `in_progress`, `review`, `done`, `tombstone`
- **Priority (required):** `urgent | high | medium | low`
- **Project (required)** single project per task
- **Description (required)** (AI assist allowed, never blank)
- **No due dates**

## Views
### 1) Objective Stack (primary)
- Parent/child hierarchy using **parentId** (Beads deps authoritative)
- Ready badge when all children are done
- Tombstones hidden by default

### 2) Agent Lens
- Agent cards show: code name, current task, status, last action, heartbeat
- Live updates via `/api/tracker/agents`

### 3) Energy Map
- Energy bands map from priority:
  - Intense: urgent/high
  - Focused: medium
  - Light: low

## Create Task Flow
- Enforce required fields before POST:
  - title (>=3)
  - description (>=10)
  - priority
  - project
- POST `/api/tracker/tasks` with `{ title, description, priority, project, parentId?, assignedTo }`

## KV ↔ Beads
- Production uses KV; Beads mirrors locally
- Status mapping lives in `blog/lib/utils/tracker-mapping.ts`

## File Map
- `blog/components/dashboard/TaskWidget.tsx`
- `blog/components/dashboard/views/ObjectiveStackView.tsx`
- `blog/components/dashboard/views/AgentLensView.tsx`
- `blog/components/dashboard/views/EnergyMapView.tsx`
- `blog/components/dashboard/CreateTaskSheet.tsx`
- `blog/lib/styles/task-tracker-theme.css`
