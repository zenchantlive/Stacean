# Task Tracker PRD
## Fleet Commander - Distributed Task Management for Atlas

**Version:** 1.0 (Foundation Live)
**Date:** 2026-01-29
**Status:** Phase 1 Complete / Phase 2 (Adoption) Pending

---

## 1. Overview

A real-time task dispatch system that enables **parallel fleet operations**. Atlas can spawn sub-agents, assign tasks, and monitor all activity from a unified Command Center.

**The Paradigm Shift:**
- **Old Way:** Sequential task execution (Task 1 → Task 2 → Task 3)
- **New Way:** Parallel fleet dispatch (Task 1 → *Spawn Agent A*, Task 2 → *Spawn Agent B*)

**Why This Matters:**
- Dashboard needs "What is Atlas doing?" (all agents, not just one)
- Atlas needs to manage parallel work without context switching
- Fleet Commander makes sub-agent visibility real, not metaphorical

---

## 2. Technical Architecture

### 2.1 Data Layer (Vercel KV / Redis)

**Redis as Real-Time State Machine:**

| Key Pattern | Value Type | Purpose |
|-------------|--------------|---------|
| `task:{id}` | JSON Object | Source of truth for task data |
| `agents:active` | Set (of IDs) | Currently running agent sessions |
| `agent:{id}` | JSON Object | Heartbeat + current action |
| `agent:code:{name}` | JSON Object | Code name mapping (Neon-Hawk → session_123) |

### 2.2 Task Schema

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string; // Agent Session ID
  agentCodeName?: string; // "Neon-Hawk", "Solar-Bear"
  context: {
    files: string[];
    logs: string[];
  };
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  parentId?: string; // For sub-task hierarchies
}
```

### 2.3 Agent Session Schema

```typescript
interface AgentSession {
  id: string; // Session ID
  codeName: string; // "Neon-Hawk", "Solar-Bear"
  initials: string; // "NH", "SB"
  currentTaskId?: string; // Currently assigned task
  status: 'idle' | 'working' | 'error' | 'done';
  currentAction?: string; // "Running tests...", "Analyzing schema..."
  heartbeat: number; // Timestamp
  spawnedBy?: string; // Parent session ID (for hierarchy)
}
```

### 2.4 Code Name Generation

**Auto-Generated Memorable Handles:**
- Format: `{Adjective}-{Animal}`
- Examples: `Neon-Hawk`, `Solar-Bear`, `Iron-Wolf`, `Swift-Owl`, `Crimson-Fox`
- Storage: `{ id: 'session_123', name: 'Neon-Hawk', initials: 'NH' }`

**Why:** Cognitive load. "Which one was database fix again? `a1` or `b2`?" vs "Oh, `Neon-Hawk` is DB refactor."

---

## 3. The Interfaces (Implemented)

### 3.1 Fleet Bar (Top) - "The Orbit"

**Visual:**
- Horizontal scrollable row of 60px circular avatars
- Leftmost: **YOU** (Main Session) - larger, highlighted
- Following: `NH`, `SB`, `IW` - slightly smaller
- Status Rings:
  - 🔵 Pulsing cyan (working)
  - 🟢 Solid green (done/idle)
  - 🔴 Solid red (error)

**Interaction:**
- Tap avatar → Loads that agent's "Deck" into main view
- Priority sorting (Working agents → Front, Done agents → Back)

### 3.2 Deck View (Focus) - "The Brain"

**Visual:**
- 3D stacked cards effect (2-3 cards peeking behind, dimmed opacity 0.5)
- Center stage: Large card (70% height)
- Dark void background (#0A0A0A)

**Active Card Content:**
```
┌─────────────────────────────┐
│ REFACTOR AUTH MIDDLEWARE   │
├─────────────────────────────┤
│ Agent: Neon-Hawk          │
│ Status: RUNNING TESTS...    │
├─────────────────────────────┤
│ [Pause] [Logs] [Cancel]   │
└─────────────────────────────┘\n```

### 3.3 Grid View (Overview) - "God Mode"

**Visual:**
- Columns: `To Do`, `In Progress`, `Review`, `Done`
- Minimal cards:
  - Title (text)
  - Colored border (status: gray, blue, purple, green)
  - Agent Badge (initials: NH, SB) - only if assigned
- Click → Opens Deck View focused on that task

### 3.4 Atlas CLI (Backend Integration)

**Script:** `scripts/tasks.cjs` (already exists)
**New Commands:**
```bash
tasks list [--status <filter>]      # Already works
tasks add "<title>" --priority <level> # Already works
tasks done <id>                   # Already works
tasks spawn "<title>"              # NEW: Create task + spawn sub-agent
tasks assign <task-id> <agent-id>  # NEW: Link agent to task
```

### 3.5 Agent Integration (The Hands)

**Tool:** `system/tools/tracker.ts` (NEW)
**Purpose:** Atlas uses this to interact with tracker programmatically.

```typescript
// When Atlas spawns a sub-agent:
await sessions_spawn({
  task: "Analyze database schema",
  agentId: 'claude-4',
  tracker: true, // Auto-link to Task Tracker
});

// When Atlas completes a task:
await tracker.done(taskId);

// When Atlas updates status:
await tracker.update(taskId, { status: 'testing' });
```

**Integration Logic:**
1. `sessions_spawn` → Auto-creates task entry with status `in-progress`
2. Agent heartbeat → Updates `agent:{id}` with current action
3. Agent completes → Auto-sets task status to `review`

---

## 4. Implementation Plan (Tracer Bullets)

We build this **one bullet at a time**. Each bullet must pass verification before moving forward.

### Phase 1: Foundation (COMPLETE)
- [x] **Bullet #1: Code Name Generator** (Utils + Tests)
- [x] **Bullet #2: Agent Session Schema** (KV + Adapter)
- [x] **Bullet #3: Grid View Component** (Frontend)
- [x] **Bullet #4: Fleet Bar Component** (Frontend)
- [x] **Bullet #5: Deck View Component** (Frontend)
- [x] **Bullet #6: API Layer** (Agents/Tasks Endpoints)
- [x] **Bullet #7: Interactivity** (Task Creation, Status Cycling, Deck Controls)
- [x] **Bullet #8: End-to-End Tests** (Playwright Suite, Network-Aware)

### Phase 2: Adoption (PENDING)
- [ ] **Agent CLI Setup**: Configure Atlas to use `tasks.cjs`.
- [ ] **Programmatic Interface**: `system/tools/tracker.ts`.
- [ ] **Session Integration**: `sessions_spawn` wrapper.
- [ ] **UI Polish**: Fix remaining visual jank/responsiveness.

---

## 5. Open Questions for Jordan

1. **Code Name Style:** Adjective-Animal (Neon-Hawk) OK? Or prefer other scheme?
2. **Fleet Bar Size:** On mobile, how many avatars before scroll? (Recommendation: 4-5 visible)
3. **Agent Limits:** Max parallel sub-agents? (Recommendation: 5 before queueing)
4. **Screenshot Storage:** Should agent progress screenshots go to Blob/KV? (For visual logs in Deck)

---

## 6. Success Metrics

- Atlas spawns sub-agent → Appears in Fleet Bar instantly
- Jordan taps agent avatar → Deck View loads with real-time logs
- Atlas marks task done → Grid View card border turns green
- All views (Fleet, Grid, Deck) share same KV state
