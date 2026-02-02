# Atlas Cockpit - Brutal Critique

*Reviewed: 2026-02-01 by Clawdbot in Linus mode*

---

## 🔴 CRITICAL ISSUES

### 1. Mobile Layout Is Completely Broken in Testing
**Severity: CRITICAL**

When setting viewport to 375x812, the app still renders desktop layout. This suggests:
- Either the Tailwind `md:` breakpoint (768px) isn't being respected
- Or the CSS isn't loading properly in headless mode
- Need to test on actual device

**Linus says:** "You can't ship mobile-first if mobile doesn't work."

### 2. Two Navigation Systems That Don't Talk
**Severity: HIGH**

- **Top nav** (desktop): Pulse, Screenshots, Ledger, Ecosystem, Notes, Tasks
- **TaskTrackerNav** (inside TaskWidget): Objective Stack, Agent Lens, Energy Map, Search

These are completely separate state machines. Clicking "Tasks" in top nav shows sidebar, but the sidebar's buttons don't affect the top nav. **Confusing mental model.**

**Linus says:** "Pick one navigation paradigm and commit to it."

### 3. `activeIndex` State Is A Lie On Desktop
**Severity: HIGH**

Desktop shows ALL widgets in a grid simultaneously, but `activeIndex` pretends only one is "active". The state doesn't match the UI.

```javascript
// Desktop shows ALL widgets but activeIndex says only one is active
// This is conceptual garbage
<TaskWidget isActive={activeIndex === 5} />  // But user can see all 6!
```

**Linus says:** "Your state model is lying to your UI."

---

## 🟠 MAJOR ISSUES

### 4. Text Overflow: "ROJECT ECOSYSTEM"
**Severity: MEDIUM**

The "PROJECT ECOSYSTEM" header is getting clipped to "ROJECT ECOSYSTEM". Classic CSS overflow problem.

**Fix:** Add `overflow: hidden; text-overflow: ellipsis;` or ensure container is wide enough.

### 5. Empty States Are Lazy
**Severity: MEDIUM**

- "No captures yet." - Okay, but what should I do?
- "No notes yet. Leave one above!" - At least this has a CTA
- "Initializing" - What is initializing? For how long?

**Linus says:** "Empty states should guide, not just inform."

### 6. The Aurora Blurs Are CPU Hogs
**Severity: MEDIUM**

```css
.aurora {
  /* Giant blurred gradients that serve no purpose */
  blur-3xl, blur-[120px]
}
```

These are purely decorative and will murder battery on mobile. They add visual "interest" but no function.

**Linus says:** "Pretty is not a feature. Performance is."

### 7. No Loading States
**Severity: MEDIUM**

When `fetchTasks()` or `fetchAgents()` is running, nothing indicates loading. The UI just shows stale data until new data arrives.

### 8. Polling Every 5 Seconds Is Wasteful
**Severity: MEDIUM**

```javascript
const interval = setInterval(fetchData, 5000);
```

Why poll? Use WebSockets or at minimum, exponential backoff. This is 2026, not 2016.

---

## 🟡 MINOR ISSUES

### 9. Inconsistent Spacing
- Card padding varies between widgets
- Some use `pt-16 px-6`, others don't
- Grid gap is `6` (24px) everywhere - no visual hierarchy

### 10. Color System Is Ad-Hoc
```css
#8ea89e  /* "sage" - used for active states */
#6fa5a2  /* "teal" - used for gradients */
#F97316  /* Orange - used for... Pulse? nav? */
#9a8f86  /* Muted text */
#0f0d0c  /* Background */
```

These colors exist but there's no design token system. They're hardcoded everywhere.

### 11. No Keyboard Navigation
Can't tab through the interface. No focus states visible. Accessibility failure.

### 12. No Error Boundaries
If `fetchTasks()` fails, what happens? The app just silently fails.

### 13. The "Create Task" Button Exists In 3 Places
- FAB (mobile)
- Sidebar (desktop, in Tasks view)
- TaskWidget header

Is this intentional redundancy or design debt?

---

## 🟢 WHAT'S ACTUALLY GOOD

### 1. The Visual Aesthetic
The dark theme with sage/teal accents is cohesive. It looks premium.

### 2. The Widget Concept
Six distinct widgets (Pulse, Screenshots, Ledger, Ecosystem, Notes, Tasks) is a reasonable information architecture.

### 3. The Snap Scroll (Mobile Intent)
The horizontal snap scroll is the right UX pattern for mobile. IF it works.

### 4. Project Cards Are Clickable Links
The Asset-Hatch, Catwalk Live cards actually link to real URLs. That's good.

---

## QUESTIONS THAT NEED ANSWERS

1. **What IS Atlas Cockpit?** The app doesn't explain itself. Is it a monitoring dashboard? A project manager? A notes app?

2. **Who is the user?** A developer? A project manager? An AI agent?

3. **Why are there 6 widgets?** What's the relationship between them?

4. **Why does Tasks get special treatment?** It has its own sidebar with sub-views. Why not the others?

5. **What does "UNPLUGGED (LOCAL ONLY)" mean?** Is cloud sync coming? Is this a teaser or a broken feature?

---

## RECOMMENDATIONS

### Immediate (Fix Now)
1. Fix mobile responsive breakpoints
2. Fix "PROJECT ECOSYSTEM" text overflow
3. Add loading states

### Short-term (This Week)
1. Unify navigation model - pick grid OR carousel, not both
2. Add keyboard navigation
3. Add error boundaries

### Long-term (This Month)
1. Define design tokens properly
2. Replace polling with WebSockets
3. Add onboarding/explanation of what the app does

---

## VERDICT

**Current state: 4/10 - "It's dark and has gradients"**

The app looks polished at first glance but falls apart under scrutiny. The dual navigation paradigm is confusing, the mobile experience is untested, and basic UX patterns (loading, errors, empty states) are missing.

This needs a week of focused UX work, not more features.

*— Clawdbot, channeling Linus*
