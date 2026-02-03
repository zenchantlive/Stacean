# Active State — Stacean Repo

**Date:** 2026-02-02
**Status:** IN PROGRESS

## ✅ What We Just Did (Summary + How)

### Status Workflow + UI (In Progress)
- **Configured custom Beads statuses**
  - `agent_working, blocked, needs_jordan, changes_requested, ready_to_commit, pushed`
- **Mapped Beads → UI pipeline**
  - **Todo:** `open`
  - **Active:** `agent_working`, `blocked`, `changes_requested`
  - **Needs You:** `needs_jordan`
  - **Ready:** `ready_to_commit`
  - **Shipped:** `done`, `pushed`
- **Objectives tab now 5 columns** (Todo / Active / Needs You / Ready / Shipped)
- **Added persistent pipeline header stats** (counts per column, click to jump)
- **Agents tab now shows per‑agent status metadata** (todo/active/needs/ready/shipped)
- **Updated Task tooling**
  - TaskDeck “Done” → **Shipped**
  - TaskEditModal status options updated
  - TaskGrid status columns/options updated

### How I Worked (Process)
- Applied **UX-first** mapping from status set → 5-column pipeline view.
- Updated type system (`TaskStatus`) to align with UI columns.
- Fixed compile errors iteratively using `npm run build`.
- Updated UI components incrementally, then validated build pass.

---

## 🔥 Next Issues (Priority Order)

### 1) **Beads Cleanup + New Beads (Immediate)**
- Deleted old open/test beads; created fresh beads:
  - clawd-qan (migration audit, agent_working)
  - clawd-64f (status rules doc, needs_jordan)
  - clawd-vb7 (desktop layout reinvention, open)
  - clawd-mry (mobile ergonomics, open)

### 2) **Agent Workflow Status Rules (Now)**
- Update docs/TASK_WORKFLOW.md with new statuses + rules.

### 3) **Desktop Layout Re‑invention (IN PROGRESS)**
- Added max-width content wrapper + constrained kanban columns
- Sidebar collapsed by default
- Responsive kanban columns (5 → 3 → 2 → 1)
- Fixed widescreen: centered columns with fixed widths (260px)
- **TODO:** Fix remaining widescreen spacing issues

### 4) **UI View Redesigns (DONE)**
- **Test beads created:** clawd-a74 (active), clawd-wo5 (needs-you), clawd-q22 (ready), clawd-x9n (shipped)
- **Agents view (Option B):** Agent-centric cards showing:
  - Currently doing (active task)
  - Needs Your Review (tasks waiting for Jordan)
  - Recently Shipped (last 3 completed)
  - Full status breakdown with colored pills
- **Live view (Option C):** Time-based activity feed with sections:
  - Today / Yesterday / Earlier This Week / Older
  - Relative timestamps ("2m ago", "3h ago")
  - Agent activity + task status changes
- **Widescreen fix:** Centered content, better spatial hierarchy

### 5) **Mobile Ergonomics + Less Scrolling**
- Tighten spacing and improve ergonomic layout.

### 6) **OpenClaw In‑App Chat (Future/Brainstorm)**
- Big item for later — needs separate planning session.

---

## ⚙️ Required Workflow Notes for Next Session

1. **Start with Beads**
   - Research first issue → create beads → tracer‑bullet implementation.
2. **Agent Mail**
   - If Agent Mail is broken, attempt to fix first.
3. **Use Skills**
   - Continue swarm workflow.
4. **Continuity Audit**
   - Treat as Beads ↔ KV ↔ UI consistency audit.

---

## Commands
```bash
# Keep KV synced
npm run bd:watch

# One‑off sync
npm run bd:sync
```
