#!/usr/bin/env node

/**
 * Atlas Notes CLI
 * Phase 3: Contextual Surfacing
 * 
 * Allows Atlas to search/read notes on demand.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const WORKSPACE = '/home/clawdbot/clawd';
const ALL_NOTES_FILE = path.join(WORKSPACE, 'all-notes.json');
const STARTUP_SCRIPT = path.join(WORKSPACE, 'system/integrations/kv/startup-notes.cjs');

function loadNotes() {
  try {
    if (!fs.existsSync(ALL_NOTES_FILE)) return [];
    const data = fs.readFileSync(ALL_NOTES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading notes:', err.message);
    return [];
  }
}

function listNotes(limit = 10) {
  const notes = loadNotes();
  // Sort by time desc
  notes.sort((a, b) => new Date(b.time) - new Date(a.time));
  
  console.log(`\n📝 Last ${limit} Notes:`);
  notes.slice(0, limit).forEach(n => {
    console.log(`- [${new Date(n.time).toLocaleString()}] ${n.text}`);
  });
}

function searchNotes(query) {
  const notes = loadNotes();
  const results = notes.filter(n => 
    n.text.toLowerCase().includes(query.toLowerCase()) || 
    (n.category && n.category.toLowerCase().includes(query.toLowerCase()))
  );
  
  console.log(`\n🔍 Found ${results.length} notes matching "${query}":`);
  results.sort((a, b) => new Date(b.time) - new Date(a.time));
  results.forEach(n => {
    console.log(`- [${new Date(n.time).toLocaleString()}] ${n.text}`);
  });
}

function refreshNotes() {
  console.log('🔄 Refreshing notes from dashboard...');
  const result = spawnSync('node', [STARTUP_SCRIPT], { stdio: 'inherit', encoding: 'utf-8' });
  if (result.status === 0) {
    console.log('✅ Refresh complete.');
  } else {
    console.error('❌ Refresh failed.');
  }
}

function showHelp() {
  console.log(`
Atlas Notes CLI
Usage:
  node scripts/notes.cjs list [limit]
  node scripts/notes.cjs search <query>
  node scripts/notes.cjs refresh
  `);
}

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'list':
    listNotes(arg ? parseInt(arg) : 10);
    break;
  case 'search':
    if (!arg) { console.error('Please provide a search query'); process.exit(1); }
    searchNotes(arg);
    break;
  case 'refresh':
    refreshNotes();
    break;
  default:
    showHelp();
}
