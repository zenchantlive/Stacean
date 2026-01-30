/**
 * Atlas Startup - Dashboard Notes Integration
 * 
 * This script loads dashboard notes into context when Atlas starts.
 * Run this script before or alongside Clawdbot startup.
 * 
 * Usage:
 *   node system/integrations/kv/startup-notes.cjs
 *   
 * Or include in your shell profile/alias:
 *   alias atlas='node /home/clawdbot/clawd/system/integrations/kv/startup-notes.cjs && clawdbot'
 */

const https = require('https');
const { readFile, writeFile } = require('fs/promises');
const { spawn } = require('child_process');

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

async function loadNotesForStartup() {
  console.log('📝 Loading dashboard notes for Atlas startup...\n');
  
  // Fetch fresh from KV
  let kvNotes;
  try {
    kvNotes = await fetchNotes();
  } catch (err) {
    console.log(`  ⚠️  Could not fetch from KV: ${err.message}`);
    console.log('  Falling back to cached notes...\n');
    kvNotes = [];
  }
  
  // Load existing data
  const [shortTerm, allNotes] = await Promise.all([
    loadJson(SHORT_TERM_FILE),
    loadJson(ALL_NOTES_FILE)
  ]);
  
  const existingIds = new Set(allNotes.map(n => n.id));
  const newNotes = [];
  
  // Find new notes from KV
  for (const note of kvNotes) {
    const id = generateNoteId(note.text, note.time);
    if (!existingIds.has(id)) {
      const entry = { id, text: note.text, time: note.time, category: 'general', firstSeen: new Date().toISOString(), read: false };
      newNotes.push(entry);
      allNotes.push(entry);
      shortTerm.unshift(entry);
    }
  }
  
  // Mark all as read for this session
  for (const n of shortTerm) n.read = true;
  
  // Save updates
  await Promise.all([saveJson(SHORT_TERM_FILE, shortTerm), saveJson(ALL_NOTES_FILE, allNotes)]);
  
  // Generate context file for Atlas
  const context = formatNotesForContext(shortTerm);
  await writeFile(NOTES_CONTEXT_FILE, context);
  
  console.log('✅ Notes loaded for Atlas');
  console.log(`   New notes: ${newNotes.length}`);
  console.log(`   Total in session: ${shortTerm.length}`);
  console.log(`   Archive size: ${allNotes.length}`);
  console.log(`   Context file: ${NOTES_CONTEXT_FILE}`);
  
  if (newNotes.length > 0) {
    console.log('\n📝 New notes from dashboard:');
    for (const note of newNotes) {
      const date = new Date(note.time).toLocaleDateString();
      console.log(`   • ${date}: "${note.text}"`);
    }
  }
  
  return { shortTerm: shortTerm.length, newNotes: newNotes.length, allNotes: allNotes.length };
}

// Auto-run if called directly
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Atlas Startup - Dashboard Notes Integration');
    console.log('');
    console.log('Usage:');
    console.log('  node startup-notes.cjs           # Load notes and exit');
    console.log('  node startup-notes.cjs --launch  # Load notes then launch clawdbot');
    console.log('  node startup-notes.cjs --watch   # Watch for new notes');
    console.log('');
    return;
  }
  
  if (args.includes('--launch')) {
    // Load notes then launch clawdbot
    await loadNotesForStartup();
    console.log('\n🚀 Launching Atlas...\n');
    const clawdbot = spawn('clawdbot', { stdio: 'inherit' });
    clawdbot.on('exit', code => process.exit(code));
  } else if (args.includes('--watch')) {
    // TODO: Implement watch mode
    console.log('Watch mode not yet implemented');
    process.exit(1);
  } else {
    // Just load notes
    await loadNotesForStartup();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
