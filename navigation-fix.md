---
title: Unify navigation and fix competing nav systems
description: |
  Current state has multiple conflicting navigation systems that cause UX chaos:
  
  **Mobile issues:**
  - Main page has bottom dock AND task widget has top dock
  - Navigation is confusing with multiple active indicators
  
  **Desktop issues:**
  - Main page has top nav bar
  - TaskTrackerNav has left rail that shows on main page
  - ActiveTaskBar component exists but is never used
  - Desktop nav uses scrollIntoView() but no state persistence
  
  **Architecture problems:**
  - Fragmented navigation with no unified paradigm
  - Orphaned ActiveTaskBar component (never integrated)
  - Phone container still forces tiny layout on desktop

### Tasks

#### Remove TaskTrackerNav from main page
- Delete left rail navigation from app/page.tsx
- Main page should only have unified top/bottom nav

#### Remove ActiveTaskBar orphan
- ActiveTaskBar.tsx exists but is never used anywhere
- Delete the component file entirely

#### Fix phone container CSS
- Remove max-width: 400px constraint from desktop
- Make .app-container truly responsive full-width

#### Implement unified navigation state
- Add proper active view tracking across entire app
- Desktop nav buttons should maintain selection state
- Mobile dock should show active view clearly

#### Fix mobile dock spacing
- Ensure bottom dock doesn't cover content
- Add proper safe area insets

#### Fix desktop nav interaction
- Fix scrollIntoView() to work with proper state
- Add visual feedback for active section

impact: critical
priority: urgent
status: open
