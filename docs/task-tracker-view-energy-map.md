# View Spec — Energy Map

**Purpose:** Prioritize work by energy bands derived from priority.

---

## 1) Mapping
- **Urgent / High** → Intense Band
- **Medium** → Focused Band
- **Low** → Light Band

---

## 2) UI Layout
- Horizontal bands on desktop, vertical bands on mobile
- Each band has a label + subtle gradient fill
- Tasks rendered as chips/cards with quick actions

---

## 3) Interactions
- Tap task → open details
- Quick status change from chip menu
- Drag between bands (optional if we allow priority change)

---

## 4) Constraints
- Priority is mandatory and Beads‑aligned
- No due dates
- Use createdAt for recency indicators

---

## 5) Empty States
- Empty band: “Nothing here — go live your life”

---

## 6) Accessibility
- Band colors accompanied by labels and icons
- Maintain contrast in dark taupe palette
