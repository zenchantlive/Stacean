# Active Task: Tasks Not Displaying on Vercel Deployment

**Date:** 2026-02-02
**Status:** UNRESOLVED
**Priority:** High

## Issue Description

Tasks stored in Vercel KV (Redis) are not visible on the Vercel deployment frontend. The API returns data locally but the deployed version either:
- Returns empty array, OR
- Frontend fails to render tasks

## Environment

- **Local:** http://localhost:3000 (connected to modern-panda-43486.upstash.io)
- **Vercel Project:** zenchantlives-projects/blog
- **Latest Deployment:** https://blog-krg3bmqll-zenchantlives-projects.vercel.app

## What We Tried

### 1. Connected Real KV
- Linked to Vercel project "blog" (not "stacean-repo")
- Pulled credentials: `npx vercel link --project=blog --yes && npx vercel env pull`
- Verified local server uses real KV (not mock mode)
- Created test task via API: appeared in local `/api/tracker/tasks`

### 2. Frontend Code
- `TaskDisplay` component fetches from `/api/tracker/tasks`
- Sorts by priority, handles loading/empty states
- Renders task cards with priority badges and checkboxes
- Added CSS for `.task-list`, `.task-card`, `.task-main`, etc.

### 3. Deployment
- Pushed to `ux/integrated-dashboard` branch (commit 707b5d5)
- Vercel auto-deployed to preview URL

## What Failed

- **Frontend displays "No tasks yet"** despite KV containing 40+ tasks
- **API returns 401 on Vercel** when accessed directly (requires auth)
- **Unable to verify API response** on Vercel deployment due to authentication wall
- **Root cause unknown** - could be:
  - API returning empty on Vercel
  - Frontend fetch failing silently
  - CSS rendering issue (tasks exist but hidden)
  - KV not accessible from Vercel server-side
  - Different KV namespace/prefix on Vercel vs local

## Observed Behavior

### Local (Working)
```
curl http://localhost:3000/api/tracker/tasks
→ Returns 40+ tasks including "Real-time sync test via KV"
```

### Vercel (Not Working)
```
curl https://blog-krg3bmqll-zenchantlives-projects.vercel.app/api/tracker/tasks
→ 401 Authentication Required
```

### Frontend on Vercel
- Shows "No tasks yet" empty state
- Unable to debug further without access to API response

## Files Modified

- `app/focused/page.tsx` - TaskDisplay component with fetch logic
- `app/focused.css` - Task list/card styles
- `.env.local` - KV credentials from blog project

## Questions to Answer

1. Does the Vercel server-side API return tasks or empty array?
2. Is there a different KV endpoint/credentials for Vercel server-side?
3. Are there CORS issues blocking frontend fetch on Vercel domain?
4. Is the KV_READ_ONLY_TOKEN causing read issues?

## Next Steps

- Need better debugging tools to inspect Vercel API response
- Consider adding logging/monitoring to API route
- Try deploying to production environment (not preview)
- Verify KV credentials are correctly set in Vercel project settings
