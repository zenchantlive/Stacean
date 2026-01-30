# Agent Integration Plan: Fleet Commander Adoption

**Goal:** Make the Fleet Commander (Task Tracker) the default operating system for Atlas.
**Problem:** Currently, Atlas must manually run `scripts/tasks.cjs`. This is friction.
**Solution:** Build a native `tracker` tool and hooks that automate task management.

---

## 1. The `tracker` Tool (Agent Backend)

We will create a new tool definition in `TOOLS.md` (and eventually a real tool implementation) that wraps the API/CLI.

**Tool Interface:**
```typescript
tracker({
  action: "list" | "create" | "update" | "spawn" | "done",
  task?: string,
  id?: string,
  status?: string,
  agentId?: string
})
```

**Why:**
- Atlas can call `tracker(action="spawn", task="Fix bug")` naturally.
- No need to remember CLI syntax (`node scripts/tasks.cjs ...`).
- Typed parameters ensure correctness.

---

## 2. The `sessions_spawn` Hook (Automation)

**Objective:** When Atlas spawns a sub-agent, it *must* appear in the Fleet Bar automatically.

**Implementation Logic:**
1.  **Intercept:** Create a wrapper around `sessions_spawn`.
2.  **Register:** Before spawning, call `POST /api/tracker/agents` to reserve a slot.
3.  **Assign:** Create a task card for the sub-agent ("In Progress").
4.  **Execute:** Run the actual `sessions_spawn`.
5.  **Sync:** When sub-agent finishes, auto-update task status to "Review".

**Result:** "Ghost ships" become real. Every sub-agent has a corresponding card on the dashboard.

---

## 3. The "Always On" Protocol (Habit)

**Bootstrapping:**
- Update `BOOTSTRAP.md` / `MEMORY.md` instructions.
- **Rule:** "On startup, run `tracker(action='list')` to see active missions."
- **Rule:** "Before ending session, update status of current task."

**Dashboard Integration:**
- The Dashboard *is* the memory. Atlas reads the dashboard state to know what it was doing last time.

---

## 4. Implementation Steps (Next Session)

1.  **Build `system/tools/tracker.ts`**: The TypeScript wrapper for the API.
2.  **Define Tool**: Add `tracker` to the `tools` definition in system config.
3.  **Create Helper**: `lib/helpers/spawn-with-tracker.ts`.
4.  **Update Instructions**: Modify `AGENTS.md` to enforce usage.

---

**Discussion Question:**
Do you want `tracker` to be a *native tool* (like `read`/`write`) or just a script I call? (Native is faster/cleaner).
