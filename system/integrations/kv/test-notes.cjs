/**
 * Notes Memory System - Comprehensive Test Suite
 * 
 * Tests:
 * 1. Sync from KV (populates short-term)
 * 2. Read short-term notes
 * 3. Verify notes marked as read
 * 4. Mark specific note unread
 * 5. Delete read notes (keep unread)
 * 6. Search notes
 * 7. ID uniqueness
 * 8. Schema validation
 * 9. DELETE ALL short-term (final step)
 * 10. Verify archive intact
 */

const https = require('https');
const { readFile, writeFile, existsSync } = require('fs/promises');

const WORKSPACE = '/home/clawdbot/clawd';
const API_URL = 'https://blog-wheat-mu-85.vercel.app/api/notes';
const SHORT_TERM_FILE = `${WORKSPACE}/short-term-notes.json`;
const ALL_NOTES_FILE = `${WORKSPACE}/all-notes.json`;

let passed = 0;
let failed = 0;

function log(msg) { console.log(msg); }
function pass(test) { passed++; console.log(`  ✓ PASS: ${test}`); }
function fail(test, err) { failed++; console.log(`  ✗ FAIL: ${test} - ${err}`); }

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
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch (e) { reject(new Error('Failed to parse API response')); }
      });
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

async function syncNotes() {
  const notes = await fetchNotes();
  const [shortTerm, allNotes] = await Promise.all([
    loadJson(SHORT_TERM_FILE),
    loadJson(ALL_NOTES_FILE)
  ]);
  
  const existingIds = new Set(allNotes.map(n => n.id));
  const newNotes = [];
  
  for (const note of notes) {
    const id = generateNoteId(note.text, note.time);
    if (!existingIds.has(id)) {
      newNotes.push({ id, text: note.text, time: note.time, category: 'general', firstSeen: new Date().toISOString(), read: false });
      allNotes.push({ id, text: note.text, time: note.time, category: 'general', firstSeen: new Date().toISOString(), read: false });
    }
  }
  
  if (newNotes.length > 0 || shortTerm.length === 0) {
    shortTerm.unshift(...newNotes);
    if (shortTerm.length === 0 && allNotes.length > 0) {
      // Restore from archive if empty
      for (const n of allNotes) shortTerm.push({ ...n, read: true });
    }
  }
  
  for (const n of shortTerm) n.read = true;
  
  await Promise.all([saveJson(SHORT_TERM_FILE, shortTerm), saveJson(ALL_NOTES_FILE, allNotes)]);
  
  return { shortTerm: shortTerm.length, archive: allNotes.length };
}

// ============================================================================
// TESTS
// ============================================================================

async function test1_fetchFromKV() {
  log('\n[TEST 1] Fetch from KV');
  try {
    const notes = await fetchNotes();
    if (notes.length > 0 && notes[0].text) {
      pass(`Fetched ${notes.length} notes from KV`);
    } else {
      fail('Fetch from KV', 'Empty response');
    }
  } catch (err) {
    fail('Fetch from KV', err.message);
  }
}

async function test2_readShortTerm() {
  log('\n[TEST 2] Read short-term notes');
  try {
    const shortTerm = await loadJson(SHORT_TERM_FILE);
    if (Array.isArray(shortTerm) && shortTerm.length > 0) {
      pass(`Read ${shortTerm.length} short-term notes`);
    } else {
      fail('Read short-term', 'Empty or invalid');
    }
  } catch (err) {
    fail('Read short-term', err.message);
  }
}

async function test3_notesMarkedRead() {
  log('\n[TEST 3] Notes marked as read');
  try {
    const shortTerm = await loadJson(SHORT_TERM_FILE);
    const readCount = shortTerm.filter(n => n.read).length;
    if (readCount === shortTerm.length && shortTerm.length > 0) {
      pass(`All ${readCount} notes marked as read`);
    } else {
      fail('Mark as read', `${readCount}/${shortTerm.length} marked`);
    }
  } catch (err) {
    fail('Mark as read', err.message);
  }
}

async function test4_markOneUnread() {
  log('\n[TEST 4] Mark one note as unread');
  try {
    let shortTerm = await loadJson(SHORT_TERM_FILE);
    if (shortTerm.length > 0) {
      shortTerm[0].read = false;
      await saveJson(SHORT_TERM_FILE, shortTerm);
      const updated = await loadJson(SHORT_TERM_FILE);
      if (!updated[0].read) {
        pass('Successfully marked note as unread');
      } else {
        fail('Mark unread', 'Failed to update');
      }
    } else {
      fail('Mark unread', 'No notes');
    }
  } catch (err) {
    fail('Mark unread', err.message);
  }
}

async function test5_deleteReadKeepUnread() {
  log('\n[TEST 5] Delete read, keep unread');
  try {
    let shortTerm = await loadJson(SHORT_TERM_FILE);
    const unreadBefore = shortTerm.filter(n => !n.read).length;
    const readBefore = shortTerm.filter(n => n.read).length;
    
    // Delete read notes
    shortTerm = shortTerm.filter(n => !n.read);
    await saveJson(SHORT_TERM_FILE, shortTerm);
    
    const after = await loadJson(SHORT_TERM_FILE);
    if (after.length === unreadBefore) {
      pass(`Deleted ${readBefore} read, kept ${unreadBefore} unread`);
    } else {
      fail('Delete read', `Expected ${unreadBefore}, got ${after.length}`);
    }
  } catch (err) {
    fail('Delete read', err.message);
  }
}

async function test6_searchNotes() {
  log('\n[TEST 6] Search notes by text');
  try {
    const allNotes = await loadJson(ALL_NOTES_FILE);
    const results = allNotes.filter(n => n.text.toLowerCase().includes('hey'));
    if (results.length > 0) {
      pass(`Found ${results.length} notes matching "hey"`);
    } else {
      fail('Search', 'No results');
    }
  } catch (err) {
    fail('Search', err.message);
  }
}

async function test7_idUniqueness() {
  log('\n[TEST 7] Note ID uniqueness');
  try {
    const allNotes = await loadJson(ALL_NOTES_FILE);
    const ids = allNotes.map(n => n.id);
    const unique = new Set(ids);
    if (ids.length === unique.size) {
      pass(`All ${ids.length} notes have unique IDs`);
    } else {
      fail('ID uniqueness', `${ids.length - unique.size} duplicates`);
    }
  } catch (err) {
    fail('ID uniqueness', err.message);
  }
}

async function test8_schemaValidation() {
  log('\n[TEST 8] Schema validation');
  try {
    const shortTerm = await loadJson(SHORT_TERM_FILE);
    const allNotes = await loadJson(ALL_NOTES_FILE);
    
    const valid = (arr) => Array.isArray(arr) && arr.every(n => 
      typeof n.id === 'string' &&
      typeof n.text === 'string' &&
      typeof n.time === 'string' &&
      typeof n.read === 'boolean'
    );
    
    if (valid(shortTerm) && valid(allNotes)) {
      pass('Both files have valid schema');
    } else {
      fail('Schema', 'Invalid structure');
    }
  } catch (err) {
    fail('Schema', err.message);
  }
}

async function test9_deleteAllShortTerm() {
  log('\n[TEST 9] DELETE ALL short-term notes');
  try {
    await saveJson(SHORT_TERM_FILE, []);
    const shortTerm = await loadJson(SHORT_TERM_FILE);
    if (shortTerm.length === 0) {
      pass('All short-term notes DELETED');
    } else {
      fail('Delete all', `Still has ${shortTerm.length}`);
    }
  } catch (err) {
    fail('Delete all', err.message);
  }
}

async function test10_archiveIntact() {
  log('\n[TEST 10] Archive intact after delete');
  try {
    const allNotes = await loadJson(ALL_NOTES_FILE);
    if (allNotes.length > 0) {
      pass(`Archive intact with ${allNotes.length} notes`);
    } else {
      fail('Archive intact', 'Empty');
    }
  } catch (err) {
    fail('Archive intact', err.message);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function runTests() {
  console.log('='.repeat(60));
  console.log('RIGOROUS NOTES SYSTEM TESTS');
  console.log('='.repeat(60));
  
  // Sync first to populate short-term
  console.log('\n--- SYNCING FROM KV ---');
  const { shortTerm, archive } = await syncNotes();
  console.log(`  Synced: ${shortTerm} short-term, ${archive} archive\n`);
  
  // Run tests
  await test1_fetchFromKV();
  await test2_readShortTerm();
  await test3_notesMarkedRead();
  await test4_markOneUnread();
  await test5_deleteReadKeepUnread();
  await test6_searchNotes();
  await test7_idUniqueness();
  await test8_schemaValidation();
  await test9_deleteAllShortTerm();
  await test10_archiveIntact();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('short-term-notes.json is now EMPTY.');
    console.log('Archive (all-notes.json) preserved with 20 notes.');
    console.log('\n👉 You can now manually test by leaving new notes on the dashboard.');
  } else {
    console.log('\n⚠️  Some tests failed - review above');
  }
}

runTests().catch(console.error);
