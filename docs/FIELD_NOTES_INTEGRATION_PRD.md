# Field Notes Integration PRD
## Making Atlas Aware of Dashboard Notes

**Version:** 1.0  
**Date:** 2026-01-28  
**Status:** Draft

---

## Overview

Integrate the Field Notes system (currently stored in Vercel KV/Redis) into Atlas's memory architecture so that notes left on the dashboard become actionable context for Atlas during conversations.

**Current State:** Notes are stored in KV but exist in isolation - only visible via the dashboard UI.

**Desired State:** Atlas reads notes on session start, surfaces relevant notes contextually during conversations, and can reference them naturally.

---

## Problem Statement

Jordan leaves notes on the dashboard for Atlas, but Atlas has no awareness of them. The notes represent valuable context (instructions, reminders, feedback) that should inform Atlas's behavior but currently goes unused.

---

## Goals

### Primary Goals
1. **Atlas Awareness** - Atlas reads notes from KV on session initialization
2. **Contextual Surfacing** - Atlas surfaces relevant notes when contextually appropriate
3. **Bidirectional Flow** - Notes become part of Atlas's memory ecosystem
4. **Non-Blocking** - Note reading doesn't slow down session startup

### Secondary Goals
5. **Note Acknowledgment** - Atlas can indicate it saw/understood a note
6. **Temporal Relevance** - Older notes fade from relevance over time
7. **Note Types** - Support different note categories (instructions, reminders, feedback)

---

## Non-Goals

- **Writing Notes** - UI stays on dashboard; only reading is implemented
- **Note Modification** - Atlas cannot edit/delete notes
- **Real-Time Sync** - Notes read at session start only (not live streaming)
- **Note Deletion** - KV handles TTL/cleanup independently

---

## User Stories

| ID | Story | Priority |
|----|-------|----------|
| US1 | As Jordan, I want to leave a note on the dashboard so Atlas knows my instructions | Must Have |
| US2 | As Atlas, I want to read notes on startup so I have context for the session | Must Have |
| US3 | As Atlas, I want to surface relevant notes when discussing related topics | Must Have |
| US4 | As Jordan, I want notes older than 24h to be less prominent to Atlas | Should Have |
| US5 | As Atlas, I want to acknowledge important notes without derailing conversation | Could Have |

---

## Technical Architecture

### Current Infrastructure
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Dashboard     │────▶│   Vercel KV     │────▶│   Redis/Upstash │
│   (Frontend)    │     │   (Storage)     │     │   (Backend)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Proposed Infrastructure
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Dashboard     │────▶│   Vercel KV     │────▶│   Redis/Upstash │
│   (Frontend)    │     │   (Storage)     │     │   (Backend)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Atlas Core    │────▶│   Memory System │
                        │   (New Reader)  │     │   (MEMORY.md)   │
                        └─────────────────┘     └─────────────────┘
```

### Data Flow

```
Session Start
    │
    ▼
┌──────────────────────┐
│  Read from KV        │
│  command-center:notes│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Parse & Validate    │
│  - JSON parse        │
│  - Timestamp check   │
│  - Deduplicate       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Load into Context   │
│  - Session memory    │
│  - Optional: MEMORY.md│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Surface as Needed   │
│  - Implicit awareness│
│  - Explicit reference│
└──────────────────────┘
```

---

## Data Schema

### KV Storage (Current)
```json
[
  "{\"text\":\"Leave a note for Atlas...\",\"time\":\"2026-01-29T02:53:14.556Z\"}",
  "{\"text\":\"Remember to check X\",\"time\":\"2026-01-28T10:00:00.000Z\"}"
]
```

### Note Structure
```typescript
interface DashboardNote {
  text: string;           // Note content
  time: string;           // ISO timestamp
  category?: 'instruction' | 'reminder' | 'feedback' | 'general'; // Future
}
```

### Memory Integration Format
```markdown
## Dashboard Notes (Session Start)
- **Note 1** (Today): "Leave a note for Atlas..."
- **Note 2** (Yesterday): "Remember to check X"
```

---

## Implementation Plan

### Phase 1: Foundation (MVP)
**Goal:** Atlas can read notes on session start

1. **Create Note Reader Module**
   - Location: `system/integrations/notes-reader.ts`
   - Function: `readDashboardNotes(): Promise<DashboardNote[]>`
   - Reads from KV, parses JSON, filters by recency

2. **Integrate into Session Startup**
   - Location: `system/sessions/session-init.ts`
   - Call note reader after KV connection verified
   - Load notes into session context (not MEMORY.md yet)

3. **Configuration**
   - Add env var: `ENABLE_DASHBOARD_NOTES=true`
   - Max notes to read: 20 (matches dashboard limit)
   - Age threshold: 7 days

### Phase 2: Contextual Surfacing
**Goal:** Atlas acknowledges notes naturally

1. **Note Awareness System**
   - Store notes in `session.notes`
   - When conversation topic matches note content → surface it

2. **Implicit Surfacing**
   - Atlas internally "knows" the notes
   - References them naturally in responses
   - Example: "I see you mentioned X in your notes..."

3. **Explicit Surfacing (Optional)**
   - Command: `/notes` → Lists all notes
   - Command: `/note last` → Shows most recent note

### Phase 3: Memory Integration (Optional)
**Goal:** Notes persist beyond session

1. **Selective MEMORY.md Updates**
   - Only "important" notes (instructional, not reminders) get saved
   - Daily note: "Jordan's dashboard notes: ..."
   - Weekly review for cleanup

2. **Note Aging**
   - Notes older than 24h → reduced relevance
   - Notes older than 7d → not loaded
   - Notes older than 30d → archived/deleted

---

## API Specification

### New Module: `notes-reader.ts`

```typescript
import { kv } from '@vercel/kv';

const NOTES_KEY = 'command-center:notes';
const MAX_NOTES = 20;
const MAX_AGE_DAYS = 7;

interface DashboardNote {
  text: string;
  time: string;
  category?: string;
}

export async function readDashboardNotes(): Promise<DashboardNote[]> {
  try {
    const raw = await kv.get<string[]>(NOTES_KEY);
    if (!raw) return [];
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
    
    return raw
      .map(n => JSON.parse(n) as DashboardNote)
      .filter(n => new Date(n.time) > cutoff)
      .slice(0, MAX_NOTES);
  } catch (error) {
    console.error('Failed to read dashboard notes:', error);
    return [];
  }
}

export function formatNotesForMemory(notes: DashboardNote[]): string {
  if (notes.length === 0) return '';
  
  const lines = ['## Dashboard Notes', ''];
  for (const note of notes) {
    const date = new Date(note.time).toLocaleDateString();
    lines.push(`- **${date}**: "${note.text}"`);
  }
  return lines.join('\n');
}
```

---

## Integration Points

### Session Initialization
```typescript
// In session-init.ts or equivalent
import { readDashboardNotes } from '@/system/integrations/notes-reader';

export async function initializeSession(session: Session) {
  // ... existing init ...
  
  // New: Load dashboard notes
  const notes = await readDashboardNotes();
  session.dashboardNotes = notes;
  
  if (notes.length > 0) {
    session.logger.info(`Loaded ${notes.length} dashboard notes`);
  }
}
```

### Contextual Reference (Example)
```typescript
// When responding to user
if (session.dashboardNotes?.length > 0) {
  // Check if any note is relevant to current topic
  const relevant = session.dashboardNotes.find(n => 
    currentMessage.includes(n.text.toLowerCase().substring(0, 20))
  );
  
  if (relevant) {
    response += `\n\n(Note: You mentioned "${relevant.text}" in your dashboard notes)`;
  }
}
```

---

## Edge Cases & Considerations

| Edge Case | Handling |
|-----------|----------|
| KV unavailable | Log error, continue without notes |
| Malformed note JSON | Skip note, log warning |
| Note with no text | Skip note |
| 1000+ notes | Limit to 20 most recent |
| All notes are old | Return empty array |
| Concurrent note writes | Read is atomic, no conflict |
| Notes during session | Not re-read until next session |

---

## Security Considerations

1. **Read-Only Access** - Atlas only reads, never writes to notes
2. **No PII Concerns** - Notes already in KV; no new exposure
3. **Environment Variables** - Use existing KV credentials
4. **Error Handling** - Fail gracefully, don't expose internals

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Notes loaded on startup | 100% of sessions | Session logs |
| Note relevance (user survey) | >70% "useful" | Manual review |
| Session startup time impact | <100ms overhead | Performance monitoring |
| Error rate on note read | <1% | Error logs |

---

## Future Enhancements (Out of Scope)

1. **Note Categories** - instruction/reminder/feedback tags
2. **Note Prioritization** - Important notes surface first
3. **Note Acknowledgment** - Atlas marks notes as "seen"
4. **Two-Way Sync** - Atlas can add notes (separate feature)
5. **Voice Notes** - Audio support (future)
6. **Reminders** - Notes trigger at specific times

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Vercel KV (Upstash) | ✅ Existing | Already configured |
| @vercel/kv package | ✅ Existing | Already in use |
| Session initialization hook | 🔶 Existing | Needs modification |
| Memory system (MEMORY.md) | ✅ Existing | Optional integration |

---

## Open Questions

1. **Q: Should all notes go to MEMORY.md or only important ones?**
   - A: Start with session-only, evaluate before MEMORY.md integration

2. **Q: How explicit should note awareness be?**
   - A: Implicit first, explicit if asked

3. **Q: What happens if user has 50 notes?**
   - A: Load last 20, rest ignored

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-28 | Atlas | Initial draft |

