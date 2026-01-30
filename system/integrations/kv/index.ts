/**
 * KV Integration Module Index
 * Reusable KV utilities for Vercel KV/Upstash Redis
 * 
 * Usage:
 *   import { KVAdapter, DashboardNotes } from './system/integrations/kv';
 */

export { KVAdapter, createKVAdapter } from './adapter';
export {
  readDashboardNotes,
  getNoteById,
  getLatestNote,
  getNotesByCategory,
  formatNotesSummary,
  formatNotesForMemory,
  formatNotesForAI,
  createNotesAdapter,
  getNotesConfig,
  updateNotesConfig,
  type DashboardNote,
  type NoteLoadResult,
} from './dashboard-notes';

// Pre-configured adapters for common use cases
export {
  blogNotes,
  blogLedger,
  blogState,
  blogSessions,
} from './adapter';
