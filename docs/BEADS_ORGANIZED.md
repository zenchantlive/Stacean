# Stacean v2.0: Remaining Work (Organized Beads)

## Master Epic
**clawd-diw [P0] epic** - Stacean v2.0: Complete Polish

---

## 🚀 Priority 1 (Must-Have)

### Mobile Optimization
| Bead ID | Title | Status |
|----------|--------|--------|
| clawd-xu7 [P1] | Mobile: Touch-Optimized Task Cards | open |
| clawd-8dr [P1] | Mobile: Responsive Kanban Layout | open |

**Description:**
- Implement tap → modal → status workflow (drag-drop doesn't work well on mobile)
- Vertical column stack on mobile, horizontal on desktop
- Collapsible columns with state persistence
- Quick column navigation

### Activity Logging
| Bead ID | Title | Status |
|----------|--------|--------|
| clawd-z1m [P1] | Activity: KV Storage Schema | open |
| clawd-ul0 [P1] | Activity Logging - KV Storage | open |

**Description:**
- Store activity history in task metadata
- Log status changes, priority updates, comments
- Display in TaskModal Activity tab
- Filter by activity type

### Testing & E2E
| Bead ID | Title | Status |
|----------|--------|--------|
| clawd-kse [P1] | Testing: E2E & Polish | open |

**Description:**
- Desktop tests (drag-drop, modal edits, concurrent edits)
- Mobile tests (tap workflow, column navigation)
- KV sync verification
- Performance (Lighthouse > 90)
- Accessibility (WCAG 2.1 AA)

---

## 🎨 Priority 2 (Nice-to-Have)

### Real-time Updates
| Bead ID | Title | Status |
|----------|--------|--------|
| clawd-e5p [P2] | Real-time: SSE Implementation | open |
| clawd-qfv [P2] | Real-time Updates - SSE/Polling | open |

**Description:**
- Replace 5s polling with Server-Sent Events
- Push-based updates for instant sync
- Event types: task.updated, task.created, activity.logged
- Auto-reconnect logic

### Sub-agent Tracking
| Bead ID | Title | Status |
|----------|--------|--------|
| clawd-ej1 [P2] | Sub-agents: Session Tracking | open |
| clawd-n7k [P2] | Sub-agent Tracking | open |

**Description:**
- Track which agents work on which tasks
- Session history per task
- Active sessions display
- Time tracking per agent

### Deliverables
| Bead ID | Title | Status |
|----------|--------|--------|
| clawd-t6s [P2] | Deliverables: File & URL Tracking | open |
| clawd-ce2 [P2] | Deliverables Tracking | open |

**Description:**
- File upload via Vercel Blob
- URL deliverables (PR links, etc.)
- TaskModal Deliverables tab
- File preview for images

### Documentation
| Bead ID | Title | Status |
|----------|--------|--------|
| clawd-106 [P2] | Docs: Update README & API | open |

**Description:**
- Update README.md for v2.0
- Create API.md with all endpoints
- Create ARCHITECTURE.md
- Create DEPLOYMENT.md

---

## 📊 Progress Summary

| Phase | Status | Beads |
|--------|---------|--------|
| ✓ Foundation | Complete | clawd-2ov, clawd-90z, clawd-9vk |
| ⏳ Mobile | 2 beads open | clawd-xu7, clawd-8dr |
| ⏳ Activity | 2 beads open | clawd-z1m, clawd-ul0 |
| ⏳ Testing | 1 bead open | clawd-kse |
| ⏳ Real-time | 2 beads open | clawd-e5p, clawd-qfv |
| ⏳ Sub-agents | 2 beads open | clawd-ej1, clawd-n7k |
| ⏳ Deliverables | 2 beads open | clawd-t6s, clawd-ce2 |
| ⏳ Docs | 1 bead open | clawd-106 |

**Total Remaining:** 12 beads
**P1 Critical:** 5 beads
**P2 Enhancement:** 7 beads

---

## 🎯 Tomorrow's Focus

### Sprint 1 (Morning): Mobile Optimization
1. clawd-xu7 - Touch-optimized task cards
2. clawd-8dr - Responsive Kanban layout

**Outcome:** Stacean is fully usable on mobile devices

### Sprint 2 (Afternoon): Activity Logging
3. clawd-z1m - KV storage schema
4. clawd-ul0 - Activity logging implementation

**Outcome:** Full activity history in TaskModal

### Sprint 3 (Evening): Testing
5. clawd-kse - E2E testing & polish

**Outcome:** Production-ready quality

---

## 📝 Duplicate Beads (Cleanup Needed)

| Duplicate | Keep | Delete |
|-----------|--------|---------|
| clawd-0fm | - | clawd-xu7 (more detailed) |
| clawd-3ai | - | clawd-kse (more detailed) |
| clawd-diw | - | clawd-bnq (duplicate epic) |
| clawd-p6w | - | clawd-xu7, clawd-8dr (split into 2) |
| clawd-mry | - | clawd-8dr (more detailed) |

**Action:** Delete duplicates after reviewing
