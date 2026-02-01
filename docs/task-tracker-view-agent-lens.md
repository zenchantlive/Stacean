# View Spec — Agent Lens

**Purpose:** Real‑time view of active agents (Atlas_XXX) and their current task.

---

## 1) Structure
- Agent cards (grid on desktop, vertical stack on mobile)
- Each card shows:
  - Agent name (Atlas_XXX)
  - Current task title
  - Task status chip
  - Last heartbeat action (if available)
  - Duration on task (if available)

---

## 2) UI Layout
- Card with aurora edge glow on hover/active
- Subtle pulse for active agent
- Placeholder if agent idle: “Awaiting task”

---

## 3) Interactions
- Tap card → open task details sheet
- Long‑press → quick status change
- Swipe (mobile) to move task status forward/back

---

## 4) Real‑Time Updates
- Poll KV every 3–5s (or SSE/WebSocket if available)
- Animate changes: fade + slide

---

## 5) Empty States
- No agents: “No active agents right now”
- Agent idle: “Waiting for assignment”

---

## 6) Accessibility
- Clear focus states
- Status text + icon
