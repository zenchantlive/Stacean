# Status Mapping Reference

This document provides the complete status mapping between Beads CLI, KV storage, and the frontend display.

## 6-Status Workflow

```
TODO → IN_PROGRESS → NEEDS_YOU → REVIEW → READY → SHIPPED
```

## Complete Status Mapping Table

| Frontend | KV Status | Beads CLI Status | BD Command | Who Sets |
|----------|-----------|------------------|------------|----------|
| TODO | `todo` | `open` | `bd create` | System |
| IN PROGRESS | `in_progress` | `in_progress` | `bd update --status in_progress` | Agent |
| NEEDS YOU | `needs-you` | `needs_jordan` | `bd update --status needs_jordan` | Agent |
| REVIEW | `review` | `in_review` | `bd update --status in_review` | Agent |
| READY | `ready` | `ready_to_commit` | `bd update --status ready_to_commit` | Human |
| SHIPPED | `shipped` | `closed` | `bd close` | Human |

## Beads Custom Status Configuration

```bash
# Currently configured custom statuses
bd config get status.custom
# Returns: needs_jordan,in_review,ready_to_commit
```

To add/modify custom statuses:
```bash
bd config set status.custom "needs_jordan,in_review,ready_to_commit"
```

## Consolidated Status Mappings

The sync script consolidates some beads statuses to the 6 frontend statuses:

| Beads Status | → Maps To | Reason |
|--------------|-----------|--------|
| `blocked` | `needs-you` | Blocked = needs human intervention |
| `agent_working` | `in_progress` | Agent actively working |
| `changes_requested` | `in_progress` | Agent fixing based on feedback |
| `pushed` | `shipped` | Code pushed = complete |
| `done` | `shipped` | Task complete |

## Status Transition Rules

### Agent Can Set
- `todo` → `in_progress` (start working)
- `in_progress` → `needs-you` (blocked on human)
- `needs-you` → `in_progress` (human answered, resume work)
- `in_progress` → `review` (code complete, request review)

### Human Sets
- `review` → `ready` (approved review)
- `review` → `in_progress` (changes requested)
- `ready` → `shipped` (merged/deployed)

## Files Involved

| File | Purpose |
|------|---------|
| `types/task.ts` | TypeScript TaskStatus type definition |
| `components/common/StatusBadge.tsx` | Status display component |
| `lib/integrations/kv/tracker.ts` | KV adapter with beads mirroring |
| `scripts/sync-beads-to-kv.ts` | Beads → KV sync with status mapping |
| `app/page.tsx` | STATUS_COLORS for main dashboard |
