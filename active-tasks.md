# Active Task: Merge Focused UI into Main Page

**Date:** 2026-02-02
**Status:** 🚧 IN PROGRESS
**Priority:** High

## Issue

The `/focused` page has a great task-focused UI but:
- It's a separate page, not accessible from root `/`
- The root page shows a broken card grid layout
- User wants the Focused UI to be the **main** experience

## Solution

Merge `/focused` UI into `app/page.tsx` with a toggle to switch layouts:

### Changes:
- `app/page.tsx` - Rewritten with unified UI
- Added `viewMode` state: "focused" | "dashboard"
- Focused mode: Sidebar navigation, task list, agent view
- Dashboard mode: Original card grid (as fallback)
- Toggle button in sidebar/header to switch views

## Features

### Focused Mode (Default)
- Left sidebar with nav: Objectives | Agents | Energy | Live
- Main content area with task list or agent grid
- Atlas status indicator (online/offline)
- Current activity banner

### Dashboard Mode
- Header with status and view toggle
- Card grid showing Tasks, Agents, Quick Create
- Links to detailed views

## Usage

Default view is now **Focused Mode**. Toggle to Dashboard if needed.

## Files Modified
- `app/page.tsx` - Unified page with view toggle

## Next Steps
- [ ] Verify responsive mobile layout
- [ ] Test toggle between views
- [ ] Deploy to Vercel
