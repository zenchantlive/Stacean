---
name: command-center
description: "Operate the Command Center task tracker at stacean.vercel.app. Use when creating, updating, or managing tasks via Beads CLI, syncing to Vercel KV, or working with the dashboard UI. Covers the 6-status workflow (todo → in_progress → needs-you → review → ready → shipped), beads commands, KV sync, and all tracker APIs."
---

# Command Center Skill

The Command Center is a task tracker deployed at [stacean.vercel.app](https://stacean.vercel.app). Tasks are managed locally via **Beads CLI** and synced to **Vercel KV** for the production frontend.

## 6-Status Workflow

```
TODO → IN_PROGRESS → NEEDS_YOU → REVIEW → READY → SHIPPED
```

| Status | Who Sets | Description |
|--------|----------|-------------|
| `todo` | System | Created, not started |
| `in_progress` | Agent | Agent actively working |
| `needs-you` | Agent | Blocked on human decision |
| `review` | Agent | Code done, requesting review |
| `ready` | Human | Approved, ready to merge |
| `shipped` | Human | Merged/deployed |

## Agent Workflow (Quick Start)

```bash
# 1. Create task
bd create "Task title" -p 1

# 2. Start working
bd update <id> --status in_progress

# 3. If blocked on human
bd update <id> --status needs_jordan

# 4. Submit for review
bd update <id> --status in_review

# 5. Sync to Vercel (makes visible on deployment)
npm run bd:sync

# 6. After human approves, they close it
bd update <id> --status ready_to_commit
bd close <id>
```

## Beads ↔ KV Mapping

| Frontend | Beads CLI |
|----------|-----------|
| `in_progress` | `--status in_progress` |
| `needs-you` | `--status needs_jordan` |
| `review` | `--status in_review` |
| `ready` | `--status ready_to_commit` |
| `shipped` | `bd close` |

> For complete mapping details, see [status-mapping.md](references/status-mapping.md)

## APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tracker/tasks` | GET | List all tasks |
| `/api/tracker/tasks` | POST | Create task |
| `/api/tracker/tasks/[id]` | PUT | Update task |
| `/api/tracker/tasks/[id]` | DELETE | Soft delete |
| `/api/tracker/agents` | GET | List agents |

> For request/response formats, see [api.md](references/api.md)

## Key Files

| File | Purpose |
|------|---------|
| `types/task.ts` | TaskStatus, TaskPriority types |
| `components/common/StatusBadge.tsx` | Status badge component |
| `lib/integrations/kv/tracker.ts` | KV adapter (creates/updates tasks) |
| `scripts/sync-beads-to-kv.ts` | Beads → KV sync script |
| `app/page.tsx` | Main dashboard with 4 views |

## Dashboard Views

The main page (`/`) has 4 views:

1. **Objectives** - Task list grouped by status
2. **Agents** - Agent status cards
3. **Energy** - Tasks grouped by priority bands
4. **Live** - Recent activity feed

## Priorities

| Priority | Value | Color |
|----------|-------|-------|
| `urgent` | P0 | Red |
| `high` | P1 | Orange |
| `medium` | P2 | Blue |
| `low` | P3 | Zinc |

## Syncing to Production

Tasks appear on Vercel only after syncing:

```bash
npm run bd:sync
```

This runs `scripts/sync-beads-to-kv.ts` which:
1. Reads all open beads issues (`bd list --json`)
2. Maps statuses to frontend values
3. Writes to Vercel KV (Upstash Redis)
4. Cleans up closed tasks from KV

**No git commit needed** - sync writes directly to cloud KV.

## Dynamic Projects

Projects are discovered automatically from tasks in KV. To register a project with a custom label or emoji so it looks polished on the dashboard, use the management script:

```bash
# Register a new project
bun run scripts/manage-projects.ts --id=my-app --label="My App" --emoji="🚀"

# List all registered projects
bun run scripts/manage-projects.ts --list

# Delete a registered project
bun run scripts/manage-projects.ts --delete=my-app
```

## References

- [status-mapping.md](references/status-mapping.md) - Complete status mapping table
- [api.md](references/api.md) - API endpoint documentation
- [workflow.md](references/workflow.md) - Detailed task lifecycle
