# Active Task: UI Consistency + Beads↔KV Continuity Fixes

**Date:** 2026-02-02
**Status:** ✅ COMPLETED
**Priority:** High

## Summary

Addressed issues raised:
- Sidebar menu wouldn’t close
- Statuses not matching Beads
- No auto-sync after Beads changes
- Agents assigned in tasks not appearing in Agents view
- Non‑focus mode redundant
- Sections needed to be collapsible
- Live view unclear if derived

## Fixes Implemented

### ✅ Sidebar Closing
- Added **collapse/expand** button for desktop sidebar
- Added **mobile overlay click-to-close**
- Added **close button** in mobile sidebar

### ✅ Status Accuracy + Sync Continuity
- Sync now fetches **all Beads issues** and filters only `closed` (no more closed tasks in TODO)
- Added **bd:watch** script to auto-sync whenever `.beads/issues.jsonl` changes

### ✅ Agents View (Derived Fallback)
- If `/api/tracker/agents` returns empty, show **derived agents** from task `agentCodeName`
- Label views clearly as **Derived**

### ✅ Removed Dashboard Mode
- Only **main mode** remains (focused layout)

### ✅ Collapsible Sections
- Objectives columns, Agents, Energy, Live all collapsible

### ✅ Live View Clarity
- Labeled as **Derived** if no agent telemetry

## Files Modified
- `app/page.tsx` — main UI rewrite with collapsible sections, sidebar controls, derived agent logic
- `scripts/sync-beads-to-kv.ts` — sync now includes all non‑closed beads
- `scripts/beads-kv-watch.ts` — watch mode for auto‑sync
- `package.json` — added `bd:watch`

## Usage

```bash
# Continuous sync while working
npm run bd:watch

# One-off sync
npm run bd:sync
```

---

**Result:** UI now stays in sync with Beads/KV, sections are collapsible, sidebar closes properly, and agents view reflects assignments even without live telemetry.
