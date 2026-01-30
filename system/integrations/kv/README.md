# KV Integration Layer
## Reusable Utilities for Vercel KV/Upstash Redis

**Module Location:** `/home/clawdbot/clawd/system/integrations/kv/`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KV Integration Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  adapter.ts │  │dashboard-   │  │  index.ts   │            │
│  │             │  │  notes.ts   │  │             │            │
│  │ KVAdapter   │  │             │  │  Exports +  │            │
│  │ Class       │  │ Notes       │  │  Pre-config │            │
│  │             │  │ Reader      │  │  Adapters   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sync Scripts - Load Notes into Memory

### Quick Sync (Standalone)
```bash
node system/integrations/kv/sync-notes.cjs
```

This fetches notes from the dashboard API and updates `MEMORY.md` with the latest notes.

### Start Script (Integrate into Atlas Startup)
```bash
./system/integrations/kv/start-atlas.sh [args...]
```

This script:
1. Syncs dashboard notes into MEMORY.md
2. Starts Clawdbot with updated context

### As Library (TypeScript)
```typescript
import { readDashboardNotes, formatNotesForMemory } from './integrations/kv/dashboard-notes';

// Load notes
const result = await readDashboardNotes();
const formatted = formatNotesForMemory(result.notes);

// Append to MEMORY.md or use directly
```

---

## adapter.ts - Core Adapter

The `KVAdapter` class provides a generic interface for all KV operations.

### Basic Usage

```typescript
import { KVAdapter } from './system/integrations/kv';

// Create adapter for a specific key prefix
const notes = new KVAdapter({ prefix: 'command-center:notes' });
const tasks = new KVAdapter({ prefix: 'app:tasks' });

// Key-Value operations
await notes.set('user1', { name: 'Jordan' });
const data = await notes.get<{ name: string }>('user1');

// Counter operations
const count = await tasks.incr('task-counter');
```

### API Reference

| Method | Description |
|--------|-------------|
| `get<T>(key)` | Get value by key |
| `set(key, value, ttl?)` | Set value with optional TTL |
| `delete(key)` | Delete a key |
| `exists(key)` | Check if key exists |
| `incr(key)` | Increment counter |
| `decr(key)` | Decrement counter |
| `getList<T>(key, options?)` | Get JSON array list |
| `addToList<T>(key, item, maxSize?)` | Add to list (prepend) |
| `getSortedSet(key, limit?)` | Get sorted set items |
| `addToSortedSet(key, item, score?)` | Add to sorted set |
| `ping()` | Health check |

---

## dashboard-notes.ts - Notes Reader

Specialized reader for the Field Notes system.

### Basic Usage

```typescript
import { readDashboardNotes, formatNotesForAI } from './system/integrations/kv';

// Load notes at session start
const result = await readDashboardNotes();

if (result.success && result.notes.length > 0) {
  // Format for AI context
  const aiNotes = formatNotesForAI(result.notes);
  
  // Or for memory file
  const memory = formatNotesForMemory(result.notes);
}
```

### API Reference

| Function | Description |
|----------|-------------|
| `readDashboardNotes()` | Load all recent notes |
| `getNoteById(id)` | Get single note |
| `getLatestNote()` | Get most recent note |
| `getNotesByCategory(cat)` | Filter by category |
| `formatNotesSummary(notes)` | Human-readable summary |
| `formatNotesForMemory(notes)` | For MEMORY.md |
| `formatNotesForAI(notes)` | Structured for AI context |

---

## Pre-Configured Adapters

```typescript
import { blogNotes, blogLedger, blogState, blogSessions } from './system/integrations/kv';

// Use directly without configuration
const notes = await blogNotes.getList('notes');
await blogLedger.addToSortedSet('entries', { id: '1', message: 'Hi' });
```

---

## Creating Custom Adapters

```typescript
import { createKVAdapter } from './system/integrations/kv';

// Task tracker (future feature)
const tasks = createKVAdapter('app:tasks');
await tasks.addToList('pending', { id: '1', title: 'Fix bug', created: new Date().toISOString() });

// User preferences
const prefs = createKVAdapter('user:prefs');
await prefs.set('jordan', { theme: 'dark', notifications: true });

// Analytics events
const analytics = createKVAdapter('app:analytics');
await analytics.addToSortedSet('events', { id: '1', event: 'pageview' });
```

---

## Type Safety

```typescript
interface Task {
  id: string;
  title: string;
  status: 'pending' | 'done';
  created: string;
}

const tasks = createKVAdapter<{ prefix: 'app:tasks' }>({ prefix: 'app:tasks' });

// Type-safe operations
await tasks.addToList('list', { 
  id: '1', 
  title: 'Test', 
  status: 'pending',
  created: new Date().toISOString()
} as Task);
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_DASHBOARD_NOTES` | Enable note reading | `true` |
| `KV_REST_API_URL` | Upstash REST URL | (required) |
| `KV_REST_API_TOKEN` | Upstash auth token | (required) |

---

## File Structure

```
system/integrations/kv/
├── index.ts           # Main export + re-exports
├── adapter.ts         # KVAdapter class (reusable core)
├── dashboard-notes.ts # Field Notes specific reader
├── sync-notes.cjs     # Standalone sync script
└── start-atlas.sh     # Start script with note sync
```

---

## Sync Scripts - Load Notes into Memory

### Quick Sync (Standalone)
```bash
node system/integrations/kv/sync-notes.cjs
```

This fetches notes from the dashboard API and updates `MEMORY.md` with the latest notes.

### Start Script (Integrate into Atlas Startup)
```bash
./system/integrations/kv/start-atlas.sh [args...]
```

This script:
1. Syncs dashboard notes into MEMORY.md
2. Starts Clawdbot with updated context

---

## Adding to New Features

### For Task Tracker (future)

```typescript
import { KVAdapter, createKVAdapter } from '../integrations/kv';

const taskAdapter = createKVAdapter('app:tasks');

export async function createTask(title: string) {
  const task = {
    id: crypto.randomUUID(),
    title,
    status: 'pending',
    created: new Date().toISOString(),
  };
  
  await taskAdapter.addToList('pending', task);
  return task;
}

export async function getPendingTasks() {
  return taskAdapter.getList('pending');
}
```

### For Event Logging

```typescript
import { KVAdapter } from '../integrations/kv';

const events = new KVAdapter({ prefix: 'app:events' });

export async function logEvent(type: string, data: Record<string, unknown>) {
  await events.addToSortedSet('all', {
    id: crypto.randomUUID(),
    type,
    data,
    timestamp: new Date().toISOString(),
  });
}
```

---

## Error Handling

All methods return `null`, `false`, or empty arrays on error rather than throwing:

```typescript
const result = await notes.get('nonexistent');
// result === null (no error thrown)

const success = await notes.set('key', 'value');
// success === false if KV is down (no error thrown)
```

---

## Testing

```typescript
// Mock the module
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    // ...
  },
}));
```

