# Data Mapping — KV ↔ Beads

**Purpose:** Ensure parity between KV tasks (prod) and Beads issues (local graph).

---

## 1) Field Mapping

| KV Task Field | Beads Field | Notes |
|---|---|---|
| id | id | Beads IDs (`bd-xxx`) used where possible |
| title | title | Required |
| description | description | Required |
| status | status | `open / in_progress / review / done / tombstone` |
| priority | priority | KV string ↔ Beads numeric (0–3) |
| project | label | `project:<slug>` label |
| parentId | dependency edge | `bd dep add child parent` |
| createdAt | created_at | Use Beads timestamps |
| updatedAt | updated_at | Use Beads timestamps |

---

## 2) Priority Mapping

| KV | Beads |
|---|---|
| urgent | 0 |
| high | 1 |
| medium | 2 |
| low | 3 |

---

## 3) Status Mapping

| KV | UI Label |
|---|---|
| open | Open |
| in_progress | In‑Progress |
| review | Review |
| done | Done |
| tombstone | Tombstone |

---

## 4) Parent/Child Model

- Use Beads dependency edges as authoritative parent/child
- When creating a child:
  - `bd dep add child parent`
  - If using dotted IDs, keep them consistent

---

## 5) Sync Rules

- **Production:** KV is source of truth; Beads mirror is best-effort
- **Local:** KV write + Beads mirror on every CRUD
- If Beads mirror fails → ignore (non-critical)

---

## 6) Querying Hierarchy

- Parent → children: `bd children <parent>`
- Full tree: `bd dep tree <id>`

---

## 7) Readiness

- Parent is “Ready” when all blocking children are Done
- Use `bd ready` to determine next tasks
