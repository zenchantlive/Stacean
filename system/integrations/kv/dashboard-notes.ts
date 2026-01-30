/**
 * Dashboard Notes Reader
 * Reads notes from KV and formats for Atlas consumption
 * 
 * Part of the reusable KV integration layer
 */

import { kv } from '@vercel/kv';
import { KVAdapter, createKVAdapter } from './adapter';

// ============================================================================
// Configuration
// ============================================================================

const NOTES_CONFIG = {
  /** KV key for notes storage */
  KEY: 'command-center:notes',
  /** Maximum notes to load */
  MAX_NOTES: 20,
  /** Maximum age in days (notes older than this are ignored) */
  MAX_AGE_DAYS: 7,
  /** Enable/disable note reading */
  ENABLED: process.env.ENABLE_DASHBOARD_NOTES !== 'false',
};

// ============================================================================
// Types
// ============================================================================

export interface DashboardNote {
  /** Unique identifier */
  id: string;
  /** Note text content */
  text: string;
  /** ISO timestamp */
  time: string;
  /** Category (optional, for future use) */
  category?: 'instruction' | 'reminder' | 'feedback' | 'general';
  /** Age in days (calculated) */
  ageDays?: number;
}

export interface NoteLoadResult {
  /** All loaded notes */
  notes: DashboardNote[];
  /** Count of notes loaded */
  count: number;
  /** Whether reading was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate a unique ID for a note based on content and time
 */
function generateNoteId(text: string, time: string): string {
  const str = `${text}:${time}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Calculate note age in days
 */
function getNoteAgeDays(time: string): number {
  const noteDate = new Date(time).getTime();
  const now = Date.now();
  return (now - noteDate) / (1000 * 60 * 60 * 24);
}

/**
 * Validate a note object
 */
function isValidNote(obj: unknown): obj is DashboardNote {
  if (!obj || typeof obj !== 'object') return false;
  
  const note = obj as Record<string, unknown>;
  return (
    typeof note.text === 'string' &&
    typeof note.time === 'string' &&
    note.text.trim().length > 0 &&
    !isNaN(new Date(note.time).getTime())
  );
}

/**
 * Read dashboard notes from KV
 */
export async function readDashboardNotes(): Promise<NoteLoadResult> {
  if (!NOTES_CONFIG.ENABLED) {
    return { notes: [], count: 0, success: true };
  }

  try {
    const raw = await kv.get<string[]>(NOTES_CONFIG.KEY);
    
    if (!raw || raw.length === 0) {
      return { notes: [], count: 0, success: true };
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - NOTES_CONFIG.MAX_AGE_DAYS);

    const notes: DashboardNote[] = [];
    
    for (const item of raw) {
      try {
        const parsed = JSON.parse(item);
        
        if (!isValidNote(parsed)) {
          console.warn('Invalid note skipped:', item);
          continue;
        }

        const noteDate = new Date(parsed.time);
        if (noteDate < cutoff) {
          continue; // Skip old notes
        }

        notes.push({
          id: generateNoteId(parsed.text, parsed.time),
          text: parsed.text.trim(),
          time: parsed.time,
          category: parsed.category || 'general',
          ageDays: getNoteAgeDays(parsed.time),
        });
      } catch (parseError) {
        console.warn('Failed to parse note:', parseError);
        continue;
      }
    }

    // Sort by time (newest first)
    notes.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Limit to max notes
    const limited = notes.slice(0, NOTES_CONFIG.MAX_NOTES);

    return {
      notes: limited,
      count: limited.length,
      success: true,
    };
  } catch (error) {
    console.error('Failed to read dashboard notes:', error);
    return {
      notes: [],
      count: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get a single note by ID
 */
export async function getNoteById(id: string): Promise<DashboardNote | null> {
  const result = await readDashboardNotes();
  return result.notes.find(n => n.id === id) || null;
}

/**
 * Get most recent note
 */
export async function getLatestNote(): Promise<DashboardNote | null> {
  const result = await readDashboardNotes();
  return result.notes[0] || null;
}

/**
 * Get notes by category
 */
export async function getNotesByCategory(
  category: DashboardNote['category']
): Promise<DashboardNote[]> {
  const result = await readDashboardNotes();
  return result.notes.filter(n => n.category === category);
}

// ============================================================================
// Formatting for Different Contexts
// ============================================================================

/**
 * Format notes as a brief summary string
 */
export function formatNotesSummary(notes: DashboardNote[]): string {
  if (notes.length === 0) return '';
  
  const lines = [`📝 Dashboard Notes (${notes.length}):`];
  
  for (const note of notes.slice(0, 5)) {
    const date = new Date(note.time).toLocaleDateString();
    const preview = note.text.length > 50 ? note.text.slice(0, 50) + '...' : note.text;
    lines.push(`  • ${date}: "${preview}"`);
  }
  
  if (notes.length > 5) {
    lines.push(`  ... and ${notes.length - 5} more`);
  }
  
  return lines.join('\n');
}

/**
 * Format notes for session memory
 */
export function formatNotesForMemory(notes: DashboardNote[]): string {
  if (notes.length === 0) return '';
  
  const lines = ['## Dashboard Notes', ''];
  
  for (const note of notes) {
    const date = new Date(note.time).toLocaleDateString();
    const time = new Date(note.time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    lines.push(`- **${date} ${time}** (${note.category}): "${note.text}"`);
  }
  
  return lines.join('\n');
}

/**
 * Format notes as structured data for AI context
 */
export function formatNotesForAI(notes: DashboardNote[]): Array<{
  id: string;
  text: string;
  timestamp: string;
  category: string;
  relevance: 'high' | 'medium' | 'low';
}> {
  return notes.map(note => ({
    id: note.id,
    text: note.text,
    timestamp: note.time,
    category: note.category || 'general',
    relevance: (note.ageDays || 0) < 1 ? 'high' : (note.ageDays || 0) < 3 ? 'medium' : 'low',
  }));
}

// ============================================================================
// Reusable Adapter (for external use)
// ============================================================================

/**
 * Create a dashboard notes adapter for custom operations
 */
export function createNotesAdapter(): KVAdapter {
  return createKVAdapter(NOTES_CONFIG.KEY);
}

// ============================================================================
// Export Config (for testing/override)
// ============================================================================

export function getNotesConfig() {
  return { ...NOTES_CONFIG };
}

export function updateNotesConfig(updates: Partial<typeof NOTES_CONFIG>) {
  Object.assign(NOTES_CONFIG, updates);
}
