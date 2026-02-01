---
name: command-center
description: "Operate the Command Center dashboard app. Use when building, using, or automating the Task Tracker UI or its related APIs (tasks, agents, KV↔Beads mapping), and when onboarding another agent to use the app locally via a skill folder. Includes instructions for task tracker flows, views, and required fields."
---

# Command Center

## Scope (current)
- **Task Tracker** UX/UI + API usage (tasks + agents)
- **Onboarding**: how to add this skill folder to a user’s local config so their agent can use the app

## Location
- App lives in `/home/clawdbot/clawd/blog`
- Skills live in **two places** (keep in sync):
  - `/home/clawdbot/clawd/skills/command-center`
  - `/home/clawdbot/clawd/blog/skills/command-center`

## Quick Start (Agent)
1. **Read** `references/task-tracker.md` for UI behavior + constraints.
2. **Read** `references/workflow.md` for task lifecycle + heartbeats.
3. **Use** `/blog` only (do not modify outside the app when working on this UI).
4. **Views**: Objective Stack → Agent Lens → Energy Map.
5. **Create Task** via the Create Task sheet (required: title, description, priority, project).

## User Installation (Skill Folder)
To let another agent use Command Center:
1. Copy the skill folder into their local skills path:
   - `<workspace>/skills/command-center`
2. Ensure their agent’s **AGENTS.md** (or equivalent) includes it as a **mandatory skill**.
3. Restart/bootstrap their agent session so the skill is discovered.

## APIs (Task Tracker)
- **Tasks:** `/api/tracker/tasks`
- **Agents:** `/api/tracker/agents`
- **Status wire format:** `open | in_progress | review | done | tombstone`
- **Priority:** `urgent | high | medium | low`

## References
- `references/task-tracker.md` — UI behavior, constraints, mappings
- `references/workflow.md` — task lifecycle + heartbeats + templates
- `references/installation.md` — skill distribution + setup notes

## Future Modules (placeholders)
- Notes / Ledger / Heartbeat automation — add specs in references when ready.
