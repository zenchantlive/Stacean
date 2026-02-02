# Atlas Cockpit Redesign Plan

## WHO IS THE USER?

**Jordan** - a human operator who has an AI agent named Atlas. Jordan needs to:
1. **Monitor** - Is Atlas working? What's it doing?
2. **Direct** - Give Atlas tasks, leave notes
3. **Review** - See what Atlas has done (ledger, screenshots)
4. **Manage** - Handle tasks, priorities, projects

## WHAT IS ATLAS COCKPIT?

A **command center** for monitoring and directing an AI agent. It's mission control.

## THE FUNDAMENTAL PROBLEM

The app tries to be TWO things:
1. **Glance Dashboard** (desktop) - See everything at once
2. **Focused App** (mobile) - One thing at a time

These are incompatible mental models. **Pick one.**

---

## MY RECOMMENDATION: UNIFIED CARD-BASED DESIGN

### The Core Insight

Users don't think in "widgets" - they think in **questions**:
- "Is Atlas working?" → Pulse
- "What did Atlas do?" → Ledger
- "What should Atlas do next?" → Tasks
- "What's Atlas looking at?" → Screenshots
- "What projects exist?" → Ecosystem
- "What did I want to tell Atlas?" → Notes

### The Design

**ONE layout that works everywhere:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Atlas Cockpit              [Status: 🟢 Online]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   PULSE     │  │   LEDGER    │  │    TASKS    │         │
│  │  ───────    │  │  ───────    │  │  ─────────  │         │
│  │  Online     │  │  10:23 Did X│  │  □ Task 1   │         │
│  │  Doing: Y   │  │  10:21 Did Y│  │  □ Task 2   │         │
│  │             │  │  10:19 Did Z│  │  □ Task 3   │         │
│  │  [Details]  │  │  [See All]  │  │  [+ Add]    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ SCREENSHOTS │  │  ECOSYSTEM  │  │   NOTES     │         │
│  │  ─────────  │  │  ─────────  │  │  ───────    │         │
│  │  [thumb]    │  │  • Proj 1   │  │  [input]    │         │
│  │  [thumb]    │  │  • Proj 2   │  │  [send]     │         │
│  │             │  │  • Proj 3   │  │             │         │
│  │  [Gallery]  │  │  [Manage]   │  │  [History]  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Cards are entry points, not destinations**
   - Each card shows a SUMMARY
   - Tap/click to expand into full view
   - Consistent interaction everywhere

2. **No separate "mobile" and "desktop" layouts**
   - Same cards, same hierarchy
   - Desktop: 2-3 columns of cards
   - Mobile: 1 column, scroll vertically
   - NO horizontal carousel (it's a solved problem: vertical scroll)

3. **Status always visible**
   - "Atlas is Online" should be in the header, not a card
   - This is the #1 thing users check

4. **Tasks is NOT special**
   - Remove the sidebar
   - Tasks card expands like any other card
   - The sub-views (Objective Stack, Agent Lens, Energy Map) are filters, not views

5. **Progressive disclosure**
   - Summary in card
   - Details on expand
   - Full management in dedicated route (/tasks, /ledger, etc.)

---

## SPECIFIC CHANGES

### 1. Kill the horizontal carousel (mobile)
**Why:** Horizontal scroll is disorienting. Users lose context.
**Replace with:** Vertical scroll, same cards as desktop, 1 column.

### 2. Kill the TaskTrackerNav sidebar
**Why:** It's inconsistent. Only Tasks has this. Confusing.
**Replace with:** When Tasks card is expanded, show filter buttons INSIDE the expanded view.

### 3. Add a persistent header
**Why:** "Atlas is Online" is the most important info. Should always be visible.
**Design:**
```
┌─────────────────────────────────────────────────┐
│ [Logo] Atlas Cockpit    🟢 Online • Last: 2m ago│
└─────────────────────────────────────────────────┘
```

### 4. Make cards expandable
**Why:** Current cards are static. Need to see details without navigating.
**How:** Tap card → expands in place (or modal on mobile).

### 5. Remove aurora blur effects
**Why:** Decorative, battery drain, no function.
**Replace with:** Subtle card shadows, clean background.

### 6. Add loading states
**Why:** Currently nothing shows while fetching.
**How:** Skeleton cards while loading.

### 7. Add error states
**Why:** Silent failures are bad UX.
**How:** Error card with retry button.

### 8. Fix the color system
**Why:** Colors are ad-hoc.
**How:** Define semantic tokens:
- `--status-online`: green
- `--status-offline`: red
- `--accent`: orange (for CTAs)
- `--surface`: dark gray
- `--text-primary`: white
- `--text-secondary`: gray

---

## IMPLEMENTATION ORDER

### Phase 1: Foundation (Day 1-2)
1. ✅ Fix the sidebar bug (DONE)
2. ✅ Fix desktop nav state (DONE)
3. [ ] Add persistent header with status
4. [ ] Remove horizontal carousel, make mobile vertical scroll
5. [ ] Remove aurora effects

### Phase 2: Cards (Day 3-4)
6. [ ] Redesign cards to be expandable
7. [ ] Add loading skeletons
8. [ ] Add error states
9. [ ] Kill TaskTrackerNav sidebar

### Phase 3: Polish (Day 5)
10. [ ] Define color tokens
11. [ ] Add keyboard navigation
12. [ ] Test on real mobile device
13. [ ] Performance audit (remove polling, add WebSocket option)

---

## WHAT SUCCESS LOOKS LIKE

Jordan opens Atlas Cockpit:
1. **Instantly sees:** Atlas is online (header)
2. **Glances at:** Cards showing summaries
3. **Taps:** Tasks card to see detail
4. **Adds:** A new task
5. **Closes:** Tasks, back to overview
6. **Checks:** Ledger for recent activity
7. **Done:** Closes app, confident Atlas is working

Total time: 30 seconds.

---

## SELF-CRITIQUE OF THIS PLAN

### What could be wrong:

1. **Maybe horizontal carousel IS right for mobile?**
   - Counter: No. Apple dropped it (App Library is vertical). Industry consensus is vertical scroll.

2. **Maybe the sidebar IS needed for Tasks?**
   - Counter: It's inconsistent. If Tasks needs it, so do other widgets. Either all or none.

3. **Maybe aurora effects add value?**
   - Counter: Only if they convey meaning. They don't. They're just pretty.

4. **Is this plan too aggressive?**
   - Counter: It's 5 days of work. That's reasonable for a fundamental UX fix.

### What I'm confident about:

1. **Vertical scroll > horizontal carousel** - This is industry consensus.
2. **Consistency matters** - One nav paradigm, not two.
3. **Status should be persistent** - It's the #1 user need.
4. **Cards should expand** - Progressive disclosure is good UX.

---

## FINAL VERDICT

**This app has good bones but bad UX decisions.**

The widget concept is sound. The visual design is appealing. But the navigation is confused, the mobile experience is untested, and basic UX patterns are missing.

**The fix is not more features. It's fewer, better-designed features.**

Kill the carousel. Kill the sidebar. Add a header. Make cards expandable. Done.

---

*Plan created by Clawdbot after deep user-focused analysis*
*Ready for implementation*
