# View Spec — Objective Stack (Primary)

**Purpose:** Planning and hierarchy. Visualize objectives (parent tasks) with nested subtasks using Beads dependency edges.

---

## 1) Structure
- **Stack = Objective (parent task)**
- **Children = subtasks** (dependency edges)
- Multi-level nesting supported (dotted IDs encouraged, deps authoritative)

---

## 2) UI Layout
- Card‑like stacks with soft depth (taupe base, aurora edge glow)
- Parent header: title, project chip, priority chip, status chip
- Child rows: compact with status dot + title + priority glyph
- Expand/collapse per objective

---

## 3) Interactions
- Tap objective header → expand/collapse
- Swipe right on child → set In‑Progress
- Swipe left on child → set Done
- Long‑press → open task details sheet

---

## 4) Status Rules
- Status labels: **Open / In‑Progress / Review / Done / Tombstone**
- Wire format: `open | in_progress | review | done | tombstone`
- Tombstone hidden by default (toggle in filters)

---

## 5) Readiness Behavior
- Parent task displays “Ready” badge when all blocking children are done
- Use Beads deps (child blocks parent)
- If parent is Ready, it floats to top of its stack section

---

## 6) Empty States
- No objectives: “Create your first Objective”
- Objective with no children: prompt to add subtasks

---

## 7) Accessibility
- Color‑independent status indicators
- Focus ring on interactive elements
- Swipe actions mirrored by tap menu
