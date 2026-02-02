# Task Workflow: Beads → KV Sync

This document describes how to create tasks that appear **instantly on Vercel** without commits.

## Overview

- **Beads** - Local issue tracker (`.beads/issues.jsonl`)
- **KV (Upstash)** - Cloud Redis that powers the Vercel UI
- **Sync** - Automatic via `bdx` wrapper

## Usage

Use **`npm run bdx`** instead of `bd` for any task-modifying command:

```bash
# Create a task (auto-syncs to Vercel)
npm run bdx create "Implement feature X" -p 1

# Update a task
npm run bdx update clawd-abc123 --status in_progress

# Close a task (auto-removes from Vercel UI)
npm run bdx close clawd-abc123 --reason "Done"

# Delete a task
npm run bdx delete clawd-abc123
```

## How It Works

```
bdx command
    ↓
bd creates/updates bead in .beads/issues.jsonl
    ↓
Auto-runs: npm run bd:sync (scripts/sync-beads-to-kv.ts)
    ↓
Syncs all open beads to Upstash KV
    ↓
✅ Vercel deployment shows tasks instantly (no commit!)
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run bdx create "Title" -p 1` | Create + sync |
| `npm run bdx update <id> --status done` | Update + sync |
| `npm run bdx close <id>` | Close + sync |
| `npm run bd:sync` | Manual sync (all tasks) |
| `bd list` | List beads (no sync) |

## Viewing Tasks

**Vercel Deployment:**
→ https://blog-zenchantlives-projects.vercel.app/focused

**Local Development:**
→ http://localhost:3000/focused

## Troubleshooting

### Tasks not appearing on Vercel?
```bash
# Manual sync
npm run bd:sync
```

### How many tasks are in KV?
The sync script shows count when running.

### Data persistence
- Beads: `.beads/issues.jsonl` (local, git-tracked)
- KV: Upstash Redis (cloud, auto-synced)

Both stay in sync via the `bdx` wrapper.