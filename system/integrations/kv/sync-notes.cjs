/**
 * Dashboard Notes Sync - Silent Mode
 * Updates notes-context.md for Atlas to read at startup
 * 
 * This runs automatically and updates the context file.
 * Atlas reads notes-context.md on every session start.
 */

const https = require('https');
const { readFile, writeFile } = require('fs/promises');

const WORKSPACE = '/home/clawdbot/clawd';
const API_URL = 'https://blog-wheat-mu-85.vercel.app/api/notes';
const SHORT_TERM_FILE = `${WORKSPACE}/short-term-notes.json`;
const ALL_NOTES_FILE = `${WORKSPACE}/all-notes.json`;
const NOTES_CONTEXT_FILE = `${WORKSPACE}/notes-context.md`;

function generateNoteId(text, time) {
  const str = `${text}:${time}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function fetchNotes() {
  return new Promise((resolve, reject) => {
    https.get(API_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function loadJson(path, def = []) {
  try { return JSON.parse(await readFile(path, 'utf-8')); } 
  catch { return def; }
}

async function saveJson(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2));
}

function formatNotesForContext(notes) {
  if (notes.length === 0) return '';
  
  const lines = ['## Dashboard Notes\n'];
  
  for (const note of notes) {
    const date = new Date(note.time).toLocaleDateString();
    const time = new Date(note.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    lines.push(`- **${date} ${time}**: "${note.text}"`);
  }
  
  return lines.join('\n');
}

async function sync() {
  // Fetch from KV
  let kvNotes;
  try {
    kvNotes = await fetchNotes();
  } catch {
    kvNotes = [];
  }
  
  // Load existing
  const [shortTerm, allNotes] = await Promise.all([
    loadJson(SHORT_TERM_FILE),
    loadJson(ALL_NOTES_FILE)
  ]);
  
  const existingIds = new Set(allNotes.map(n => n.id));
  
  // Check for new notes
  for (const note of kvNotes) {
    const id = generateNoteId(note.text, note.time);
    if (!existingIds.has(id)) {
      const entry = { id, text: note.text, time: note.time, category: 'general', firstSeen: new Date().toISOString(), read: false };
      allNotes.push(entry);
      shortTerm.unshift(entry);
    }
  }
  
  // Mark all as read
  for (const n of shortTerm) n.read = true;
  
  // Save
  await Promise.all([saveJson(SHORT_TERM_FILE, shortTerm), saveJson(ALL_NOTES_FILE, allNotes)]);
  
  // Update context file for Atlas
  const context = formatNotesForContext(shortTerm);
  await writeFile(NOTES_CONTEXT_FILE, context);
}

// Silent run - no console output
sync().catch(() => {});
