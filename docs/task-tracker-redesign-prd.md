# PRD — Task Tracker UX/UI Remake + Beads Graph Integration

**Date:** 2026-01-31
**Owner:** Jordan Hindo
**Status:** Draft v1

---

## 1) Problem Statement
Current task tracker UI is confusing, visually rough, not truly responsive, and doesn't clearly communicate active agent state or Beads/KV sync behavior. Serverless constraints prevent Beads CLI on Vercel, so UX must align with KV real-time + Beads local graph model.

---

## 2) Goals (Must-Haves)
1. **Create task + sync** reliably across KV + Beads (dual-write).
2. **See active agent + current task** in real time, with clear, touch-first UI.
3. **Edit task status/info** with Beads-native status names only.
4. **Objective Stack View** (hierarchical grouping using Beads parent/child graph model).
5. **Agent Lens View** (agent identity Atlas_XXX + status + current task).
6. **Energy Map View** (priority-based energy bands; no due dates).
7. Full responsive design: **mobile-first** + desktop (not phone-sized on desktop).

---

## 3) Non-Goals
- No calendar view
- No multi-project assignment per task (single project only)
- No new status names beyond Beads naming scheme
- No deep agent assignment UI (future scope)

---

## 4) Key Constraints
- **Beads is a graph issue tracker** (nodes + dependency edges)
- **Parent/child = dependency edges** (`bd dep add CHILD PARENT`)
- Hierarchical IDs (e.g., `bd-a3f8.1.1`) encode tree depth but **deps are authoritative**
- Beads CLI unavailable on Vercel → **KV primary in prod, Beads mirror locally**
- **Status names fixed** (wire format): `open`, `in_progress`, `review`, `done`, `tombstone`
  - UI labels can be prettified (Open / In‑Progress / Review / Done / Tombstone)
  - `tombstone` is terminal; ignore in planning/ready logic
- **No due dates**; use `createdAt`
- **Priority mandatory**, **project mandatory**, **description mandatory**

---

## 5) UX Direction
**Theme:** Dark/taupe base with aurora-like subdued accents
- Colors: deep taupe, sage green, soft teal; moss + ember accents
- Touch-first interactions; desktop uses left rail + larger layout
- Clear information hierarchy, clean surfaces, strong readability

---

## 6) Primary Views (Unique)

### A) Objective Stack View (Primary)
- Collapsible objective stacks (parent tasks)
- Child tasks indented with status chips
- Status naming Beads-native
- Supports deep nesting (multiple levels)
- Uses Beads deps to determine readiness

### B) Agent Lens View
- Displays agents as cards: `Atlas_XXX`
- Shows current task, status, last heartbeat
- Minimal timeline of recent actions (if available)
- Real-time updates via KV

### C) Energy Map View
- Priority → Energy bands (High=Intense, Medium=Focused, Low=Light)
- No separate effort field (optional later)
- Clear, legible grouping for quick selection

---

## 7) Task Creation & Editing
**Required fields:** Title, Description, Priority, Project
- Description **mandatory** (AI-assisted, never blank)
- Priority mapped directly to Beads numeric priority
- Project is mandatory and single-select
- Status edit: Open / In‑Progress / Review / Done / Tombstone

---

## 8) Data Model Requirements
- **parentId** stored on tasks
- **dependency edges** must be created in Beads (`bd dep add child parent`)
- Dotted IDs encouraged but not authoritative

---

## 9) Technical Architecture (Current)
- `/api/tracker/tasks` uses `lib/integrations/kv/tracker.ts`
- KV is source of truth in production
- Beads mirror best-effort locally
- Beads used for graph traversal and hierarchy

---

## 10) Milestones
1. **Design system** (colors, typography, spacing, components)
2. **View layouts** (Objective Stack, Agent Lens, Energy Map)
3. **Task creation flow** (enforced description + project + priority)
4. **Responsive build** (mobile + desktop)
5. **Beads graph integration** (parent/child edges + readiness)

---

## 11) Open Questions
- Confirm current heartbeat payload fields for agent lens
- Confirm if parentId should be stored in KV for fast hierarchy

---

## 12) Success Criteria
- Tasks reliably created + synced (KV + Beads)
- UI clean, responsive, and distinct
- Objective Stack is intuitive for planning
- Agent Lens clearly shows active agent and current task
- Energy Map is usable without causing procrastination
