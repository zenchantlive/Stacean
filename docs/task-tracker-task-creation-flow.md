# Task Creation Flow + Validation

**Purpose:** Ensure tasks are created reliably with required fields and Beads/KV parity.

---

## 1) Required Fields (Hard Block)
- **Title** (non-empty)
- **Description** (non-empty, AI assisted allowed)
- **Priority** (Beads-aligned)
- **Project** (single-select)

No task is created if any required field is missing.

---

## 2) Create Flow (Touch‑First)

1. Tap **Create Task** (FAB / top action)
2. Modal sheet opens (mobile) or side panel (desktop)
3. User fills:
   - Title
   - Project
   - Priority
   - Description
4. Optional: mark as **Objective** (parent task)
5. Submit → KV write → mirror to Beads

---

## 3) AI Description Assist (Never Silent)
- If description empty, user can tap **“Generate Description”**
- If AI fails, show inline error + retry button
- On success, insert generated description into field
- **Do not allow submit without description**

---

## 4) Validation Rules
- Title: 3–120 chars
- Description: 10–500 chars (soft warning if <20)
- Priority: required, default = Medium
- Project: required, default = last used

---

## 5) Error/Empty States
- If API fails, keep draft in form + retry
- Show error banner at top of sheet
- Confirm sync after save (“Saved & synced” toast)

---

## 6) Objective Creation
- Toggle: “This is an Objective”
- Objectives can have children
- Creating a child from within objective auto-sets parentId

---

## 7) Status Defaults
- New tasks start as **Open**
- Objective defaults Open

---

## 8) Telemetry (Optional)
- Track failures of AI description to improve reliability
