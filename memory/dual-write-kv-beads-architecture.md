# Dual-Write Architecture: KV + Beads Sync

**Date:** 2026-01-31
**Status:** ✅ Working on Vercel

---

## Problem

Vercel serverless functions can't run the `bd` CLI (no file system, no binaries, no database). This caused:
- 30-second timeouts when API tried to use Beads client
- Tasks not showing on Vercel deployment
- No real-time updates on production

---

## Solution: Dual-Write Pattern

```
Create Task → KV (production) + Beads (local tracking)
Update Task → KV (production) + Beads (local tracking)
Delete Task → KV (production) + Beads (local tracking)
```

### How It Works

**Local Development (localhost):**
1. Create task via API or CLI
2. Task written to **KV** (for production sync)
3. Task ALSO written to **Beads** (for Fleet Commander)
4. Both sources stay in sync automatically

**Production (Vercel):**
1. Create task via API
2. Task written to **KV** only
3. Beads mirror attempt fails silently (no CLI available)
4. Frontend gets real-time updates via KV

---

## Files Changed

### `blog/lib/integrations/kv/tracker.ts`
- **Primary task storage** (KV/Redis)
- Added `project` field to `Task`, `CreateTaskInput`, `UpdateTaskInput`
- Added `mirrorToBeads()` helper - best-effort sync to Beads
- Automatically mirrors all CRUD operations to Beads (when available)

### `blog/app/api/tracker/tasks/route.ts`
- Changed from `lib/integrations/beads/client-cached` to `lib/integrations/kv/tracker`
- Now uses KV for all operations (real-time)
- Beads sync handled by KV tracker internally

### `blog/app/api/tracker/tasks/[id]/route.ts`
- Changed from `lib/integrations/beads/client-cached` to `lib/integrations/kv/tracker`
- Now uses KV for all operations (real-time)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CREATE TASK                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────┐              ┌──────────┐
   │   KV    │              │  Beads   │
   │ (prod)  │              │ (local)  │
   │ @vercel │              │   bd     │
   └────┬────┘              └────┬─────┘
        │                        │
        ▼                        ▼
   Real-time updates       Fleet Commander
   (instant sync)          (CLI tracking)
```

---

## Benefits

### Production
- ✅ Real-time KV updates (instant sync via @vercel/kv)
- ✅ No CLI dependencies
- ✅ No file system requirements
- ✅ Works on Vercel serverless functions

### Local Development
- ✅ Fleet Commander CLI works with Beads
- ✅ Tasks sync to both systems automatically
- ✅ KV ready for production deployment
- ✅ Beads for local tracking and management

### No Manual Sync Needed
- Tasks you create locally are in BOTH systems
- When you push to Vercel, tasks are already in KV
- No sync scripts, no GitHub Actions required

---

## Environment Variables Required

For Vercel:
- `KV_URL` - Vercel KV/Upstash Redis URL
- `KV_REST_API_URL` - KV REST API URL
- `KV_REST_API_TOKEN` - KV REST API token
- `KV_REST_API_READ_ONLY_TOKEN` - KV read-only token
- `REDIS_URL` - Standard Redis URL

---

## Key Implementation Details

### Beads Mirroring (Best-Effort)

```typescript
async function mirrorToBeads(action: 'create' | 'update' | 'delete' | 'close', task: Task) {
  // Skip on Vercel (no Beads CLI available)
  if (process.env.VERCEL) return;

  try {
    // Sync to Beads
    // ...
  } catch (error) {
    // Silently fail - not critical
  }
}
```

**Why it works:**
- On localhost: Beads CLI exists → syncs successfully
- On Vercel: `process.env.VERCEL` is set → skips sync
- If Beads fails elsewhere → caught and ignored (not critical)

### Status Mapping

Beads uses different status values:
- `todo` → `open`
- `in-progress` → `in_progress`
- `review` → `review`
- `done` → `closed`

KV tracker maps these automatically when mirroring.

### Priority Mapping

Beads uses numeric priorities (0-4), KV uses strings:
- `urgent` → `0`
- `high` → `1`
- `medium` → `2`
- `low` → `3`

KV tracker maps these automatically when mirroring.

---

## Future Considerations

### Two-Way Sync (If Needed)

If we ever want API changes to sync back to Beads:
- Add webhook listener on Beads changes
- Or use GitHub Action to sync on push
- Currently not needed (Beads is read-only in production)

### Beads on Vercel (Alternative Approach)

If we want full Beads support on Vercel:
- Use Beads REST API (not CLI)
- Requires Beads server deployment
- More complexity than dual-write approach

---

## Lessons Learned

1. **Serverless can't run CLIs** - No file system, no binaries, no persistent DB files
2. **Dual-write beats manual sync** - Keep both sources in sync automatically
3. **Best-effort is okay** - Beads mirror isn't critical, can fail silently
4. **KV for production, Beads for local** - Play to each system's strengths
5. **Ask before changing** - Don't switch from KV to Beads without understanding the architecture

---

## Deployment

**Branch:** `fix/beads-client-cwd`

**Commits:**
- `f300038` - fix(tracker): add project field to Task types
- `172a5fa` - feat(tracker): use KV with Beads mirroring (dual-write)
- `d1d6943` - Revert "fix(tracker): use Beads integration instead of KV"
- `619e59e` - fix(tracker): use Beads integration instead of KV (REVERTED)

**Merged to main:** Pending

---

## Testing

### Vercel Production
- ✅ Tasks load on dashboard
- ✅ Real-time updates work
- ✅ No timeout errors
- ✅ KV reads/writes successfully

### Local Development
- ✅ Fleet Commander CLI works with Beads
- ✅ Tasks sync to both KV and Beads
- ✅ No errors when Beads mirrors

---

## References

- KV Integration: `blog/lib/integrations/kv/tracker.ts`
- Beads Integration: `blog/lib/integrations/beads/client.ts`
- API Routes: `blog/app/api/tracker/tasks/*`
- Vercel KV Docs: https://vercel.com/docs/storage/vercel-kv
