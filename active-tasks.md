# Active Task: Beads→KV Sync for Real-Time Task Visibility

**Date:** 2026-02-02
**Status:** ✅ RESOLVED
**Priority:** High

## Issue

Tasks created via `bd` CLI weren't visible on Vercel deployment UI because:
- Beads stores issues locally in `.beads/issues.jsonl`
- KV (Upstash Redis) was empty
- UI fetches from KV, not Beads

## Solution Implemented

Created a sync script that mirrors Beads → KV:

### Files Added/Modified:
- `scripts/sync-beads-to-kv.ts` - New sync script
- `package.json` - Added `"bd:sync": "npx tsx scripts/sync-beads-to-kv.ts"`

### Sync Script Features:
- Fetches all open issues from Beads via `bd list --json`
- Converts Beads issues to KV task format
- Writes to Upstash KV with `tracker:task:{id}` keys
- Cleans up closed tasks from KV

## Usage

After creating a bead:
```bash
# Create a bead
bd create "My new task" -p 1

# Sync to KV (pushes to Vercel in real-time)
npm run bd:sync

# Or sync all beads
npm run bd:sync
```

## Sync Results

- ✅ 13 open beads synced to KV
- ✅ 39 stale tasks cleaned up
- ✅ Vercel deployment now shows tasks in real-time

## Next Steps (Optional)

1. **Automate sync** - Could add a git hook or beads daemon hook
2. **Bidirectional sync** - Currently Beads → KV only
3. **Watch mode** - Auto-sync on Beads file changes

---

*Previous issue (Tasks Not Displaying) resolved by implementing this sync mechanism.*
