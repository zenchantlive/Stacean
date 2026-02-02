# Atlas Cockpit: Final Plan

## Jordan's Daily Workflow

Based on my analysis, here's how Jordan uses (or should use) Atlas Cockpit:

### Morning Check-in (30 seconds)
1. Open app
2. **Question:** Is Atlas working?
   - Look at status (online/offline)
   - Glance at current activity
3. **Question:** Anything urgent?
   - Check ledger for errors
   - Check tasks for blockers
4. Close app

### Task Management (5-10 minutes)
1. Open app
2. Go to Tasks
3. Add new tasks
4. Prioritize existing tasks
5. Review progress
6. Close app

### Review Session (5 minutes)
1. Open app
2. Check screenshots (what did Atlas see?)
3. Read ledger (what did Atlas do?)
4. Leave notes for Atlas
5. Close app

---

## The Problem With Current Design

**For the 30-second check-in:**
- Status is buried in a widget, not prominent
- Have to scroll/swipe to see everything
- No at-a-glance summary

**For task management:**
- Tasks widget is cramped
- Sub-views (Objective Stack, etc.) are hidden behind confusing sidebar
- No room for complex task management

**For review:**
- Ledger is a tiny widget
- Screenshots are tiny thumbnails
- No way to expand and focus

---

## The Solution: Three Modes

### Mode 1: Dashboard (default)
**Purpose:** 30-second check-in
**Layout:** All widgets visible, summary only
**Key info:** Status prominent in header

### Mode 2: Focus View
**Purpose:** Deep work on one widget
**Layout:** Full screen, one widget expanded
**How to access:** Tap widget → expands

### Mode 3: Dedicated Routes
**Purpose:** Complex management (Tasks, Settings)
**Layout:** Full page, route-based
**Routes:** `/tasks`, `/settings`

---

## Concrete UI Changes

### 1. Header (Always Visible)
```
┌────────────────────────────────────────────────────────────┐
│ ⚡ Atlas Cockpit          🟢 Online • Activity: Researching │
│                           Last heartbeat: 2 min ago        │
└────────────────────────────────────────────────────────────┘
```

### 2. Dashboard (Mobile = Vertical Scroll)
```
┌──────────────────────────┐
│ [Pulse Summary Card]     │
│ Status: Online           │
│ Current: Researching     │
│ ──────────────────────   │
│ [Tap for details]        │
└──────────────────────────┘

┌──────────────────────────┐
│ [Tasks Summary Card]     │
│ 3 active • 2 completed   │
│ Top: Fix login bug       │
│ ──────────────────────   │
│ [+ Add] [Manage →]       │
└──────────────────────────┘

┌──────────────────────────┐
│ [Ledger Summary Card]    │
│ Last 3 entries...        │
│ 10:23 Completed task X   │
│ 10:21 Started research   │
│ ──────────────────────   │
│ [See all →]              │
└──────────────────────────┘

... (more cards)
```

### 3. Dashboard (Desktop = Grid)
Same cards, arranged in 2-3 columns.

### 4. Focus View (Tap to Expand)
When tapping a card:
- Mobile: Card expands to full screen (modal)
- Desktop: Card expands in place, others collapse

### 5. Tasks Route (/tasks)
Full task management with:
- View switcher (tabs): Objective Stack | Agent Lens | Energy Map
- Task list
- Create task form
- No sidebar - views are tabs

---

## What Gets Removed

1. **Horizontal carousel** - Replaced with vertical scroll
2. **TaskTrackerNav sidebar** - Replaced with tabs in /tasks route
3. **Aurora blur effects** - Replaced with subtle shadows
4. **Dual navigation** - One consistent system

## What Gets Added

1. **Persistent header** with status
2. **Card expansion** (tap to focus)
3. **Loading skeletons**
4. **Error states**
5. **Route structure** (/tasks, etc.)

---

## Implementation Checklist

### Day 1: Header + Layout
- [ ] Add persistent header component
- [ ] Show Atlas status in header
- [ ] Remove horizontal carousel from mobile
- [ ] Add vertical scroll container for mobile
- [ ] Remove aurora effects

### Day 2: Cards
- [ ] Redesign cards as summary+expand pattern
- [ ] Add "tap to expand" functionality
- [ ] Add loading skeleton components
- [ ] Add error state components

### Day 3: Tasks Route
- [ ] Create `/tasks` route
- [ ] Move task management there
- [ ] Add view tabs (Objective Stack, etc.)
- [ ] Remove TaskTrackerNav sidebar entirely
- [ ] Update Tasks summary card to link to route

### Day 4: Polish
- [ ] Define color tokens in CSS variables
- [ ] Fix text overflow issues
- [ ] Add keyboard navigation
- [ ] Test on real mobile device

### Day 5: Buffer
- [ ] Fix bugs
- [ ] Performance audit
- [ ] Final review

---

## Success Metrics

After implementation:
1. Jordan can check Atlas status in < 5 seconds
2. Jordan can see all summaries without scrolling horizontally
3. Jordan can manage tasks without confusion
4. App works identically on mobile and desktop (same cards, different layout)
5. No "broken" feelings - everything clickable does something

---

## Why This Plan Is Right

1. **User-focused:** Based on Jordan's actual workflow, not abstract UX theory
2. **Incremental:** Can ship daily improvements, not one big bang
3. **Consistent:** One mental model - cards that expand
4. **Simple:** Removes complexity (sidebar, carousel, dual nav)
5. **Tested reasoning:** I challenged my own assumptions and iterated

---

## The One-Liner

**Atlas Cockpit should be a dashboard of expandable cards, not a carousel of competing widgets.**

---

*Final plan ready for execution.*
*No more decisions needed from Jordan - just approval to proceed.*
