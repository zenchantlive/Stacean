# Blog App Structure

This folder now contains ALL files needed for the blog/dashboard app.

## Directories

- `app/` - Next.js App Router (pages, API routes)
- `components/` - React components (dashboard widgets)
- `lib/` - Shared utilities and integrations
- `hooks/` - React hooks
- `posts/` - Blog posts (markdown)
- `public/` - Static assets (images, screenshots)
- `e2e/` - End-to-end tests (Playwright)
- `tests/` - Unit tests (Vitest)
- `scripts/` - Build/utility scripts for the app
- `scripts-root/` - Root-level scripts that belong to blog
- `docs/` - PRDs, design docs, integration plans
- `debug/` - Debug scripts and test outputs
- `system/` - System integrations blog uses
  - `integrations/` - Vercel KV, Beads, etc.
  - `api-clients/` - External API clients (rtfmbro, etc.)
  - `tools/` - CLI tools (tracker, etc.)
  - `.beads/` - Beads CLI database and config
- `.agents/` - Agent session storage
- `.next/` - Next.js build output (gitignored)
- `test-results/` - Test results (gitignored)

## Configuration Files

- `.env.local` - Environment variables (BEADS_DIR, AGENTS_FILE)
- `vercel.json` - Vercel deployment config
- `package.json` - NPM dependencies
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

## Key Integrations

- **Beads CLI** - Local task/issue tracking via `bd` commands
- **Vercel KV** - Cloud key-value storage for tasks, agents, notes, ledger
- **Vercel Blob** - Cloud file storage for screenshots, assets
- **Next.js 14** - React framework with App Router
- **Framer Motion** - Animations and drag-and-drop
- **Tailwind CSS** - Utility-first styling

## Dashboard Widgets

1. **AtlasPulse** - Activity monitoring
2. **ScreenshotStream** - Image/capture feed
3. **LedgerFeed** - Activity log (KV-backed)
4. **EcosystemMap** - Project visualization
5. **FieldNotes** - Dashboard notes (KV-backed)
6. **TaskWidget** - Task management with:
   - Grid view (all tasks)
   - Deck view (agent-specific)
   - Drag-and-drop reordering
   - Priority-based queuing

## External Dependencies (Resolved)

Previously, the blog app had hardcoded dependencies on `/home/clawdbot/clawd/`:
- `.beads/` → now in `blog/system/.beads/`
- `.agents.json` → now in `blog/.agents/`
- System integrations → now in `blog/system/`

These are now configured via environment variables:
```
BEADS_DIR=/home/clawdbot/clawd/blog/system/.beads
AGENTS_FILE=/home/clawdbot/clawd/blog/.agents/.agents.json
```

## GitHub Repository

The GitHub repo (zenchantlive/Moltin) should now contain ONLY the `blog/` folder.
All agent-specific files (SOUL.md, AGENTS.md, skills/, research/, memory/) should
remain in the local `clawd/` workspace and NOT be committed.
