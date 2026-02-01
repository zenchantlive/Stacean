# Command Center Workflow (Task Execution)

## Task Lifecycle (Beads + Tracker)
- **Create task** for every Jordan request (even quick lookups).
- **Granularity**: If 2+ steps or >10 minutes, create a main task + subtasks.
- **Batching**: Multiple tiny asks (<5 min each) → one task with a checklist.

## Heartbeats
- Start heartbeat once work begins if >30s.
- Cadence:
  - 30s: active coding/debugging
  - 60s: research/reading
  - 90s: long waits (build/test)

## Completion
- Mark task complete with a short summary.
- Use Notes CLI for complex decisions.

## Beads/Tracker Interfaces
- Beads CLI (local): `bd create`, `bd update`, `bd close`
- Tracker API: `/api/tracker/tasks`, `/api/tracker/agents`

## Task Templates (for descriptions)
- **Bug Fix**: Problem → Root cause → Fix → Tests → Risk
- **Feature**: Goal → Scope → Milestones → Acceptance Criteria
- **Refactor**: Why → Impacted Areas → Steps → Safeguards
- **Research**: Question → Sources → Findings → Recommendation

## Notes CLI
- `node scripts/notes.cjs add "<note>"`
- `node scripts/notes.cjs list`
- `node scripts/notes.cjs search "<query>"`
