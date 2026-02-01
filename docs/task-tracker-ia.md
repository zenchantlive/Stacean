# Task Tracker IA + Navigation Map

**Date:** 2026-01-31
**Branch:** `ux/task-tracker-remake`

---

## 1) Navigation Model

### Mobile (Touch‑First)
- **Bottom Dock** (fixed): 4–5 primary tabs
  1. **Objective Stack** (primary)
  2. **Agent Lens**
  3. **Energy Map**
  4. **Search/Filter** (optional)
  5. **Settings** (optional)
- **Floating Action Button (FAB)**: Create Task (always visible)
- **Slide‑up Drawer** for filters + project switch
- **Task Details** open as full‑screen sheet

### Desktop
- **Left Rail** with icon + label for each view
- **Top Command Bar**: Search, project switch, Create Task
- **Right Drawer**: task details + edits (contextual)
- **Content** in central pane with wider layout (not phone-sized)

---

## 2) View Switching Rules
- View switching preserves state (selected project, filters)
- Last view persists across sessions (KV)
- Objective Stack is default landing view

---

## 3) Primary Actions (Always Accessible)
1. **Create Task** (required fields enforced)
2. **Edit Task Status** (Open/In‑Progress/Review/Done/Tombstone)
3. **Project Switch** (single project per task)

---

## 4) Task Detail Patterns
- **Mobile:** Full-screen sheet with tabbed sections: Overview / Activity
- **Desktop:** Right drawer panel with sections + inline edits

---

## 5) Layout Responsiveness
- Base unit: `rem` spacing with fluid widths
- Grid layout on desktop; stacked layout on mobile
- Typography scales via root font-size per breakpoint

---

## 6) Data/State Dependencies
- **Tasks**: from KV (real-time)
- **Agents**: from Beads/KV mirror
- **Objective Stack**: parent/child edges (Beads deps)
- **Energy Map**: priority → band mapping

---

## 7) Empty & Error States
- Empty view: “No tasks yet — create your first objective” + CTA
- Error state: inline banner + retry button
- Loading: subtle shimmer skeleton
