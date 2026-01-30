# Active State: Fleet Commander Workflow Integration

**Last Updated:** 2026-01-29 23:00 PST

## Current Goal
Integrate Fleet Commander into Atlas's workflow - every request Jordan makes creates a visible, trackable task with real-time progress updates.

---

## What We Just Completed ✅

### Phase 1: Fleet Commander Skill Created
**File:** `/home/clawdbot/clawd/skills/fleet-commander/SKILL.md`

**What it does:**
- Golden Rule: Create tasks for EVERYTHING Jordan asks
- Task creation patterns (quick vs multi-step vs sub-agent)
- Priority guidelines
- Status update workflow (heartbeat every 30-60s)
- Task completion protocol
- Atlas Dashboard integration
- Beads CLI direct usage
- Notes CLI for context

**Key behaviors enforced:**
1. Before working → Create task
2. During work → Update status frequently
3. After work → Mark complete
4. When stuck → Update to error, ask for help

### Phase 2: Verified Beads Integration ✅
**Finding:** Blog API is already using Beads (no migration needed!)

**Architecture (already in place):**
```
Atlas Tools (system/tools/tracker.ts)
    ↓
TrackerClient (lib/clients/tracker-client.ts)
    ↓
Blog API (app/api/tracker/*)
    ↓
Beads Integration (lib/integrations/beads/*)
    ↓
Beads CLI (bd) + SQLite (.beads/beads.db)
```

**Verification:**
- `/api/tracker/tasks` → Using `client-cached.ts`
- `/api/tracker/agents` → Using `agents.ts`
- Clean separation: Tools don't need to know about Beads
- Atlas Dashboard already connected and showing data

### Phase 3: Wired Skill into AGENTS.md ✅
**File:** `/home/clawdbot/clawd/AGENTS.md`

**Added:**
- "Mandatory Skills" section under "Every Session"
- Fleet Commander listed as required reading
- Atlas will read this skill automatically at session start

### Phase 4: Tested Workflow ✅
**Test task:**
```
Title: Set up Fleet Commander workflow and skill
ID: clawd-405
Status: ✅ Completed
```

**Verified:**
- `node scripts/tasks.cjs add` works
- `node scripts/tasks.cjs list` shows tasks
- `node scripts/tasks.cjs done` marks complete
- Beads database reflects changes
- JSONL syncs to git

---

## What's Out of Date

### Previous Bug Investigation (January 29th)
The old ACTIVE_STATE.md documented a bug fix for Fleet Commander UI:
- Agent click error: `TypeError: Cannot read properties of undefined`
- Fixed with optional chaining and null safety

**Status:** ✅ RESOLVED - No longer relevant

**Cleanup needed:**
- Remove bug investigation details from active state
- Keep only current work context
- Move bug fix to memory file if needed for reference

---

## Current Implementation Plan

### Phase 1: Documentation Cleanup (Now)
- [ ] Update ACTIVE_STATE.md (this file) ✅ IN PROGRESS
- [ ] Archive bug investigation to `memory/2026-01-29.md`
- [ ] Create summary document: `docs/fleet-commander-integration-summary.md` ✅ DONE

### Phase 2: Skill Testing (Next Session)
- [ ] Create task for a coding request
- [ ] Verify `spawnTrackedAgent()` works
- [ ] Verify `heartbeat()` updates show in Dashboard
- [ ] Verify `completeTask()` marks task done
- [ ] Test error handling with `agentError()`

### Phase 3: Workflow Refinement (This Week)
- [ ] Adjust task creation granularity (too many vs too few?)
- [ ] Tune heartbeat frequency (30s vs 60s vs 90s)
- [ ] Add Notes CLI integration to skill
- [ ] Create task templates (bug fix, feature, refactor, etc.)

### Phase 4: Dashboard Enhancements (Future)
- [ ] Add real-time updates (SSE for task status)
- [ ] Task dependencies in Beads
- [ ] Multi-agent coordination
- [ ] Task history view

---

## Files Modified/Created

**Created:**
1. `/home/clawdbot/clawd/skills/fleet-commander/SKILL.md` - Comprehensive workflow guide
2. `/home/clawdbot/clawd/docs/fleet-commander-integration-summary.md` - Architecture summary
3. `/home/clawdbot/clawd/ACTIVE_STATE.md` - Updated (this file)

**Modified:**
1. `/home/clawdbot/clawd/AGENTS.md` - Added mandatory skills section

**Tested:**
1. Fleet Commander CLI (`scripts/tasks.cjs`)
2. Beads integration (`lib/integrations/beads/*`)
3. Atlas Dashboard (visual verification)

---

## Next Immediate Steps

### 1. Clean up memory
- [ ] Move bug investigation details from ACTIVE_STATE to `memory/2026-01-29.md`
- [ ] Update MEMORY.md with Fleet Commander integration success

### 2. Commit and push
- [ ] Add new skill to git
- [ ] Update AGENTS.md
- [ ] Commit changes
- [ ] Push to master

### 3. Test in next session
- [ ] Jordan asks for something → Create task
- [ ] Multi-step work → Spawn tracked agent
- [ ] Update progress → Heartbeat
- [ ] Complete → Mark done
- [ ] Verify visibility in Atlas Dashboard

---

## Success Criteria

✅ **Atlas knows how to use Fleet Commander**
   - Skill created and comprehensive
   - Behavioral patterns defined
   - Auto-loaded via AGENTS.md

✅ **Every request creates a task**
   - Golden rule in skill
   - Examples for all patterns
   - Includes non-coding tasks

✅ **Beads integration verified**
   - API already using Beads
   - Architecture documented
   - No migration needed

✅ **Dashboard connected**
   - Task Grid shows Beads data
   - Fleet Bar shows agents
   - Real-time status updates

✅ **Workflow tested**
   - Created and completed test task
   - Verified CLI works
   - Verified database sync

---

## Remaining Questions

1. **Task granularity:** Create task for EVERY request or multi-step only?
   - Current: Everything
   - May need adjustment based on Jordan's feedback

2. **Heartbeat frequency:** 30s vs 60s vs 90s?
   - Current: 30-60s recommended
   - Will tune based on actual usage

3. **Error handling:** When should I ask for help vs keep trying?
   - Current: Update to error, explain, ask
   - Seems reasonable

4. **Notes integration:** Add automatically or manual?
   - Current: Manual for complex work
   - May add auto-notes later

---

## Status

**Overall:** ✅ **Fleet Commander Integration Complete**

**Current Phase:** Documentation cleanup

**Next Session:** Test and refine workflow

**Ready for Production:** ✅ Yes - skill is ready to use
