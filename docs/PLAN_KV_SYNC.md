# Option 3: KV as Single Source of Truth - Implementation Plan

**Created:** 2026-02-06
**Status:** ✅ IMPLEMENTED (2026-02-06)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    KV (Upstash Redis)                    │
│  ┌─────────────┐  ┌─────────────────────┐              │
│  │ beads:all   │  │ beads:task:{id}     │              │
│  │ (Set of IDs)│  │ (Hash with data)    │              │
│  └─────────────┘  └─────────────────────┘              │
│  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │ beads:project:{proj}│  │ beads:meta          │     │
│  │ (IDs per project)   │  │ (last sync time)    │     │
│  └─────────────────────┘  └─────────────────────┘     │
└─────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │  Clawd  │          │ Stacean │          │Personal │
    │  Repo   │          │  Repo   │          │  Life   │
    │ beads-  │          │ beads-  │          │ beads-  │
    │  sync   │          │  sync   │          │  sync   │
    └─────────┘          └─────────┘          └─────────┘
```

**Key Point:** All repos use `beads-sync` wrapper which writes to the SAME KV (Stacean's KV).

---

## Phase 1: KV Schema & Sync Script

### 1.1 KV Data Structure

```
Key                          │ Type      │ Description
────────────────────────────────────────────────────────────
beads:all                    │ Set       │ All bead IDs
beads:task:{id}              │ Hash      │ Full bead data (JSON)
beads:task:{id}:meta         │ Hash      │ Source repo, sync time
beads:project:{project}      │ Set       │ Bead IDs for each project
beads:meta                   │ Hash      │ last-sync, version
```

**Bead Data Structure (JSON in KV):**
```json
{
  "id": "clawd-abc123",
  "title": "Fix mobile CSS",
  "description": "...",
  "status": "todo",
  "priority": 0,
  "project": "clawd",
  "projectEditable": true,
  "sourceRepo": "/home/clawdbot/clawd",
  "labels": ["agent:Bro", "mobile"],
  "createdAt": "2026-02-06T19:00:00Z",
  "updatedAt": "2026-02-06T19:30:00Z",
  "syncedAt": "2026-02-06T19:30:00Z"
}
```

### 1.2 beads-sync Wrapper Script

**File:** `~/bin/beads-sync`

```bash
#!/bin/bash
# beads-sync - Runs bd command and syncs results to KV
# Usage: beads-sync <bd-args>
# Example: beads-sync create "Fix bug" -p 0

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run the actual bead command
bd "$@"
BD_EXIT=$?

# If command succeeded, sync to KV
if [ $BD_EXIT -eq 0 ]; then
    # Determine action from first argument
    case "$1" in
        create)
            # Get the last created bead ID
            LAST_ID=$(bd list --limit 1 --json | jq -r '.[0].id')
            # Export to KV
            node "${SCRIPT_DIR}/lib/sync-bead-to-kv.js" create "$LAST_ID"
            ;;
        update|close|delete)
            # Get affected bead IDs from args (for update/close/delete, use args)
            # For now, sync all recent changes
            node "${SCRIPT_DIR}/lib/sync-bead-to-kv.js" sync
            ;;
        sync)
            # Full sync from local beads to KV
            node "${SCRIPT_DIR}/lib/sync-bead-to-kv.js" full-sync
            ;;
    esac
fi

exit $BD_EXIT
```

**File:** `~/bin/lib/sync-bead-to-kv.js`

```javascript
// sync-bead-to-kv.js - Sync local beads to KV
// Usage: node sync-bead-to-kv.js <action> [bead-id]

const { kv } = require('@vercel/kv');
const { listIssues, getIssue } = require('./beads-client');
const path = require('path');
const { execSync } = require('child_process');

// Get project from current directory or use default
function getProject() {
  const cwd = process.cwd();
  const projectMap = {
    '/home/clawdbot/clawd': 'clawd',
    '/home/clawdbot/stacean-repo': 'stacean-repo',
    '/home/clawdbot/personal-life': 'personal-life',
  };
  return projectMap[cwd] || 'unknown';
}

async function syncBead(bead) {
  const project = getProject();
  
  // Extract project from bead ID prefix (can override)
  const idPrefix = bead.id.split('-')[0];
  const detectedProject = idPrefix;
  
  const taskData = {
    id: bead.id,
    title: bead.title,
    description: bead.description || '',
    status: mapStatus(bead.status),
    priority: bead.priority,
    project: detectedProject,  // Auto-detected
    projectEditable: true,     // Can be edited in UI
    sourceRepo: process.cwd(),
    labels: bead.labels || [],
    createdAt: bead.created_at,
    updatedAt: bead.updated_at,
    syncedAt: new Date().toISOString(),
  };
  
  // Write to KV
  await kv.hset(`beads:task:${bead.id}`, taskData);
  
  // Add to sets
  await kv.sadd('beads:all', bead.id);
  await kv.sadd(`beads:project:${detectedProject}`, bead.id);
  
  console.log(`Synced: ${bead.id} -> project: ${detectedProject}`);
}

function mapStatus(beadStatus) {
  const map = {
    'open': 'todo',
    'in_progress': 'active',
    'agent_working': 'active',
    'needs_jordan': 'needs-you',
    'ready_to_commit': 'ready',
    'in_review': 'review',
    'pushed': 'shipped',
  };
  return map[beadStatus] || 'todo';
}

async function main() {
  const action = process.argv[2];
  
  if (action === 'full-sync') {
    // Full sync of all local beads
    const beads = await listIssues();
    for (const bead of beads) {
      await syncBead(bead);
    }
    await kv.hset('beads:meta', { lastFullSync: new Date().toISOString() });
    console.log(`Full sync complete: ${beads.length} beads`);
  } else if (action === 'create' && process.argv[3]) {
    // Sync single bead by ID
    const bead = await getIssue(process.argv[3]);
    if (bead) {
      await syncBead(bead);
    }
  } else if (action === 'sync') {
    // Sync all recent changes
    const beads = await listIssues({ limit: 20 });
    for (const bead of beads) {
      await syncBead(bead);
    }
    console.log(`Synced ${beads.length} recent beads`);
  }
}

main().catch(console.error);
```

---

## Phase 2: Stacean API Changes

### 2.1 New Endpoint: /api/tracker/kv-tasks

**File:** `app/api/tracker/kv-tasks/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// GET /api/tracker/kv-tasks?project=clawd
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    
    let taskIds;
    
    if (project && project !== 'all') {
      // Get tasks for specific project
      taskIds = await kv.smembers(`beads:project:${project}`);
    } else {
      // Get all tasks
      taskIds = await kv.smembers('beads:all');
    }
    
    if (taskIds.length === 0) {
      return NextResponse.json({ tasks: [], source: 'kv' });
    }
    
    // Fetch all task data
    const tasks = await Promise.all(
      taskIds.map(id => kv.hgetall(`beads:task:${id}`))
    );
    
    return NextResponse.json({
      tasks: tasks.filter(t => t !== null),
      source: 'kv',
      count: tasks.length,
    });
  } catch (error) {
    console.error('KV Tasks API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
```

### 2.2 Update ObjectivesView

**File:** `components/views/ObjectivesView.tsx`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Task } from '@/types/task';

interface TaskFromKV extends Task {
  project: string;
  projectEditable: boolean;
  sourceRepo: string;
  syncedAt: string;
}

export function ObjectivesView() {
  const [tasks, setTasks] = useState<TaskFromKV[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('all');
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);

  // Fetch tasks from KV
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracker/kv-tasks?project=${selectedProject}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  // Fetch available projects
  useEffect(() => {
    const fetchProjects = async () => {
      // Hardcoded for now, could be dynamic
      setAvailableProjects(['all', 'clawd', 'stacean-repo', 'personal-life']);
    };
    fetchProjects();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ... rest of component (task handlers, etc.)

  return (
    <div>
      {/* Project Selector */}
      <div className="project-selector">
        <select 
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="project-dropdown"
        >
          {availableProjects.map(project => (
            <option key={project} value={project}>
              {project === 'all' ? 'All Projects' : project}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        initialTasks={tasks}
        // ... other props
      />
    </div>
  );
}
```

---

## Phase 3: Project Editing in TaskModal

### 3.1 Add Project Field

**File:** `components/tasks/TaskModal.tsx`

```typescript
// Inside TaskModal component:

// Project selector
const [project, setProject] = useState(task.project || getDefaultProject());

const getDefaultProject = () => {
  const cwd = process.cwd();
  const projectMap = {
    '/home/clawdbot/clawd': 'clawd',
    '/home/clawdbot/stacean-repo': 'stacean-repo',
    '/home/clawdbot/personal-life': 'personal-life',
  };
  return projectMap[cwd] || 'unknown';
};

// In the modal form:
<div className="form-group">
  <label>Project</label>
  <input 
    type="text" 
    value={project}
    onChange={(e) => setProject(e.target.value)}
    className="project-input"
  />
  <span className="project-source">
    Source: {task.sourceRepo || 'New task'}
  </span>
</div>
```

### 3.2 Save Project to KV

When updating a task, include the project field:

```typescript
async function updateTask(taskId: string, updates: Partial<Task>) {
  await fetch(`/api/tracker/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...updates,
      project: project,  // Include project
    }),
  });
}
```

---

## Phase 4: Installation & Setup

### 4.1 Install beads-sync Everywhere

```bash
# 1. Create ~/bin directory if it doesn't exist
mkdir -p ~/bin
mkdir -p ~/bin/lib

# 2. Copy sync script to ~/bin
cp /home/clawdbot/stacean-repo/scripts/beads-sync ~/bin/
chmod +x ~/bin/beads-sync

# 3. Add to PATH (add to ~/.bashrc or ~/.zshrc)
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc

# 4. Install Node dependencies
cd ~/bin/lib
npm init -y
npm install @vercel/kv

# 5. Copy beads-client from stacean-repo
cp /home/clawdbot/stacean-repo/lib/integrations/beads/client.ts ~/bin/lib/

# 6. Create sync script
cp /home/clawdbot/stacean-repo/scripts/sync-bead-to-kv.js ~/bin/lib/
```

### 4.2 One-Time Setup in Each Repo

```bash
# In each repo (clawd, stacean-repo, personal-life):
# Create alias or wrapper for beads

# Option A: Alias in ~/.bashrc
alias bd="beads-sync"

# Option B: Replace bd binary (requires sudo)
# sudo cp ~/bin/beads-sync /usr/local/bin/bd
```

### 4.3 Fresh Start (Clear Old Beads)

```bash
# In each repo, clear local beads database
cd /home/clawdbot/stacean-repo && rm -rf .beads/*
cd /home/clawdbot/clawd && rm -rf .beads/*
cd /home/clawdbot/personal-life && rm -rf .beads/*

# Start fresh with beads-sync create "First task"
```

---

## Usage Workflow

### Creating Tasks

```bash
# In clawd repo:
beads-sync create "Fix CSS bug" -p 0 -l mobile

# In personal-life repo:
beads-sync create "Buy groceries" -l personal

# In stacean repo:
beads-sync create "Add new feature" -p 1

# All sync to the same KV!
```

### Viewing in Stacean

1. Open Stacean dashboard
2. Use project dropdown to filter:
   - "All Projects" - shows everything
   - "clawd" - only clawd tasks
   - "stacean-repo" - only stacean tasks
   - "personal-life" - only personal tasks
3. Click any task to edit (including project)

---

## Files Reference

| File | Location | Purpose |
|------|----------|---------|
| `beads-sync` | `~/bin/beads-sync` | Wrapper script |
| `sync-bead-to-kv.js` | `~/bin/lib/sync-bead-to-kv.js` | Sync logic |
| `beads-client.ts` | `~/bin/lib/beads-client.ts` | Beads CLI wrapper |
| `kv-tasks/route.ts` | `stacean-repo/app/api/tracker/kv-tasks/route.ts` | API endpoint |
| `ObjectivesView.tsx` | `stacean-repo/components/views/ObjectivesView.tsx` | Updated component |
| `TaskModal.tsx` | `stacean-repo/components/tasks/TaskModal.tsx` | Project editing |

---

## Benefits

1. **Vercel Compatible** - KV works, beads CLI doesn't
2. **Multi-Repo** - Any repo with beads-sync writes to same KV
3. **Real-time** - All repos sync to same central KV
4. **Offline Capable** - Local beads work offline
5. **Single Source** - Stacean reads from one place (KV)
6. **Project Filtering** - Filter by project in UI
7. **Editable Projects** - Change project per task if needed

---

## Open Questions (for refinement)

- [ ] Project list: Hardcoded or dynamic from KV?
- [ ] Default project: What should new tasks default to?
- [ ] Delete behavior: Remove from KV or archive?
- [ ] Sync on Vercel: How to trigger sync on deploy?

---

## Implementation Summary (2026-02-06)

### What Was Built

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | ~/bin setup with @vercel/kv, beads-client.js |
| Phase 2 | ✅ Complete | /api/tracker/kv-tasks endpoint |
| Phase 3 | ✅ Complete | ProjectFilterDropdown + KanbanBoard integration |
| Phase 4 | ✅ Complete | TaskModal project field |
| Phase 5 | ⚠️ Skipped | E2E test (dev server environment issues) |
| Phase 6 | 🔄 In Progress | Documentation |

### Files Modified

- `~/bin/beads-sync` - Wrapper script (from stacean-repo)
- `~/bin/lib/beads-client.js` - KV sync client
- `stacean-repo/app/api/tracker/kv-tasks/route.ts` - New API endpoint
- `stacean-repo/components/kanban/ProjectFilterDropdown.tsx` - New component
- `stacean-repo/components/kanban/KanbanBoard.tsx` - Added selectedProject prop, filteredTasks
- `stacean-repo/components/tasks/TaskModal.tsx` - Added project selector
- `stacean-repo/components/views/ObjectivesView.tsx` - Added project filter UI

### Git Status

- Branch: `feature/kv-multi-repo-filter`
- Commit: 619896a
- URL: https://github.com/zenchantlive/Stacean/pull/new/feature/kv-multi-repo-filter

### Known Issues

- **E2E Test:** Skipped due to dev server environment (starts but exits immediately)
- **Action Required:** Run agent-browser E2E test against Vercel deployment

### Next Steps

1. Open PR and get review
2. Deploy to Vercel
3. Run full E2E test with agent-browser
4. Close remaining test beads (clawd-s2h, clawd-8q3, etc.)

---

**Document Version:** 2.0
**Last Updated:** 2026-02-06 23:45 PST